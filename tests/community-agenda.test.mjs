import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { communityAgenda } from "../lib/communityAgenda.ts";
import { agendaFilters } from "../lib/communityAgendaFilters.ts";
import { createCommunities, CommunityError } from "../lib/communities.ts";
import { createCommunityEvents } from "../lib/communityEvents.ts";
const denied = status => error => error instanceof CommunityError && error.status === status;

test("kişisel etkinlikler: yalnız kendi tercihleri ve düzenledikleri", async t => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-agenda-")), now = new Date("2026-10-17T12:00:00Z");
  let queries = 0;
  const db = new PrismaClient({ datasources: { db: { url: `file:${path.join(directory, "test.db").replaceAll("\\", "/")}` } }, log: [{ emit: "event", level: "query" }] }); db.$on("query", () => queries++);
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) for (const sql of (await readFile(new URL(`${folder}/migration.sql`, root), "utf8")).split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(sql);
    for (const id of ["owner", "reader", "other"]) await db.userList.create({ data: { id, slug: id, ownerName: id } });
    const communities = createCommunities(db), sources = [];
    for (let i = 0; i < 2; i++) {
      const { slug } = await communities.create("owner", { name: `Ajanda topluluğu ${i}`, category: "interest", description: "Kişisel ajanda için geçici test topluluğudur.", rules: "Yalnız sentetik test verisi kullanılır." });
      sources.push(await db.community.findUniqueOrThrow({ where: { slug } })); await communities.mutate(slug, "reader", { action: "join" });
    }
    const events = [];
    for (let i = 0; i < 25; i++) {
      const event = await db.communityEvent.create({ data: { id: `agenda-${i.toString().padStart(2, "0")}`, communityId: sources[i % 2].id, organizerId: i === 0 ? "reader" : "owner", title: `Kişisel etkinlik ${i}`, description: "Liste DTO'suna taşınmaması gereken uzun açıklama.", startsAt: new Date(now.getTime() + 86400000), city: "İstanbul", venue: "Kurgusal kamusal alan", capacity: 20 } }); events.push(event);
      await db.communityEventRsvp.create({ data: { eventId: event.id, userId: "reader", status: i % 2 ? "interested" : "attending" } });
    }
    const past = await db.communityEvent.create({ data: { communityId: sources[0].id, organizerId: "owner", title: "Başlangıcı geçmiş örnek", description: "Sentetik test için uzun açıklama metni.", startsAt: new Date(now.getTime() - 86400000), city: "İstanbul", venue: "Kurgusal alan" } });
    await db.communityEventRsvp.create({ data: { eventId: past.id, userId: "reader", status: "withdrawn" } });
    const agenda = (user = "reader", page = 1, view = "upcoming", role = "all") => communityAgenda(db, user, page, view, role, now);
    await t.test("aktif oturum, katı API filtreleri ve URL varsayılanları", async () => {
      await assert.rejects(agenda(null), denied(401)); await assert.rejects(agenda("missing"), denied(401));
      for (const page of [0, 101, 1.5]) await assert.rejects(agenda("reader", page), denied(400));
      await assert.rejects(agenda("reader", 1, "unknown"), denied(400)); await assert.rejects(agenda("reader", 1, "past", "unknown"), denied(400));
      assert.deepEqual(agendaFilters(new URLSearchParams("view=no&role=bad&page=101")), { view: "upcoming", role: "all", page: 1 });
      assert.deepEqual(agendaFilters(new URLSearchParams("view=cancelled&role=organizing&page=2")), { view: "cancelled", role: "organizing", page: 2 });
    });
    await t.test("iki topluluk, aynı tarih, tekillik ve rol filtresi sayfalama öncesi", async () => {
      const first = await agenda(), second = await agenda("reader", 2);
      assert.equal(first.items.length, 20); assert.equal(second.items.length, 5); assert.equal(first.hasMore, true); assert.equal(second.hasMore, false);
      assert.equal(first.items[0].id, "agenda-00"); assert.equal(new Set([...first.items, ...second.items].map(item => item.id)).size, 25);
      assert.equal(new Set(first.items.map(item => item.community.slug)).size, 2);
      const organized = await agenda("reader", 1, "upcoming", "organizing"); assert.equal(organized.items.length, 1); assert.equal(organized.items[0].isOrganizer, true);
      assert.equal((await agenda("reader", 1, "upcoming", "responded")).items.length, 20);
      assert.equal((await agenda("other")).items.length, 0);
      assert.equal((await agenda("owner", 1, "upcoming", "responded")).items.length, 0);
    });
    await t.test("minimal DTO yalnız kendi durumu; katılımcı ve kaynak gövdesi yok; bounded sorgu", async () => {
      queries = 0; const result = await agenda(); const count = queries;
      assert.ok(count < 10, `bounded query count ${count}`);
      for (const item of result.items) {
        assert.ok(["attending", "interested"].includes(item.viewerStatus)); assert.equal(item.canWithdraw, true);
        for (const field of ["responses", "participants", "organizerId", "userId", "description", "revision", "distribution"]) assert.equal(Object.hasOwn(item, field), false);
        assert.equal(item.organizer.id, undefined); assert.equal(item.community.id, undefined);
      }
      assert.ok(!JSON.stringify(result).includes("taşınmaması"));
    });
    await t.test("geçmişte geri çekilmiş tercih görünür ama fiziksel katılım iddiası yok", async () => {
      const result = await agenda("reader", 1, "past"); assert.equal(result.items.length, 1); assert.equal(result.items[0].id, past.id); assert.equal(result.items[0].viewerStatus, "withdrawn"); assert.equal(result.items[0].canWithdraw, false);
    });
    await t.test("iki yönlü engel, kaldırılmış ve pasif düzenleyen görünmez", async () => {
      for (const block of [{ blockerId: "reader", blockedId: "owner" }, { blockerId: "owner", blockedId: "reader" }]) {
        await db.userBlock.create({ data: block }); assert.equal((await agenda()).items.length, 1); await db.userBlock.deleteMany();
      }
      await db.communityEvent.update({ where: { id: events[1].id }, data: { status: "removed" } }); assert.equal((await agenda("reader", 2)).items.length, 4);
      await db.communityEvent.update({ where: { id: events[1].id }, data: { status: "scheduled" } });
      await db.userList.update({ where: { id: "owner" }, data: { status: "deleted" } }); assert.equal((await agenda()).items.length, 1);
      await db.userList.update({ where: { id: "owner" }, data: { status: "active" } });
    });
    await t.test("geri alma mevcut servisten; kendi organize ettiği etkinlik iptal olmaz", async () => {
      const service = createCommunityEvents(db, () => now);
      await service.respond(sources[0].slug, events[0].id, "reader", "withdrawn");
      const result = await agenda(); assert.equal(result.items[0].id, events[0].id); assert.equal(result.items[0].viewerStatus, "withdrawn"); assert.equal(result.items[0].canWithdraw, false);
      assert.equal((await agenda("reader", 1, "upcoming", "responded")).items.some(item => item.id === events[0].id), false);
      assert.equal((await db.communityEvent.findUniqueOrThrow({ where: { id: events[0].id } })).status, "scheduled");
      await communities.mutate(sources[1].slug, "reader", { action: "leave" }); assert.equal((await agenda()).items.every(item => item.community.slug === sources[0].slug), true);
    });
    await t.test("iptal edilen ve arşiv kaynak görünür; durumları otomatik canlandırmaz", async () => {
      const service = createCommunityEvents(db, () => now); await service.manage(sources[0].slug, events[2].id, "owner", "cancel");
      await db.community.update({ where: { id: sources[0].id }, data: { status: "archived" } });
      const result = await agenda("reader", 1, "cancelled"); assert.equal(result.items.length, 1); assert.equal(result.items[0].viewerStatus, "withdrawn"); assert.equal(result.items[0].community.status, "archived");
      assert.equal((await agenda()).items.length, 0); assert.equal((await agenda("reader", 1, "past")).items.length, 1);
      await db.userList.update({ where: { id: "reader" }, data: { status: "deleted" } }); await assert.rejects(agenda(), denied(401));
    });
  } finally { await db.$disconnect(); await rm(directory, { recursive: true, force: true }); }
});
