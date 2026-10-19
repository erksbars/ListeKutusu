import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createCommunities } from "../lib/communities.ts";
import { createCommunityEvents } from "../lib/communityEvents.ts";
import { notifyEventResponders } from "../lib/communityEventNotifications.ts";
import { eventOutboxStatus, processEventNotificationBatch, retryFailedEventNotifications } from "../lib/communityEventOutbox.ts";

test("kalıcı etkinlik outbox: snapshot, batch, restart, yarış ve hata kurtarma", async t => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-event-outbox-"));
  const config = { datasources: { db: { url: `file:${path.join(directory, "test.db").replaceAll("\\", "/")}` } } };
  let db = new PrismaClient(config);
  const secondDb = new PrismaClient(config);
  const future = () => new Date(Date.now() + 86_400_000);
  async function drain() {
    for (let i = 0; i < 100; i++) {
      const result = await processEventNotificationBatch(db, { now: future() });
      if (result.status === "idle") return;
      assert.equal(result.status, "processed");
    }
    assert.fail("Unexpected non-draining outbox");
  }
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) {
      for (const sql of (await readFile(new URL(`${folder}/migration.sql`, root), "utf8")).split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(sql);
    }
    const ids = Array.from({ length: 123 }, (_, i) => `member-${String(i).padStart(3, "0")}`);
    await db.userList.createMany({ data: ["owner", "moderator", "late", ...ids].map(id => ({ id, slug: id, ownerName: id })) });
    const communities = () => createCommunities(db);
    const { slug } = await communities().create("owner", { name: "Outbox Denemesi", description: "Kalıcı bildirim kuyruğunun test topluluğu.", category: "interest", rules: "Gerçek etkinlik veya gerçek hesap değildir." });
    const community = await db.community.findUniqueOrThrow({ where: { slug } });
    await db.communityMember.createMany({ data: ids.map(userId => ({ communityId: community.id, userId })) });
    await communities().mutate(slug, "moderator", { action: "join" });
    await communities().mutate(slug, "owner", { action: "moderate-member", userId: "moderator", operation: "promote" });
    const events = () => createCommunityEvents(db, () => new Date("2026-10-15T12:00:00Z"));
    const input = { title: "Kuyruk örneği", description: "Yalnız otomatik test için kurgusal etkinlik açıklaması.", localStart: "2026-11-20T18:30", city: "İstanbul", venue: "Kurgusal kamusal mekân", publicLocationConfirmed: true };
    async function createEvent(users = ids) {
      const id = (await events().create(slug, "owner", input)).event.id;
      await db.communityEventRsvp.createMany({ data: users.map(userId => ({ eventId: id, userId, status: "interested" })) });
      return id;
    }
    await t.test("etkinlik ve kuyruk aynı transaction; başarısız işlem ikisini de geri alır", async () => {
      const id = await createEvent(ids.slice(0, 2));
      await assert.rejects(db.$transaction(async tx => {
        await tx.communityEvent.update({ where: { id }, data: { title: "Geri alınmalı" } });
        await notifyEventResponders(tx, { id, communityId: community.id, organizerId: "owner" }, "owner", 1, "community_event_updated");
        throw new Error("rollback");
      }), /rollback/);
      assert.equal((await db.communityEvent.findUniqueOrThrow({ where: { id } })).title, input.title);
      assert.equal(await db.communityEventNotificationJob.count(), 0);
      assert.equal(await db.communityEventNotificationRecipient.count(), 0);
    });
    await t.test("123 alıcı tek snapshot; request bildirim yazmaz; restart sonrası 50'lik batch", async () => {
      const id = await createEvent();
      await events().update(slug, id, "owner", { ...input, title: "Büyük kitle güncellemesi", expectedVersion: 0 });
      assert.equal(await db.notification.count({ where: { communityEventId: id } }), 0);
      assert.equal(await db.communityEventNotificationJob.count({ where: { eventId: id } }), 1);
      assert.equal(await db.communityEventNotificationRecipient.count(), 123);
      await db.$disconnect(); db = new PrismaClient(config);
      const batch = await processEventNotificationBatch(db, { now: future() });
      assert.equal(batch.delivered, 50); assert.equal(batch.status, "processed");
      assert.equal(await db.communityEventNotificationRecipient.count(), 73);
      await drain();
      assert.equal(await db.notification.count({ where: { communityEventId: id } }), 123);
      assert.equal((await eventOutboxStatus(db)).pending, 0);
      const job = await db.communityEventNotificationJob.findFirstOrThrow({ where: { eventId: id } });
      assert.ok(job.completedAt);
      await db.$transaction(tx => notifyEventResponders(tx, { id, communityId: community.id, organizerId: "owner" }, "owner", 1, "community_event_updated"));
      assert.equal(await db.communityEventNotificationRecipient.count(), 0);
      assert.equal((await processEventNotificationBatch(db)).status, "idle");
    });
    await t.test("iptal öncesi snapshot korunur; sonradan katılanlar eski bildirimi almaz", async () => {
      const id = await createEvent(ids.slice(0, 3));
      await events().manage(slug, id, "owner", "cancel");
      assert.equal(await db.communityEventRsvp.count({ where: { eventId: id, status: "interested" } }), 0);
      const job = await db.communityEventNotificationJob.findFirstOrThrow({ where: { eventId: id } });
      assert.equal(await db.communityEventNotificationRecipient.count({ where: { jobId: job.id } }), 3);
      await communities().mutate(slug, "late", { action: "join" });
      await db.communityEventRsvp.create({ data: { eventId: id, userId: "late", status: "interested" } });
      await drain();
      assert.equal(await db.notification.count({ where: { communityEventId: id, type: "community_event_cancelled" } }), 3);
      assert.equal(await db.notification.count({ where: { communityEventId: id, userId: "late" } }), 0);
    });
    await t.test("iki worker aynı alıcıyı çoğaltmaz, eski batch güncel ilerlemeyi ezmez", async () => {
      const id = await createEvent(ids.slice(0, 21));
      await events().manage(slug, id, "moderator", "remove");
      await Promise.all([processEventNotificationBatch(db, { now: future(), batchSize: 7 }), processEventNotificationBatch(secondDb, { now: future(), batchSize: 7 })]);
      await drain();
      const notices = await db.notification.findMany({ where: { communityEventId: id } });
      assert.equal(notices.length, 22); // 21 responders + organizer, excluding acting moderator.
      assert.equal(new Set(notices.map(item => item.userId)).size, 22);
      assert.ok(notices.some(item => item.userId === "owner"));
    });
    await t.test("teslimde yeniden üyelik/hesap/iki yönlü engel filtresi; atlananlar geri dirilmez", async () => {
      const id = await createEvent(ids.slice(0, 6));
      await events().update(slug, id, "owner", { ...input, title: "Gizlilik güncellemesi", expectedVersion: 0 });
      await communities().mutate(slug, ids[0], { action: "leave" });
      await communities().mutate(slug, "owner", { action: "moderate-member", userId: ids[1], operation: "ban" });
      await db.userList.update({ where: { id: ids[2] }, data: { status: "deleted" } });
      await db.userBlock.createMany({ data: [{ blockerId: "owner", blockedId: ids[3] }, { blockerId: ids[4], blockedId: "owner" }] });
      const result = await processEventNotificationBatch(db, { now: future() });
      assert.equal(result.delivered, 1); assert.equal(result.skipped, 5);
      assert.equal(await db.notification.count({ where: { communityEventId: id } }), 1);
      await communities().mutate(slug, ids[0], { action: "join" });
      await communities().mutate(slug, "owner", { action: "moderate-member", userId: ids[1], operation: "unban" });
      await db.userList.update({ where: { id: ids[2] }, data: { status: "active" } });
      await db.userBlock.deleteMany(); await drain();
      assert.equal(await db.notification.count({ where: { communityEventId: id } }), 1);
    });
    await t.test("batch hatası tam rollback; kalıcı backoff/5 hata/manuel yeniden deneme/readAt korunur", async () => {
      const id = await createEvent(ids.slice(0, 2));
      await events().manage(slug, id, "owner", "remove");
      const job = await db.communityEventNotificationJob.findFirstOrThrow({ where: { eventId: id } });
      const readAt = new Date("2026-10-15T12:00:00Z");
      await db.notification.create({ data: { id: `${job.id}:${ids[0]}`, communityEventId: id, userId: ids[0], actorId: "owner", type: job.type, readAt } });
      await db.$executeRawUnsafe(`CREATE TRIGGER fail_event_delivery BEFORE INSERT ON Notification WHEN NEW.userId = 'member-001' BEGIN SELECT RAISE(ABORT, 'PRIVATE_PAYLOAD_MUST_NOT_BE_STORED'); END`);
      let now = future();
      for (let failure = 1; failure <= 5; failure++) {
        const result = await processEventNotificationBatch(db, { now });
        assert.equal(result.status, failure === 5 ? "failed" : "retry");
        const current = await db.communityEventNotificationJob.findUniqueOrThrow({ where: { id: job.id } });
        assert.equal(current.failures, failure); assert.equal(current.completedAt, null);
        assert.equal(current.errorCode.includes("PRIVATE_PAYLOAD"), false);
        assert.equal(await db.communityEventNotificationRecipient.count({ where: { jobId: job.id } }), 2);
        assert.equal((await processEventNotificationBatch(db, { now })).status, "idle");
        now = new Date(current.availableAt.getTime() + 1);
      }
      assert.equal((await eventOutboxStatus(db, now)).failed, 1);
      await db.$executeRawUnsafe("DROP TRIGGER fail_event_delivery");
      await db.$disconnect(); db = new PrismaClient(config);
      assert.equal((await processEventNotificationBatch(db, { now })).status, "idle");
      assert.equal((await retryFailedEventNotifications(db, now)).count, 1);
      assert.equal((await processEventNotificationBatch(db, { now })).status, "processed");
      assert.equal(await db.notification.count({ where: { communityEventId: id } }), 2);
      assert.equal((await db.notification.findUniqueOrThrow({ where: { id: `${job.id}:${ids[0]}` } })).readAt.toISOString(), readAt.toISOString());
      assert.equal((await eventOutboxStatus(db, now)).failed, 0);
    });
    await t.test("düzenleyen/aktör deaktifken teslim yok; fiziksel silme cascade kuyruğu temizler", async () => {
      const id = await createEvent(ids.slice(0, 2));
      await events().manage(slug, id, "moderator", "remove");
      await db.userList.update({ where: { id: "moderator" }, data: { status: "deleted" } });
      assert.equal((await processEventNotificationBatch(db, { now: future() })).delivered, 0);
      await db.userList.update({ where: { id: "moderator" }, data: { status: "active" } });
      const other = await createEvent(ids.slice(0, 2));
      await events().manage(slug, other, "owner", "cancel");
      await db.userList.update({ where: { id: "owner" }, data: { status: "deleted" } });
      assert.equal((await processEventNotificationBatch(db, { now: future() })).delivered, 0);
      await db.userList.update({ where: { id: "owner" }, data: { status: "active" } });
      const cascade = await createEvent(ids.slice(0, 2));
      await events().manage(slug, cascade, "owner", "cancel");
      await db.communityEvent.delete({ where: { id: cascade } });
      assert.equal(await db.communityEventNotificationJob.count({ where: { eventId: cascade } }), 0);
      assert.equal(await db.communityEventNotificationRecipient.count(), 0);
      await assert.rejects(processEventNotificationBatch(db, { batchSize: 51 }), /Invalid/);
    });
  } finally { await db.$disconnect(); await secondDb.$disconnect(); await rm(directory, { recursive: true, force: true }); }
});
