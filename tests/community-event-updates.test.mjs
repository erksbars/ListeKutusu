import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createCommunityEvents } from "../lib/communityEvents.ts";
import { CommunityError, createCommunities } from "../lib/communities.ts";
import { notificationVisibility } from "../lib/communityEventNotifications.ts";
import { processEventNotificationBatch } from "../lib/communityEventOutbox.ts";
import { groupNotifications, messageForNotificationGroup, targetForNotification } from "../lib/notificationPresentation.ts";
const denied = status => error => error instanceof CommunityError && error.status === status;
test("etkinlik düzenleme, kapasite, sürüm, atomik bildirim ve görünürlük", async t => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-event-updates-"));
  const url = `file:${path.join(directory, "test.db").replaceAll("\\", "/")}`;
  const db = new PrismaClient({ datasources: { db: { url } } }), db2 = new PrismaClient({ datasources: { db: { url } } });
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) {
      const sql = await readFile(new URL(`${folder}/migration.sql`, root), "utf8");
      for (const statement of sql.split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(statement);
    }
    for (const id of ["owner", "alice", "bob", "carol", "interested", "withdrawn", "blocked", "moderator", "outsider"]) await db.userList.create({ data: { id, slug: id, ownerName: id } });
    const communities = createCommunities(db), events = createCommunityEvents(db, () => new Date("2026-10-15T12:00:00Z"));
    const { slug } = await communities.create("owner", { name: "Etkinlik Kulübü", description: "Etkinlik düzenlemelerini test ediyoruz.", category: "interest", rules: "Saygılı ol ve özel adres paylaşma." });
    for (const id of ["alice", "bob", "carol", "interested", "withdrawn", "blocked", "moderator"]) await communities.mutate(slug, id, { action: "join" });
    await communities.mutate(slug, "owner", { action: "moderate-member", userId: "moderator", operation: "promote" });
    const input = { title: "Etkinlik başlığı", description: "Kurgusal etkinlik hakkında yeterince uzun açıklama.", localStart: "2026-11-20T18:30", city: "Örnek şehir", venue: "Kamusal örnek mekân", capacity: 4, publicLocationConfirmed: true };
    const eventId = (await events.create(slug, "owner", input)).event.id;
    for (const id of ["alice", "bob", "carol"]) await events.respond(slug, eventId, id, "attending");
    for (const id of ["interested", "withdrawn", "blocked"]) await events.respond(slug, eventId, id, "interested");
    await events.respond(slug, eventId, "withdrawn", "withdrawn");
    await db.userBlock.create({ data: { blockerId: "blocked", blockedId: "owner" } });
    await t.test("yetkisiz/eski sürüm/aşırı kapasite azaltma kaydı ve bildirimleri değiştirmez", async () => {
      await assert.rejects(events.update(slug, eventId, "alice", { ...input, expectedVersion: 0 }), denied(403));
      await assert.rejects(events.update(slug, eventId, "outsider", { ...input, expectedVersion: 0 }), denied(403));
      await assert.rejects(events.update(slug, eventId, "owner", { ...input, capacity: 2, expectedVersion: 0 }), denied(409));
      await assert.rejects(events.update(slug, eventId, "owner", { ...input, expectedVersion: 99 }), denied(409));
      assert.equal(await db.notification.count(), 0); assert.equal((await events.detail(slug, eventId, "owner")).event.capacity, 4);
      await events.update(slug, eventId, "owner", { ...input, expectedVersion: 0 });
      assert.equal(await db.notification.count(), 0); assert.equal((await events.detail(slug, eventId, "owner")).event.contentVersion, 0);
    });
    await t.test("gerçek değişiklik uygun attending/interested alıcılarına tek bildirim üretir", async () => {
      await events.update(slug, eventId, "owner", { ...input, venue: "Yeni kamusal mekân", capacity: 3, expectedVersion: 0 });
      assert.equal(await db.notification.count(), 0);
      await processEventNotificationBatch(db);
      const notices = await db.notification.findMany({ where: { type: "community_event_updated" } });
      assert.deepEqual(notices.map(item => item.userId).sort(), ["alice", "bob", "carol", "interested"]);
      assert.equal((await events.detail(slug, eventId, "alice")).event.viewerStatus, "attending");
      await assert.rejects(events.update(slug, eventId, "owner", { ...input, expectedVersion: 0 }), denied(409));
      assert.equal(await db.notification.count(), 4);
      assert.equal(await db.notification.count({ where: notificationVisibility("alice") }), 1);
      await db.userBlock.create({ data: { blockerId: "owner", blockedId: "alice" } });
      assert.equal(await db.notification.count({ where: notificationVisibility("alice") }), 0);
      await db.userBlock.deleteMany({ where: { blockerId: "owner", blockedId: "alice" } });
    });
    await t.test("moderatör değişikliği düzenleyene ulaşır; içerik sürümü RSVP'den bağımsızdır", async () => {
      const current = await db.communityEvent.findUniqueOrThrow({ where: { id: eventId } });
      await events.respond(slug, eventId, "interested", "interested");
      await events.update(slug, eventId, "moderator", { ...input, venue: "Yeni kamusal mekân", capacity: 3, title: "Moderatör güncellemesi", expectedVersion: current.contentVersion });
      await processEventNotificationBatch(db);
      assert.equal(await db.notification.count({ where: { userId: "owner", type: "community_event_updated" } }), 1);
    });
    await t.test("kapasite düşürme ve katılım yarışı aşırı doluluk oluşturmaz", async () => {
      const raceId = (await events.create(slug, "owner", input)).event.id;
      for (const id of ["alice", "bob"]) await events.respond(slug, raceId, id, "attending");
      const second = createCommunityEvents(db2, () => new Date("2026-10-15T12:00:00Z"));
      const result = await Promise.allSettled([events.update(slug, raceId, "owner", { ...input, capacity: 2, expectedVersion: 0 }), second.respond(slug, raceId, "carol", "attending")]);
      assert.ok(result.some(item => item.status === "fulfilled"));
      for (const item of result) if (item.status === "rejected") assert.ok(denied(409)(item.reason));
      const final = (await events.detail(slug, raceId, "owner")).event;
      assert.ok(final.attendingCount <= final.capacity);
    });
    await t.test("iptal bildirimi tercihler çekilmeden üretilir, tekrar iptal çoğaltmaz", async () => {
      await events.manage(slug, eventId, "owner", "cancel");
      while ((await processEventNotificationBatch(db)).status === "processed") { /* drain committed jobs */ }
      assert.equal(await db.notification.count({ where: { communityEventId: eventId, type: "community_event_cancelled" } }), 4);
      await events.manage(slug, eventId, "owner", "cancel");
      assert.equal(await db.notification.count({ where: { communityEventId: eventId, type: "community_event_cancelled" } }), 4);
      await assert.rejects(events.update(slug, eventId, "owner", { ...input, expectedVersion: 3 }), denied(409));
      assert.equal((await events.detail(slug, eventId, "alice")).event.viewerStatus, "withdrawn");
      await communities.mutate(slug, "interested", { action: "leave" });
      assert.equal(await db.notification.count({ where: notificationVisibility("interested") }), 0);
    });
    await t.test("sunum etkinlikleri doğru gruplar ve güvenli hedefe yönlendirir", () => {
      const base = { id: "n1", type: "community_event_updated", actor: null, post: null, forumThread: null, readAt: null, createdAt: "2026-10-15T12:00:00Z", communityEvent: { id: eventId, title: "Başlık", status: "scheduled", community: { slug } } };
      const groups = groupNotifications([base, { ...base, id: "n2" }]);
      assert.equal(groups.length, 1); assert.match(messageForNotificationGroup(groups[0]), /güncellendi/);
      assert.match(targetForNotification(base), /section=events&event=/);
      assert.equal(targetForNotification({ ...base, communityEvent: { ...base.communityEvent, status: "removed" } }), `/communities/${slug}?section=events`);
    });
    await t.test("doğrudan kaldırma bildirimi geçerli alıcıya kalır, detay artık okunamaz", async () => {
      const removeId = (await events.create(slug, "owner", input)).event.id;
      await events.respond(slug, removeId, "alice", "attending");
      await events.manage(slug, removeId, "owner", "remove");
      await processEventNotificationBatch(db);
      assert.equal(await db.notification.count({ where: { ...notificationVisibility("alice"), communityEventId: removeId, type: "community_event_removed" } }), 1);
      await assert.rejects(events.detail(slug, removeId, "alice"), denied(404));
    });
  } finally { await Promise.all([db.$disconnect(), db2.$disconnect()]); await rm(directory, { recursive: true, force: true }); }
});
