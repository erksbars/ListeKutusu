import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createCommunities } from "../lib/communities.ts";
import { communityTimeline } from "../lib/communityTimeline.ts";
import { communityGeneralFeed } from "../lib/communityGeneralFeed.ts";
import { CommunityError } from "../lib/communityError.ts";
import { timelineCursor } from "../lib/feedTimeline.ts";
import { compareTimelineItems } from "../lib/feedTimelineOrder.ts";

const now = new Date("2026-10-30T12:00:00Z");
const denied = status => error => error instanceof CommunityError && error.status === status;

test("topluluk karma akışı: dağıtım, spoiler, yetki ve tek cursor", async t => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-community-timeline-"));
  const db = new PrismaClient({ datasources: { db: { url: `file:${path.join(directory, "test.db").replaceAll("\\", "/")}` } } });
  try {
    const migrations = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(migrations, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) {
      for (const sql of (await readFile(new URL(`${folder}/migration.sql`, migrations), "utf8")).split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(sql);
    }
    for (const id of ["owner", "reader", "other"]) await db.userList.create({ data: { id, ownerName: id, slug: id, email: `${id}@example.test` } });
    const communities = createCommunities(db);
    const input = { name: "Sosyal akış testi", description: "Geçici topluluk karma liste testi.", rules: "Yalnız sentetik test içeriği.", category: "interest" };
    const source = await communities.create("owner", input), foreign = await communities.create("other", input);
    const row = await db.community.findUniqueOrThrow({ where: { slug: source.slug } });
    const foreignRow = await db.community.findUniqueOrThrow({ where: { slug: foreign.slug } });
    await communities.mutate(source.slug, "reader", { action: "join" });
    const long = "Toplulukta okunacak uzun metin. ".repeat(30);
    const post = async (id, data = {}) => db.communityPost.create({ data: { id, communityId: row.id, authorId: "owner", title: id, body: long, createdAt: new Date(now.getTime() - 1000), ...data } });
    const event = async (id, data = {}) => db.communityEvent.create({ data: { id, communityId: row.id, organizerId: "owner", title: id, description: long, city: "Örnek şehir", venue: "Örnek kamusal yer", startsAt: new Date(now.getTime() + 86_400_000), createdAt: now, ...data } });
    await post("post-open");
    await post("review-spoiler", { type: "review", reviewKind: "book", subjectTitle: "Örnek kitap", rating: 8, spoiler: true, body: "Gizli spoiler cümlesi", distribution: "general", createdAt: new Date(now.getTime() - 500) });
    await post("review-tv", { type: "review", reviewKind: "tv", subjectTitle: "Örnek dizi", rating: 7, createdAt: new Date(now.getTime() - 700) });
    await post("post-removed", { status: "removed" });
    await post("foreign-post", { communityId: foreignRow.id });
    await event("event-upcoming");
    await event("event-cancelled", { status: "cancelled", createdAt: new Date(now.getTime() - 300) });
    await event("event-past", { startsAt: new Date(now.getTime() - 86_400_000) });
    await event("event-cancelled-past", { status: "cancelled", startsAt: new Date(now.getTime() - 86_400_000) });
    await event("event-removed", { status: "removed" });
    await event("foreign-event", { communityId: foreignRow.id });
    for (const postId of ["post-open", "review-spoiler"]) {
      await db.communityComment.createMany({ data: ["owner", "reader", "other"].map(authorId => ({ postId, authorId, body: "Yalnız test yorumu." })) });
      await db.communityComment.create({ data: { postId, authorId: "owner", body: "Kaldırılmış yorum.", status: "removed" } });
    }
    const read = (options = {}, viewerId = null) => communityTimeline(db, source.slug, viewerId, options, now);

    await t.test("genel/topluluk dağıtımları tek yerde, tam açık metin ve boş spoiler DTO", async () => {
      const page = await read();
      assert.deepEqual(page.items.map(item => item.id), ["event-upcoming", "event-cancelled", "review-spoiler", "review-tv", "post-open"]);
      assert.equal(page.nextCursor, null);
      assert.equal(page.items.find(item => item.id === "post-open").content, long);
      assert.equal(page.items.find(item => item.id === "event-upcoming").content, long);
      assert.equal(page.items.find(item => item.id === "post-open").excerpt.length, 240);
      assert.equal(page.items.find(item => item.id === "review-spoiler").content, "");
      assert.equal(page.items.find(item => item.id === "review-spoiler").excerpt, "");
      assert.ok(!JSON.stringify(page).includes("Gizli spoiler cümlesi"));
      assert.ok(!JSON.stringify(page).includes("email"));
      assert.ok(page.items.filter(item => item.kind === "post").every(item => !Object.hasOwn(item, "_count")));
      assert.ok(page.items.every(item => item.community.slug === source.slug && !Object.hasOwn(item.author, "id")));
      assert.equal(page.items.find(item => item.id === "post-open").commentCount, 3);
      assert.equal(page.items.find(item => item.id === "review-spoiler").commentCount, 3);
      assert.equal((await communityGeneralFeed(db, null, null, "review", now)).items.find(item => item.id === "review-spoiler").commentCount, 3);
      for (const block of [{ blockerId: "reader", blockedId: "other" }, { blockerId: "other", blockedId: "reader" }]) {
        await db.userBlock.create({ data: block });
        assert.equal((await read({}, "reader")).items.find(item => item.id === "review-spoiler").commentCount, 2);
        assert.equal((await communityGeneralFeed(db, "reader", null, "review", now)).items.find(item => item.id === "review-spoiler").commentCount, 2);
        await db.userBlock.deleteMany({ where: block });
      }
    });

    await t.test("tür, inceleme alanı, etkinlik zamanı ve kayıt filtresi sunucuda uygulanır", async () => {
      assert.equal((await read({ kind: "discussion" })).items.length, 1);
      assert.equal((await read({ kind: "review" })).items.length, 2);
      assert.deepEqual((await read({ kind: "review", reviewKind: "book" })).items.map(item => item.id), ["review-spoiler"]);
      assert.deepEqual((await read({ kind: "event" })).items.map(item => item.id), ["event-upcoming"]);
      assert.deepEqual((await read({ kind: "event", eventFilter: "past" })).items.map(item => item.id), ["event-past"]);
      assert.deepEqual(new Set((await read({ kind: "event", eventFilter: "cancelled" })).items.map(item => item.id)), new Set(["event-cancelled", "event-cancelled-past"]));
      await db.communityPostSave.createMany({ data: ["post-open", "review-spoiler"].map(postId => ({ postId, userId: "reader" })) });
      assert.deepEqual((await read({ savedOnly: true }, "reader")).items.map(item => item.id), ["review-spoiler", "post-open"]);
      assert.equal((await read({ savedOnly: true, kind: "event" }, "reader")).items.length, 0);
      await assert.rejects(read({ savedOnly: true }), denied(401));
      await db.userList.update({ where: { id: "other" }, data: { status: "deleted" } });
      await assert.rejects(read({ savedOnly: true }, "other"), denied(401));
      assert.equal((await read()).items.find(item => item.id === "post-open").commentCount, 2);
      await db.userList.update({ where: { id: "other" }, data: { status: "active" } });
    });

    await t.test("topluluk kartı community dağıtımını beğenir; genel kart sınırı genişlemez", async () => {
      const payload = { action: "set-like", postId: "post-open", active: true, surface: "community" };
      const result = await communities.mutate(source.slug, "reader", payload);
      assert.equal(result.reactionState.viewerLiked, true);
      assert.equal((await read({}, "reader")).items.find(item => item.id === "post-open").viewerLiked, true);
      await assert.rejects(communities.mutate(source.slug, "reader", { ...payload, surface: "feed" }), denied(404));
      await assert.rejects(communities.mutate(source.slug, "other", payload), denied(403));
      await assert.rejects(communities.mutate(source.slug, "owner", payload), denied(403));
    });

    await t.test("iki yönde engel, pasif yazar ve kaldırılmış kayıtlar görünmez", async () => {
      for (const block of [{ blockerId: "reader", blockedId: "owner" }, { blockerId: "owner", blockedId: "reader" }]) {
        await db.userBlock.create({ data: block });
        assert.equal((await read({}, "reader")).items.length, 0);
        await db.userBlock.deleteMany({ where: block });
      }
      await db.userList.update({ where: { id: "owner" }, data: { status: "deleted" } });
      assert.equal((await read()).items.length, 0);
      await db.userList.update({ where: { id: "owner" }, data: { status: "active" } });
      const ids = (await read()).items.map(item => item.id);
      assert.ok(!ids.includes("post-removed") && !ids.includes("event-removed"));
    });

    await t.test("arşiv okunur, yeni tepki yazılamaz; kendi kaydını geri alma korunur", async () => {
      await db.community.update({ where: { id: row.id }, data: { status: "archived" } });
      const page = await read({}, "reader");
      assert.equal(page.items.length, 5);
      assert.ok(page.items.filter(item => item.kind === "post").every(item => !item.canLike && !item.canSave));
      await assert.rejects(communities.mutate(source.slug, "reader", { action: "set-save", postId: "post-open", active: true, surface: "community" }), denied(409));
      assert.equal((await communities.mutate(source.slug, "reader", { action: "set-save", postId: "post-open", active: false, surface: "community" })).reactionState.viewerSaved, false);
      await db.community.update({ where: { id: row.id }, data: { status: "active" } });
    });

    await t.test("aynı zaman/ID iki tabloda kayıp veya tekrar üretmez, yeni baş kayıt eski sayfayı bozmaz", async () => {
      const tiedAt = new Date(now.getTime() + 1000);
      for (let i = 0; i < 13; i++) {
        const id = `tie-${String(i).padStart(2, "0")}`;
        await post(id, { createdAt: tiedAt });
        await event(id, { createdAt: tiedAt });
      }
      const first = await read(), collected = [...first.items];
      assert.equal(first.items.length, 10); assert.ok(first.nextCursor);
      await post("new-head", { createdAt: new Date(tiedAt.getTime() + 1000) });
      let cursor = first.nextCursor, pages = 1;
      while (cursor) {
        assert.ok(pages++ < 10, "cursor must progress");
        const page = await read({ cursor }); collected.push(...page.items); cursor = page.nextCursor;
      }
      const keys = collected.map(item => `${item.kind}:${item.id}`);
      assert.equal(keys.length, 31); assert.equal(new Set(keys).size, 31);
      assert.ok(!keys.includes("post:new-head"));
      assert.deepEqual([...collected].sort(compareTimelineItems), collected);
      assert.ok(keys.slice(0, 13).every(key => key.startsWith("post:tie-")));
      assert.ok(keys.slice(13, 26).every(key => key.startsWith("event:tie-")));
    });

    await t.test("geçersiz filtre/cursor ve bulunamayan topluluk reddedilir", async () => {
      for (const options of [{ kind: "music" }, { kind: "discussion", reviewKind: "book" }, { reviewKind: "invalid" }, { eventFilter: "invalid" }, { savedOnly: "1" }, { cursor: "bad" }, { cursor: timelineCursor({ kind: "music", id: "wrong-source", createdAt: now.toISOString() }) }]) await assert.rejects(read(options), denied(400));
      await assert.rejects(communityTimeline(db, "missing", null, {}, now), denied(404));
    });
  } finally {
    await db.$disconnect();
    const resolved = path.resolve(directory), temporaryRoot = path.resolve(tmpdir());
    if (path.dirname(resolved) !== temporaryRoot || !path.basename(resolved).startsWith("listekutusu-community-timeline-")) throw new Error("Unexpected temporary test directory");
    await rm(resolved, { recursive: true, force: true });
  }
});
