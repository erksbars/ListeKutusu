import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createCommunities, CommunityError, communityPostInput } from "../lib/communities.ts";
import { createCommunityEvents } from "../lib/communityEvents.ts";
import { communityGeneralFeed } from "../lib/communityGeneralFeed.ts";
const now = new Date("2026-10-15T10:00:00Z");
const input = { title: "Kurgusal buluşma", description: "Gerçek olmayan yalnız test amaçlı örnek buluşmadır.", localStart: "2026-10-20T18:30", city: "Örnek şehir", venue: "Kurgusal kamusal mekân", capacity: 4, publicLocationConfirmed: true };
const denied = status => error => error instanceof CommunityError && error.status === status;

test("dağıtım yalnız açık tercihle genel olur, hatalı değer reddedilir", () => {
  assert.equal(communityPostInput({ title: "Sohbet", body: "Örnek metin" }).distribution, "community");
  for (const distribution of [null, true, "private", "", {}, 1]) assert.throws(() => communityPostInput({ title: "Sohbet", body: "Örnek metin", distribution }), denied(400));
});

test("genel topluluk akışı: kapsam, yetki, spoiler, engel ve cursor", async t => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-distribution-"));
  const db = new PrismaClient({ datasources: { db: { url: `file:${path.join(directory, "test.db").replaceAll("\\", "/")}` } } });
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) {
      for (const sql of (await readFile(new URL(`${folder}/migration.sql`, root), "utf8")).split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(sql);
    }
    for (const id of ["owner", "author", "member", "reader"]) await db.userList.create({ data: { id, ownerName: id, slug: id } });
    const communities = createCommunities(db), events = createCommunityEvents(db, () => now);
    const { slug } = await communities.create("owner", { name: "Dağıtım Kulübü", category: "interest", description: "Akış dağıtımını kontrol eder.", rules: "Yalnız otomatik test verisi paylaşılır." });
    for (const user of ["author", "member"]) await communities.mutate(slug, user, { action: "join" });
    const hidden = (await communities.mutate(slug, "author", { action: "create-post", title: "Topluluk sohbeti", body: "Bağlantıyla okunabilir." })).post;
    const review = (await communities.mutate(slug, "author", { action: "create-post", title: "Spoilersız başlık", body: "Saklı inceleme metni spoiler içerir.", type: "review", reviewKind: "movie", subjectTitle: "Örnek film", rating: 8, spoiler: true, distribution: "general" })).post;
    const event = (await events.create(slug, "author", { ...input, distribution: "general" })).event;
    const communityEvent = (await events.create(slug, "author", input)).event;
    await t.test("varsayılan içerik genel akışa çıkmaz ama kamuya açık okunur", async () => {
      assert.equal((await communities.post(slug, hidden.id, null, 1)).post.distribution, "community");
      assert.equal((await events.detail(slug, communityEvent.id, null)).event.distribution, "community");
      const result = await communityGeneralFeed(db, null, null, "all", now);
      assert.deepEqual(new Set(result.items.map(item => item.id)), new Set([review.id, event.id]));
      assert.equal(result.items.find(item => item.id === review.id).excerpt, "");
      assert.ok(!JSON.stringify(result).includes("Saklı inceleme metni"));
      assert.equal(result.items[0].community.slug, slug);
      assert.ok(!JSON.stringify(result).includes("participants"));
      await assert.rejects(events.respond(slug, event.id, "reader", "attending"), denied(403));
    });
    await t.test("tercih yalnız yazar veya aktif yönetim tarafından değişir", async () => {
      await assert.rejects(communities.mutate(slug, "member", { action: "set-distribution", postId: hidden.id, distribution: "general" }), denied(403));
      await communities.mutate(slug, "author", { action: "set-distribution", postId: hidden.id, distribution: "general" });
      assert.equal((await communityGeneralFeed(db, null, null, "discussion", now)).items.length, 1);
      await communities.mutate(slug, "owner", { action: "set-distribution", postId: hidden.id, distribution: "community" });
      assert.equal((await communityGeneralFeed(db, null, null, "discussion", now)).items.length, 0);
      await assert.rejects(communities.mutate(slug, "author", { action: "set-distribution", postId: hidden.id }), denied(400));
    });
    await t.test("etkinlik dağıtımı sürümlüdür, eski istemci tercihi sıfırlamaz", async () => {
      await events.respond(slug, event.id, "member", "interested");
      await events.update(slug, event.id, "author", { ...input, expectedVersion: 0 });
      assert.equal((await events.detail(slug, event.id, null)).event.distribution, "general");
      await events.update(slug, event.id, "author", { ...input, expectedVersion: 0, distribution: "community" });
      assert.equal((await communityGeneralFeed(db, null, null, "event", now)).items.length, 0);
      await assert.rejects(events.update(slug, event.id, "author", { ...input, expectedVersion: 0, distribution: "general" }), denied(409));
      await events.update(slug, event.id, "author", { ...input, expectedVersion: 1, distribution: "general" });
      assert.equal(await db.notification.count({ where: { communityEventId: event.id } }), 0);
      await assert.rejects(events.update(slug, event.id, "member", { ...input, expectedVersion: 2, distribution: "community" }), denied(403));
    });
    await t.test("iki yönlü engel ve deaktif yazar her türde gizler", async () => {
      for (const block of [{ blockerId: "reader", blockedId: "author" }, { blockerId: "author", blockedId: "reader" }]) {
        await db.userBlock.create({ data: block });
        assert.equal((await communityGeneralFeed(db, "reader", null, "all", now)).items.length, 0);
        await db.userBlock.deleteMany({ where: block });
      }
      await db.userList.update({ where: { id: "author" }, data: { status: "deleted" } });
      assert.equal((await communityGeneralFeed(db, null, null, "all", now)).items.length, 0);
      await db.userList.update({ where: { id: "author" }, data: { status: "active" } });
    });
    await t.test("kaldırma gizler, iptal etiketli kalır, geçmiş etkinlik keşiften çıkar", async () => {
      await events.manage(slug, event.id, "author", "cancel");
      assert.equal((await communityGeneralFeed(db, null, null, "event", now)).items[0].status, "cancelled");
      assert.equal((await communityGeneralFeed(db, null, null, "event", new Date("2026-10-21"))).items.length, 0);
      await events.manage(slug, event.id, "author", "remove");
      await communities.mutate(slug, "author", { action: "remove-post", postId: review.id });
      assert.equal((await communityGeneralFeed(db, null, null, "all", now)).items.length, 0);
    });
    await t.test("eşit zamanlı iki tür cursor sayfalamasında tekrar veya kayıp yok", async () => {
      const community = await db.community.findUniqueOrThrow({ where: { slug } });
      for (let index = 0; index < 13; index++) {
        await db.communityPost.create({ data: { id: `post-${index}`, communityId: community.id, authorId: "author", title: `Sohbet ${index}`, body: "Örnek", distribution: "general", createdAt: now } });
        await db.communityEvent.create({ data: { id: `event-${index}`, communityId: community.id, organizerId: "author", ...input, localStart: undefined, publicLocationConfirmed: undefined, startsAt: new Date("2026-10-20T15:30Z"), distribution: "general", createdAt: now } });
      }
      let cursor = null; const ids = [];
      do { const page = await communityGeneralFeed(db, null, cursor, "all", now); ids.push(...page.items.map(item => item.id)); cursor = page.nextCursor; } while (cursor);
      assert.equal(ids.length, 26); assert.equal(new Set(ids).size, 26);
      await assert.rejects(communityGeneralFeed(db, null, "bad-cursor", "all", now), denied(400));
      await assert.rejects(communityGeneralFeed(db, null, null, "private", now), denied(400));
    });
  } finally { await db.$disconnect(); await rm(directory, { recursive: true, force: true }); }
});
