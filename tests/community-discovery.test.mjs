import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createCommunities, CommunityError } from "../lib/communities.ts";
import { createCommunityEvents } from "../lib/communityEvents.ts";
import { communityDiscoveryInput, discoverCommunityEvents, discoveryKey, discoveryWhere } from "../lib/communityDiscovery.ts";
import { discoveryFiltersFromParams, discoveryParams } from "../lib/communityDiscoveryTypes.ts";

const now = new Date("2026-10-15T12:00:00Z");
const eventInput = { title: "Kurgusal oyun etkinliği", description: "Gerçek olmayan yalnız test amaçlı örnek etkinlik duyurusudur.", localStart: "2026-10-25T18:30", city: "İSTANBUL", venue: "Kurgusal kamusal mekân", publicLocationConfirmed: true, distribution: "general" };
const base = { name: "Keşif Kulübü", description: "Yalnız otomatik keşif testi içindir.", category: "university", rules: "Gerçek kurum bağlantısı veya buluşma değildir." };
const denied = status => error => error instanceof CommunityError && error.status === status;
test("açık keşif etiketleri, Türkçe arama anahtarı ve hatalı girdi sınırları", () => {
  assert.equal(discoveryKey(" İSTANBUL  Üsküdar "), "istanbuluskudar");
  assert.equal(discoveryKey("Istanbul Uskudar"), "istanbuluskudar");
  assert.deepEqual(communityDiscoveryInput({}), { universityName: null, universityKey: null, city: null, cityKey: null, interest: null });
  assert.equal(communityDiscoveryInput({ universityName: "  Örnek   Üniversitesi ", city: "İstanbul", interest: "boardgame" }).universityName, "Örnek Üniversitesi");
  for (const input of [{ universityName: 5 }, { universityName: "Ü" }, { universityName: "Ü".repeat(121) }, { city: "Ş\ne" }, { city: {} }, { interest: "toString" }, { interest: true }]) assert.throws(() => communityDiscoveryInput(input), denied(400));
  assert.throws(() => discoveryWhere({ city: "x".repeat(81) }), denied(400));
});
test("filtre URL'si görünüm/sayfa/arama gidiş dönüşünü korur", () => {
  const value = { q: "Oyun", university: "Örnek Üniversitesi", city: "İstanbul", interest: "boardgame", category: "university", mine: true, view: "events", page: 3 };
  assert.deepEqual(discoveryFiltersFromParams(discoveryParams(value)), value);
  assert.equal(discoveryFiltersFromParams(new URLSearchParams("page=9999&view=invalid")).page, 1);
});

test("keşif SQLite veri, görünürlük, yetki ve sayfalama", async t => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-community-discovery-"));
  const db = new PrismaClient({ datasources: { db: { url: `file:${path.join(directory, "test.db").replaceAll("\\", "/")}` } } });
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) {
      if (folder === "20261015180000_community_discovery") {
        await db.$executeRawUnsafe(`INSERT INTO "UserList" ("id","ownerName","slug","updatedAt") VALUES ('legacy-owner','Eski Profil','legacy-owner',CURRENT_TIMESTAMP)`);
        await db.$executeRawUnsafe(`INSERT INTO "Community" ("id","name","slug","description","rules","category","ownerId") VALUES ('legacy-community','Eski Kulüp','legacy-community','Korunacak','Korunacak','local','legacy-owner')`);
        await db.$executeRawUnsafe(`INSERT INTO "CommunityEvent" ("id","communityId","organizerId","title","description","startsAt","city","venue","updatedAt") VALUES ('legacy-event','legacy-community','legacy-owner','Eski duyuru','Korunacak','2026-10-25T15:30:00Z','İSTANBUL Üsküdar','Kamusal',CURRENT_TIMESTAMP)`);
      }
      for (const sql of (await readFile(new URL(`${folder}/migration.sql`, root), "utf8")).split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(sql);
    }
    await t.test("migration eski şehri indeksler; topluluğa profil üniversitesi kopyalamaz", async () => {
      assert.equal((await db.communityEvent.findUniqueOrThrow({ where: { id: "legacy-event" } })).cityKey, "istanbuluskudar");
      const old = await db.community.findUniqueOrThrow({ where: { id: "legacy-community" } });
      assert.equal(old.universityName, null); assert.equal(old.city, null); assert.equal(old.interest, null);
      await db.community.delete({ where: { id: old.id } });
    });
    for (const id of ["owner", "reader", "other"]) await db.userList.create({ data: { id, ownerName: id, slug: id, universityName: "Gizli Kişisel Üniversite", universityPublic: false } });
    const communities = createCommunities(db), events = createCommunityEvents(db, () => now);
    const { slug } = await communities.create("owner", { ...base, universityName: "Örnek Üniversitesi", city: "Ankara", interest: "boardgame" });
    await communities.mutate(slug, "reader", { action: "join" });
    const noLabels = await communities.create("other", { ...base, category: "interest" });
    await t.test("birleşik açık etiket filtreleri, boş eski kayıtlar ve özel veri sınırı", async () => {
      const filtered = await communities.directory(null, "", "university", 1, false, { university: "ornek uni", city: "ANKARA", interest: "boardgame" });
      assert.equal(filtered.total, 1); assert.equal(filtered.communities[0].slug, slug);
      assert.equal(Object.hasOwn(filtered.communities[0], "universityKey"), false);
      assert.equal((await communities.directory(null, "", "", 1, false, { university: "Gizli Kişisel Üniversite" })).total, 0);
      const unlabeled = (await communities.detail(noLabels.slug, null, 1)).community;
      assert.equal(unlabeled.universityName, null);
      await assert.rejects(communities.directory(null, "", "", 1, true), denied(401));
    });
    await t.test("etiketleri yalnız aktif kurucu/moderatör değiştirir", async () => {
      await assert.rejects(communities.mutate(slug, "reader", { action: "update-discovery", city: "İzmir" }), denied(403));
      await communities.mutate(slug, "owner", { action: "moderate-member", userId: "reader", operation: "promote" });
      await communities.mutate(slug, "reader", { action: "update-discovery", universityName: "Örnek Üniversitesi", city: "Ankara", interest: "boardgame" });
      await assert.rejects(communities.mutate(noLabels.slug, "reader", { action: "update-discovery", city: "İzmir" }), denied(403));
    });
    const event = (await events.create(slug, "owner", eventInput)).event;
    await events.create(slug, "owner", { ...eventInput, distribution: "community" });
    await t.test("etkinlik şehri topluluk şehrinden bağımsızdır; dağıtım ve kişisel sınır", async () => {
      const result = await discoverCommunityEvents(db, null, { city: "Istanbul", university: "ORNEK", interest: "boardgame" }, 1, now);
      assert.equal(result.total, 1); assert.equal(result.events[0].id, event.id);
      assert.equal((await discoverCommunityEvents(db, null, { city: "Ankara" }, 1, now)).total, 0);
      assert.equal((await discoverCommunityEvents(db, null, { university: "Gizli Kişisel Üniversite" }, 1, now)).total, 0);
      assert.ok(!JSON.stringify(result).includes("Gizli Kişisel"));
      assert.ok(!JSON.stringify(result).includes("responses"));
      assert.equal((await discoverCommunityEvents(db, "reader", { mine: true }, 1, now)).total, 1);
      await assert.rejects(discoverCommunityEvents(db, null, { mine: true }, 1, now), denied(401));
    });
    await t.test("engelleme iki yönde, deaktif düzenleyen, iptal ve geçmiş gizlenir", async () => {
      for (const block of [{ blockerId: "reader", blockedId: "owner" }, { blockerId: "owner", blockedId: "reader" }]) {
        await db.userBlock.create({ data: block }); assert.equal((await discoverCommunityEvents(db, "reader", {}, 1, now)).total, 0); await db.userBlock.deleteMany({ where: block });
      }
      await db.userList.update({ where: { id: "owner" }, data: { status: "deleted" } });
      assert.equal((await discoverCommunityEvents(db, null, {}, 1, now)).total, 0);
      await db.userList.update({ where: { id: "owner" }, data: { status: "active" } });
      assert.equal((await discoverCommunityEvents(db, null, {}, 1, new Date("2026-10-26"))).total, 0);
      await events.manage(slug, event.id, "owner", "cancel");
      assert.equal((await discoverCommunityEvents(db, null, {}, 1, now)).total, 0);
      await events.manage(slug, event.id, "owner", "remove");
      assert.equal((await discoverCommunityEvents(db, null, {}, 1, now)).total, 0);
    });
    await t.test("şehir düzenlenince anahtar yenilenir; filtreler sayfalama öncesinde uygulanır", async () => {
      for (let i = 0; i < 21; i++) await events.create(slug, "owner", { ...eventInput, title: `Örnek ${i}` });
      const first = await discoverCommunityEvents(db, null, { city: "istanbul" }, 1, now), next = await discoverCommunityEvents(db, null, { city: "istanbul" }, 2, now);
      assert.equal(first.events.length, 20); assert.equal(first.hasMore, true); assert.equal(next.events.length, 1);
      const id = first.events[0].id;
      await events.update(slug, id, "owner", { ...eventInput, city: "İzmir", expectedVersion: 0 });
      assert.equal((await discoverCommunityEvents(db, null, { city: "IZMIR" }, 1, now)).total, 1);
      assert.equal((await discoverCommunityEvents(db, null, { city: "istanbul" }, 1, now)).total, 20);
      await assert.rejects(discoverCommunityEvents(db, null, { category: "toString" }, 1, now), denied(400));
      await assert.rejects(discoverCommunityEvents(db, null, { q: "x".repeat(101) }, 1, now), denied(400));
    });
  } finally { await db.$disconnect(); await rm(directory, { recursive: true, force: true }); }
});
