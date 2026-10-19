import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createCommunityEvents } from "../lib/communityEvents.ts";
import { CommunityError, createCommunities } from "../lib/communities.ts";
const denied = status => error => error instanceof CommunityError && error.status === status;
test("RSVP tekillik, kapasite yarışı, yaşam döngüsü ve gizlilik", async t => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-attendance-"));
  const url = `file:${path.join(directory, "test.db").replaceAll("\\", "/")}`;
  const db = new PrismaClient({ datasources: { db: { url } } });
  const db2 = new PrismaClient({ datasources: { db: { url } } });
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) {
      const sql = await readFile(new URL(`${folder}/migration.sql`, root), "utf8");
      for (const statement of sql.split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(statement);
    }
    for (const id of ["owner", "alice", "bob", "carol", "outsider"]) await db.userList.create({ data: { id, ownerName: id, slug: id, email: `${id}@example.test` } });
    const communities = createCommunities(db);
    const communityInput = { name: "Katılım Kulübü", category: "interest", description: "Kutu oyunu katılımını test ediyoruz.", rules: "Saygılı ol ve özel adres paylaşma." };
    const { slug } = await communities.create("owner", communityInput);
    const second = await communities.create("outsider", communityInput);
    for (const userId of ["alice", "bob", "carol"]) await communities.mutate(slug, userId, { action: "join" });
    let clock = new Date("2026-10-12T12:00:00Z");
    const events = createCommunityEvents(db, () => clock), otherClient = createCommunityEvents(db2, () => clock);
    const input = { title: "Kutu oyunu denemesi", description: "Yalnız geçici test için kurgusal katılım etkinliği.", localStart: "2026-10-20T18:30", city: "Örnek şehir", venue: "Kurgusal kamusal mekân", capacity: 2, publicLocationConfirmed: true };
    const eventId = (await events.create(slug, "owner", input)).event.id;
    let winners, loser;
    await t.test("düzenleyen otomatik sayılmaz; üye olmayan ve yanlış topluluk reddedilir", async () => {
      assert.equal((await events.detail(slug, eventId, "owner")).event.attendingCount, 0);
      await assert.rejects(events.respond(slug, eventId, "outsider", "attending"), denied(403));
      await assert.rejects(events.respond(second.slug, eventId, "outsider", "attending"), denied(404));
      await assert.rejects(events.respond(slug, eventId, "alice", "invalid"), denied(400));
      assert.equal(await db.communityEventRsvp.count(), 0);
    });
    await t.test("aynı tercih idempotent; ilgileniyorum koltuk kullanmaz", async () => {
      for (let i = 0; i < 2; i++) await events.respond(slug, eventId, "alice", "attending");
      assert.equal(await db.communityEventRsvp.count(), 1); assert.equal((await events.detail(slug, eventId, "alice")).event.attendingCount, 1);
      await events.respond(slug, eventId, "alice", "interested");
      assert.equal((await events.detail(slug, eventId, "alice")).event.attendingCount, 0); assert.equal((await events.detail(slug, eventId, null)).event.interestedCount, 1);
      await events.respond(slug, eventId, "owner", "attending"); assert.equal((await events.detail(slug, eventId, null)).event.attendingCount, 1);
      await events.respond(slug, eventId, "owner", "withdrawn"); await events.respond(slug, eventId, "alice", "withdrawn");
    });
    await t.test("iki ayrı Prisma istemcisinde üç eşzamanlı talep iki koltuğu aşmaz", async () => {
      const users = ["alice", "bob", "carol"];
      const result = await Promise.allSettled(users.map((id, index) => (index % 2 ? otherClient : events).respond(slug, eventId, id, "attending")));
      winners = users.filter((_, index) => result[index].status === "fulfilled");
      loser = users.find((_, index) => result[index].status === "rejected");
      assert.equal(winners.length, 2); assert.ok(result.find(item => item.status === "rejected").reason instanceof CommunityError);
      assert.equal(result.find(item => item.status === "rejected").reason.status, 409);
      assert.equal(await db.communityEventRsvp.count({ where: { eventId, status: "attending" } }), 2);
      await events.respond(slug, eventId, winners[0], "attending");
      await events.respond(slug, eventId, loser, "interested");
      await assert.rejects(events.respond(slug, eventId, loser, "attending"), denied(409));
      assert.equal((await events.detail(slug, eventId, loser)).event.viewerStatus, "interested");
    });
    await t.test("kimlik listesi yalnız yönetimde, kendi durumun yalnız sana görünür", async () => {
      const owner = await events.detail(slug, eventId, "owner"); assert.equal(owner.participants.length, 2);
      assert.ok(owner.participants.every(person => Object.keys(person).sort().join(",") === "id,ownerName,slug"));
      assert.deepEqual((await events.detail(slug, eventId, loser)).participants, []);
      assert.deepEqual((await events.detail(slug, eventId, null)).participants, []);
      assert.equal((await events.detail(slug, eventId, null)).event.viewerStatus, null);
      assert.equal((await events.list(slug, winners[0], 1, "upcoming")).events[0].viewerStatus, "attending");
      assert.equal((await events.list(slug, null, 1, "upcoming")).events[0].viewerStatus, null);
    });
    await t.test("vazgeçme koltuğu açar; ayrılma/yasak geri katılmayla eski koltuğu canlandırmaz", async () => {
      await events.respond(slug, eventId, winners[0], "withdrawn"); await events.respond(slug, eventId, loser, "attending");
      assert.equal((await events.detail(slug, eventId, null)).event.attendingCount, 2);
      await communities.mutate(slug, loser, { action: "leave" });
      assert.equal((await events.detail(slug, eventId, null)).event.attendingCount, 1);
      await communities.mutate(slug, loser, { action: "join" });
      assert.equal((await events.detail(slug, eventId, loser)).event.viewerStatus, "withdrawn");
      await communities.mutate(slug, "owner", { action: "moderate-member", userId: winners[1], operation: "ban" });
      assert.equal((await events.detail(slug, eventId, null)).event.attendingCount, 0);
      await assert.rejects(events.respond(slug, eventId, winners[1], "attending"), denied(403));
      await communities.mutate(slug, "owner", { action: "moderate-member", userId: winners[1], operation: "unban" });
      assert.equal((await events.detail(slug, eventId, winners[1])).event.viewerStatus, "withdrawn");
    });
    await t.test("engelleme yeni katılımı kapatır; mevcut niyet açık vazgeçmeyle bırakılır", async () => {
      await events.respond(slug, eventId, "alice", "attending");
      await db.userBlock.create({ data: { blockerId: "owner", blockedId: "alice" } });
      await assert.rejects(events.respond(slug, eventId, "alice", "interested"), denied(404));
      assert.equal((await events.detail(slug, eventId, "owner")).participants.length, 0);
      await events.respond(slug, eventId, "alice", "withdrawn");
      assert.equal((await events.detail(slug, eventId, null)).event.attendingCount, 0);
      await db.userBlock.deleteMany({ where: { blockerId: "owner", blockedId: "alice" } });
    });
    await t.test("deaktif hesap yazma sırasında çekilir, yeniden aktivasyon aşırı doluluk yaratmaz", async () => {
      await events.respond(slug, eventId, "alice", "attending"); await events.respond(slug, eventId, "bob", "attending");
      await db.userList.update({ where: { id: "alice" }, data: { status: "deleted" } });
      assert.equal((await events.detail(slug, eventId, null)).event.attendingCount, 1);
      await events.respond(slug, eventId, "carol", "attending");
      await db.userList.update({ where: { id: "alice" }, data: { status: "active" } });
      assert.equal((await events.detail(slug, eventId, "alice")).event.viewerStatus, "withdrawn");
      await assert.rejects(events.respond(slug, eventId, "alice", "attending"), denied(409));
      assert.equal((await events.detail(slug, eventId, null)).event.attendingCount, 2);
    });
    await t.test("iptal tüm tercihleri çeker; geçmiş/kaldırılmış etkinliğe katılınamaz", async () => {
      await events.manage(slug, eventId, "owner", "cancel");
      assert.equal((await events.detail(slug, eventId, "bob")).event.viewerStatus, "withdrawn");
      assert.equal((await events.detail(slug, eventId, null)).event.attendingCount, 0);
      await assert.rejects(events.respond(slug, eventId, "alice", "attending"), denied(409));
      await events.manage(slug, eventId, "owner", "remove");
      await assert.rejects(events.respond(slug, eventId, "alice", "interested"), denied(409));
      const past = (await events.create(slug, "owner", input)).event.id;
      await events.respond(slug, past, "alice", "attending"); clock = new Date("2026-10-21T12:00:00Z");
      await assert.rejects(events.respond(slug, past, "bob", "attending"), denied(409));
      await events.respond(slug, past, "alice", "withdrawn"); assert.equal((await events.detail(slug, past, null)).event.attendingCount, 0);
    });
  } finally { await Promise.all([db.$disconnect(), db2.$disconnect()]); await rm(directory, { recursive: true, force: true }); }
});
