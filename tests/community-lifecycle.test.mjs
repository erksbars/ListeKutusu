import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createCommunities, CommunityError } from "../lib/communities.ts";
import { createCommunityLifecycle } from "../lib/communityLifecycle.ts";
import { createCommunityEvents } from "../lib/communityEvents.ts";
import { processEventNotificationBatch } from "../lib/communityEventOutbox.ts";
import { communityGeneralFeed } from "../lib/communityGeneralFeed.ts";
import { discoverCommunityEvents } from "../lib/communityDiscovery.ts";
import { deleteAccountData } from "../lib/accountDeletion.ts";
import { communityHealth } from "../lib/communityHealth.ts";
const denied = status => error => error instanceof CommunityError && error.status === status;
const now = new Date("2026-10-17T12:00:00Z");
test("sahiplik devri, arşiv, hesap kapatma ve yarış sınırları", async t => {
  const dir = await mkdtemp(path.join(tmpdir(), "listekutusu-lifecycle-"));
  const config = { datasources: { db: { url: `file:${path.join(dir, "test.db").replaceAll("\\", "/")}` } } };
  const db = new PrismaClient(config), db2 = new PrismaClient(config);
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) {
      for (const sql of (await readFile(new URL(`${folder}/migration.sql`, root), "utf8")).split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(sql);
    }
    for (const id of ["owner", "alice", "bob", "outsider", "mod", "closer", "next", "joiner", "solo"]) await db.userList.create({ data: { id, slug: id, ownerName: id, passwordHash: "verified-test-hash" } });
    const communities = createCommunities(db), lifecycle = createCommunityLifecycle(db, () => now), events = createCommunityEvents(db, () => now);
    const input = { name: "Yaşam Döngüsü", description: "Sahiplik ve arşiv için geçici test topluluğu.", category: "interest", rules: "Gerçek buluşma veya gerçek hesap değildir." };
    const { slug } = await communities.create("owner", input);
    const community = await db.community.findUniqueOrThrow({ where: { slug } });
    for (const id of ["alice", "bob", "mod"]) await communities.mutate(slug, id, { action: "join" });
    await communities.mutate(slug, "owner", { action: "moderate-member", userId: "mod", operation: "promote" });
    const offer = async (who = "owner", target = "alice", targetSlug = slug) => lifecycle.mutate(targetSlug, who, { action: "offer", toUserId: target, confirmation: "SAHİPLİĞİ DEVRET" });
    const pending = () => db.communityOwnershipOffer.findUniqueOrThrow({ where: { communityId: community.id } });
    await t.test("teklif yetkisi, açık onay, üyelik, engel ve özel inbox", async () => {
      await assert.rejects(offer("mod"), denied(403)); await assert.rejects(offer("owner", "owner"), denied(400));
      await assert.rejects(offer("owner", "outsider"), denied(403));
      await assert.rejects(lifecycle.mutate(slug, "owner", { action: "offer", toUserId: "alice" }), denied(400));
      await db.userBlock.create({ data: { blockerId: "alice", blockedId: "owner" } });
      await assert.rejects(offer(), denied(404)); await db.userBlock.deleteMany();
      await offer();
      assert.equal((await db.community.findUniqueOrThrow({ where: { id: community.id } })).ownerId, "owner");
      assert.equal((await lifecycle.incoming("alice")).offers.length, 1);
      assert.equal((await lifecycle.incoming("bob")).offers.length, 0);
      assert.equal((await lifecycle.read(slug, "bob")).offer, null);
      await assert.rejects(lifecycle.read(slug, null), denied(401));
      const previous = await pending(); await offer(); assert.equal((await pending()).id, previous.id);
      await assert.rejects(offer("owner", "bob"), denied(409));
      await assert.rejects(lifecycle.mutate(slug, "bob", { action: "accept", offerId: previous.id, confirmation: "SAHİPLİĞİ KABUL ET" }), denied(403));
      await lifecycle.mutate(slug, "alice", { action: "decline", offerId: previous.id });
      assert.equal(await db.communityOwnershipOffer.count(), 0);
    });
    await t.test("iptal/eski ID/son kullanma, ayrılma ve uzaklaştırma teklifi geçersiz kılar", async () => {
      await offer(); const old = await pending();
      await lifecycle.mutate(slug, "owner", { action: "cancel", offerId: old.id });
      await offer(); const fresh = await pending(); assert.notEqual(old.id, fresh.id);
      await assert.rejects(lifecycle.mutate(slug, "alice", { action: "accept", offerId: old.id, confirmation: "SAHİPLİĞİ KABUL ET" }), denied(409));
      await db.communityOwnershipOffer.update({ where: { communityId: community.id }, data: { expiresAt: now } });
      await assert.rejects(lifecycle.mutate(slug, "alice", { action: "accept", offerId: fresh.id, confirmation: "SAHİPLİĞİ KABUL ET" }), denied(409));
      await offer(); await communities.mutate(slug, "alice", { action: "leave" }); assert.equal(await db.communityOwnershipOffer.count(), 0);
      await communities.mutate(slug, "alice", { action: "join" }); await offer();
      await communities.mutate(slug, "owner", { action: "moderate-member", userId: "alice", operation: "ban" });
      assert.equal(await db.communityOwnershipOffer.count(), 0);
      await communities.mutate(slug, "owner", { action: "moderate-member", userId: "alice", operation: "unban" });
    });
    await t.test("kabul iki onayı atomik uygular; eski sahibi normal üye; log hatası rollback", async () => {
      await offer(); const current = await pending();
      await assert.rejects(lifecycle.mutate(slug, "alice", { action: "accept", offerId: current.id }), denied(400));
      await db.$executeRawUnsafe("CREATE TRIGGER fail_transfer_audit BEFORE INSERT ON CommunityModerationLog WHEN NEW.action = 'accept-ownership' BEGIN SELECT RAISE(ABORT, 'audit unavailable'); END");
      await assert.rejects(lifecycle.mutate(slug, "alice", { action: "accept", offerId: current.id, confirmation: "SAHİPLİĞİ KABUL ET" }));
      assert.equal((await db.community.findUniqueOrThrow({ where: { id: community.id } })).ownerId, "owner");
      assert.equal((await pending()).id, current.id); await db.$executeRawUnsafe("DROP TRIGGER fail_transfer_audit");
      await lifecycle.mutate(slug, "alice", { action: "accept", offerId: current.id, confirmation: "SAHİPLİĞİ KABUL ET" });
      assert.equal((await db.community.findUniqueOrThrow({ where: { id: community.id } })).ownerId, "alice");
      assert.equal((await db.communityMember.findUniqueOrThrow({ where: { communityId_userId: { communityId: community.id, userId: "owner" } } })).role, "member");
      assert.equal(await db.communityMember.count({ where: { communityId: community.id, role: "owner" } }), 1);
      await assert.rejects(lifecycle.mutate(slug, "owner", { action: "archive", confirmation: "TOPLULUĞU ARŞİVLE" }), denied(403));
      await assert.rejects(lifecycle.mutate(slug, "alice", { action: "accept", offerId: current.id, confirmation: "SAHİPLİĞİ KABUL ET" }), denied(409));
    });
    const eventInput = { title: "Kurgusal etkinlik", description: "Yalnız otomatik yaşam döngüsü testi duyurusudur.", localStart: "2026-11-20T18:30", city: "Ankara", venue: "Örnek kamusal mekân", publicLocationConfirmed: true, distribution: "general" };
    let eventId, postId;
    await t.test("arşiv; içeriği tutar, yaklaşan etkinliği iptal eder, snapshot teslimi ve readonly sınırı", async () => {
      postId = (await communities.mutate(slug, "bob", { action: "create-post", title: "Korunan paylaşım", body: "Arşivlenirken silinmemeli.", distribution: "general" })).post.id;
      eventId = (await events.create(slug, "bob", eventInput)).event.id;
      await events.respond(slug, eventId, "owner", "attending");
      await lifecycle.mutate(slug, "alice", { action: "offer", toUserId: "owner", confirmation: "SAHİPLİĞİ DEVRET" });
      await lifecycle.mutate(slug, "alice", { action: "archive", confirmation: "TOPLULUĞU ARŞİVLE" });
      assert.equal(await db.communityOwnershipOffer.count(), 0);
      assert.equal((await communities.detail(slug, null, 1)).community.status, "archived");
      assert.equal((await communities.post(slug, postId, null, 1)).post.body, "Arşivlenirken silinmemeli.");
      assert.equal((await events.detail(slug, eventId, "bob")).canManage, false);
      assert.equal((await events.detail(slug, eventId, "owner")).event.viewerStatus, "withdrawn");
      assert.equal((await communityGeneralFeed(db, null, null, "all", now)).items.length, 0);
      assert.equal((await discoverCommunityEvents(db, null, {}, 1, now)).total, 0);
      assert.equal((await communities.directory(null, "", "", 1)).total, 0);
      assert.equal((await communities.directory("alice", "", "", 1, true)).total, 1);
      for (const action of ["create-post", "comment", "remove-post", "set-distribution", "report"]) await assert.rejects(communities.mutate(slug, "bob", { action, postId, body: "Yeterli açıklama", title: "Yeni başlık", reason: "Örnek neden", distribution: "general" }), denied(409));
      await assert.rejects(communities.mutate(slug, "outsider", { action: "join" }), denied(409));
      await assert.rejects(events.respond(slug, eventId, "owner", "attending"), denied(409));
      await assert.rejects(events.create(slug, "bob", eventInput), denied(409));
      await assert.rejects(events.manage(slug, eventId, "bob", "remove"), denied(409));
      const result = await processEventNotificationBatch(db, { now: new Date(Math.max(Date.now(), now.getTime()) + 1000) });
      assert.equal(result.delivered, 2); // Bob organizer + previous owner responder.
      assert.equal(await db.notification.count({ where: { communityEventId: eventId, type: "community_event_cancelled" } }), 2);
    });
    await t.test("yeniden açma iptal/RSVP diriltmez; arşivde üye ayrılabilir", async () => {
      await communities.mutate(slug, "owner", { action: "leave" });
      await lifecycle.mutate(slug, "alice", { action: "restore", confirmation: "TOPLULUĞU YENİDEN AÇ" });
      assert.equal((await events.detail(slug, eventId, null)).event.status, "cancelled");
      assert.equal(await db.communityEventRsvp.count({ where: { eventId, status: "attending" } }), 0);
      assert.equal((await communities.post(slug, postId, null, 1)).post.body, "Arşivlenirken silinmemeli.");
    });
    await t.test("kurucu silme açık arşiv onayı ister; eski istemcinin sahipsiz silmesi ve şifre yarışı engellenir", async () => {
      const mine = await communities.create("closer", input);
      await communities.mutate(mine.slug, "next", { action: "join" });
      await assert.rejects(deleteAccountData(db, "closer", "verified-test-hash", false, now), denied(409));
      await assert.rejects(deleteAccountData(db, "closer", "wrong-server-hash", true, now), denied(409));
      const otherEvent = (await events.create(mine.slug, "next", eventInput)).event.id;
      await events.respond(mine.slug, otherEvent, "closer", "attending");
      await lifecycle.mutate(mine.slug, "closer", { action: "offer", toUserId: "next", confirmation: "SAHİPLİĞİ DEVRET" });
      await deleteAccountData(db, "closer", "verified-test-hash", true, now);
      assert.equal((await communities.detail(mine.slug, null, 1)).community.status, "archived");
      assert.equal((await events.detail(mine.slug, otherEvent, "next")).event.status, "cancelled");
      assert.equal(await db.communityOwnershipOffer.count(), 0);
      assert.equal((await db.userList.findUniqueOrThrow({ where: { id: "closer" } })).status, "deleted");
      assert.equal((await communityHealth(db, now)).checks.find(check => check.key === "inactive-owner").count, 0);
      const solo = await communities.create("solo", input);
      await deleteAccountData(db, "solo", "verified-test-hash", true, now);
      assert.equal((await communities.detail(solo.slug, null, 1)).community.status, "archived");
    });
    await t.test("silme/kabul/katılım yarışı aktif sahipsiz topluluk veya canlanan RSVP bırakmaz", async () => {
      await db.userList.update({ where: { id: "closer" }, data: { status: "active", passwordHash: "verified-test-hash" } });
      const race = await communities.create("closer", input);
      await communities.mutate(race.slug, "next", { action: "join" });
      await lifecycle.mutate(race.slug, "closer", { action: "offer", toUserId: "next", confirmation: "SAHİPLİĞİ DEVRET" });
      const target = await db.community.findUniqueOrThrow({ where: { slug: race.slug } });
      const current = await db.communityOwnershipOffer.findUniqueOrThrow({ where: { communityId: target.id } });
      const results = await Promise.allSettled([
        deleteAccountData(db, "closer", "verified-test-hash", true, now),
        createCommunityLifecycle(db2, () => now).mutate(race.slug, "next", { action: "accept", offerId: current.id, confirmation: "SAHİPLİĞİ KABUL ET" }),
        createCommunities(db2).mutate(race.slug, "joiner", { action: "join" }),
      ]);
      assert.ok(results.some(result => result.status === "fulfilled"));
      const final = await db.community.findUniqueOrThrow({ where: { id: target.id } });
      if (final.status === "active") assert.equal((await db.userList.findUniqueOrThrow({ where: { id: final.ownerId } })).status, "active");
      assert.equal(await db.communityMember.count({ where: { communityId: target.id, role: "owner", userId: final.ownerId } }), 1);
      assert.equal(await db.communityOwnershipOffer.count({ where: { communityId: target.id } }), 0);
    });
    await t.test("arşiv log hatası etkinlik/outbox/hesap kapatmayı geri alır; RSVP yarışı koltuk diriltmez", async () => {
      const mine = await communities.create("owner", input);
      await communities.mutate(mine.slug, "bob", { action: "join" });
      const id = (await events.create(mine.slug, "owner", eventInput)).event.id;
      await db.$executeRawUnsafe("CREATE TRIGGER fail_archive_audit BEFORE INSERT ON CommunityModerationLog WHEN NEW.action = 'archive-community' BEGIN SELECT RAISE(ABORT, 'audit unavailable'); END");
      await assert.rejects(lifecycle.mutate(mine.slug, "owner", { action: "archive", confirmation: "TOPLULUĞU ARŞİVLE" }));
      await assert.rejects(deleteAccountData(db, "owner", "verified-test-hash", true, now));
      assert.equal((await db.community.findUniqueOrThrow({ where: { slug: mine.slug } })).status, "active");
      assert.equal((await db.communityEvent.findUniqueOrThrow({ where: { id } })).status, "scheduled");
      assert.equal(await db.communityEventNotificationJob.count({ where: { eventId: id } }), 0);
      assert.equal((await db.userList.findUniqueOrThrow({ where: { id: "owner" } })).status, "active");
      await db.$executeRawUnsafe("DROP TRIGGER fail_archive_audit");
      await Promise.allSettled([
        lifecycle.mutate(mine.slug, "owner", { action: "archive", confirmation: "TOPLULUĞU ARŞİVLE" }),
        createCommunityEvents(db2, () => now).respond(mine.slug, id, "bob", "attending"),
      ]);
      assert.equal((await db.community.findUniqueOrThrow({ where: { slug: mine.slug } })).status, "archived");
      assert.equal(await db.communityEventRsvp.count({ where: { eventId: id, status: "attending" } }), 0);
    });
    await t.test("sahibi olmayan hesap kapanabilir; kendi yaklaşan etkinliği ve başkasındaki niyeti kapanır", async () => {
      await communities.mutate(slug, "next", { action: "join" });
      const id = (await events.create(slug, "bob", eventInput)).event.id;
      await events.respond(slug, id, "next", "attending");
      const otherId = (await events.create(slug, "alice", eventInput)).event.id;
      await events.respond(slug, otherId, "bob", "attending");
      await deleteAccountData(db, "bob", "verified-test-hash", false, now);
      assert.equal((await db.communityEvent.findUniqueOrThrow({ where: { id } })).status, "cancelled");
      assert.equal(await db.communityModerationLog.count({ where: { targetId: id, action: "cancel-event" } }), 1);
      assert.equal(await db.communityEventRsvp.count({ where: { eventId: { in: [id, otherId] }, status: "attending" } }), 0);
      assert.equal((await db.community.findUniqueOrThrow({ where: { id: community.id } })).status, "active");
    });
  } finally { await db.$disconnect(); await db2.$disconnect(); await rm(dir, { recursive: true, force: true }); }
});
