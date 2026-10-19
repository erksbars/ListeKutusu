import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { communityEventInput, createCommunityEvents } from "../lib/communityEvents.ts";
import { CommunityError, createCommunities } from "../lib/communities.ts";
const now = new Date("2026-10-12T12:00:00Z");
const input = { title: "Kutu oyunu sohbeti", description: "Yeni başlayanlar için oyunları konuşacağımız örnek buluşma.", localStart: "2026-10-20T18:30", city: "Örnek şehir", venue: "Kamusal demo mekân", capacity: 6, publicLocationConfirmed: true };
const denied = status => error => error instanceof CommunityError && error.status === status;
test("etkinlik takvimi, saat dilimi, kapasite ve açık konum onayı", () => {
  const parsed = communityEventInput(input, now);
  assert.equal(parsed.startsAt.toISOString(), "2026-10-20T15:30:00.000Z"); assert.equal(parsed.timeZone, "Europe/Istanbul");
  assert.equal(communityEventInput({ ...input, capacity: null }, now).capacity, null);
  for (const change of [{ localStart: "2026-02-30T18:30" }, { localStart: "2026-10-20T24:00" }, { localStart: "2026-10-12T15:00" }, { localStart: "2028-01-01T15:00" }, { timeZone: "UTC" }, { capacity: "6" }, { capacity: 1 }, { capacity: 201 }, { capacity: 2.5 }, { publicLocationConfirmed: false }, { description: "kısa" }]) assert.throws(() => communityEventInput({ ...input, ...change }, now), denied(400));
});
test("etkinlik SQLite üyelik, görünürlük ve yönetim kuralları", async t => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-event-test-"));
  const db = new PrismaClient({ datasources: { db: { url: `file:${path.join(directory, "test.db").replaceAll("\\", "/")}` } } });
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) {
      const sql = await readFile(new URL(`${folder}/migration.sql`, root), "utf8");
      for (const statement of sql.split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(statement);
    }
    for (const id of ["owner", "author", "member", "stranger"]) await db.userList.create({ data: { id, ownerName: id, slug: id } });
    const communities = createCommunities(db);
    const body = { name: "Etkinlik Kulübü", description: "Birlikte oyunlar konuşuyoruz.", category: "interest", rules: "Saygılı ol ve özel adres paylaşma." };
    const { slug } = await communities.create("owner", body);
    const second = await communities.create("stranger", body);
    for (const userId of ["author", "member"]) await communities.mutate(slug, userId, { action: "join" });
    let current = now;
    const events = createCommunityEvents(db, () => current);
    let eventId;
    await t.test("üye olmayan/uzaklaştırılmış/deaktif hesap oluşturamaz", async () => {
      await assert.rejects(events.create(slug, "stranger", input), denied(403));
      await communities.mutate(slug, "owner", { action: "moderate-member", userId: "member", operation: "ban" });
      await assert.rejects(events.create(slug, "member", input), denied(403));
      await communities.mutate(slug, "owner", { action: "moderate-member", userId: "member", operation: "unban" });
      await db.userList.update({ where: { id: "stranger" }, data: { status: "deleted" } });
      await assert.rejects(events.create(second.slug, "stranger", input), denied(401));
      await db.userList.update({ where: { id: "stranger" }, data: { status: "active" } });
    });
    await t.test("organizer/status istemciden alınmaz; listede ve detayda sınır korunur", async () => {
      eventId = (await events.create(slug, "author", { ...input, organizerId: "owner", status: "removed" })).event.id;
      const detail = await events.detail(slug, eventId, null);
      assert.equal(detail.event.organizer.id, "author"); assert.equal(detail.event.status, "scheduled"); assert.equal(detail.canManage, false);
      assert.equal((await events.list(slug, null, 1, "upcoming")).events.length, 1);
      await assert.rejects(events.detail(second.slug, eventId, "stranger"), denied(404));
      await assert.rejects(events.manage(second.slug, eventId, "stranger", "remove"), denied(404));
      await assert.rejects(events.manage(slug, eventId, "member", "cancel"), denied(403));
    });
    await t.test("iptal görünür, kaldırma gizlidir; iki yönlü engelleme korunur", async () => {
      await db.userBlock.create({ data: { blockerId: "member", blockedId: "author" } });
      assert.equal((await events.list(slug, "member", 1, "upcoming")).events.length, 0);
      await assert.rejects(events.detail(slug, eventId, "member"), denied(404));
      await db.userBlock.create({ data: { blockerId: "author", blockedId: "stranger" } });
      await assert.rejects(events.detail(slug, eventId, "stranger"), denied(404));
      await events.manage(slug, eventId, "author", "cancel");
      assert.equal((await events.list(slug, null, 1, "upcoming")).events.length, 0);
      assert.equal((await events.list(slug, null, 1, "cancelled")).events.length, 1);
      assert.equal((await events.detail(slug, eventId, null)).event.status, "cancelled");
      await events.manage(slug, eventId, "owner", "remove");
      await assert.rejects(events.detail(slug, eventId, null), denied(404));
    });
    await t.test("başlangıcı geçenler ayrı listelenir; sayfalama ve mod yetkisi", async () => {
      const pastId = (await events.create(slug, "author", input)).event.id;
      current = new Date("2026-10-21T12:00:00Z");
      assert.equal((await events.list(slug, null, 1, "past")).events.length, 1);
      await assert.rejects(events.manage(slug, pastId, "author", "cancel"), denied(409));
      await communities.mutate(slug, "owner", { action: "moderate-member", userId: "member", operation: "promote" });
      for (let i = 0; i < 21; i++) await events.create(slug, "owner", { ...input, localStart: "2026-11-20T18:30", title: `Etkinlik ${i}` });
      const first = await events.list(slug, null, 1, "upcoming"), next = await events.list(slug, null, 2, "upcoming");
      assert.equal(first.events.length, 20); assert.equal(first.hasMore, true); assert.equal(next.events.length, 1);
      await events.manage(slug, first.events[0].id, "member", "cancel");
      await assert.rejects(events.list(slug, null, 1, "invalid"), denied(400));
    });
  } finally { await db.$disconnect(); await rm(directory, { recursive: true, force: true }); }
});
