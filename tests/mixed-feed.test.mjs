import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { mixedFeed } from "../lib/mixedFeed.ts";
import { CommunityError } from "../lib/communityError.ts";
import { compareTimelineItems } from "../lib/feedTimelineOrder.ts";
import { parseTimelineCursor } from "../lib/feedTimeline.ts";

const now = new Date("2026-10-15T12:00:00Z");
const denied = status => error => error instanceof CommunityError && error.status === status;
const timeline = page => [...page.posts.map(post => ({ ...post, kind: "music" })), ...page.communityItems].sort(compareTimelineItems);

test("karma akış tür, görünürlük, takip, etkileşim ve üç kaynaklı cursor", async t => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-mixed-feed-"));
  const db = new PrismaClient({ datasources: { db: { url: `file:${path.join(directory, "test.db").replaceAll("\\", "/")}` } } });
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) {
      for (const sql of (await readFile(new URL(`${folder}/migration.sql`, root), "utf8")).split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(sql);
    }
    for (const id of ["owner", "reader", "other"]) await db.userList.create({ data: { id, ownerName: id, slug: id } });
    const community = await db.community.create({ data: { ownerId: "owner", name: "Karma akış", slug: "mixed", description: "Örnek topluluk", category: "interest", rules: "Yalnız test" } });
    const music = await db.feedPost.create({ data: { id: "music", authorId: "owner", trackId: "local-fixture", trackName: "Şarkı", artistName: "Sanatçı", tags: '["rock"]', createdAt: new Date(now.getTime() - 2000) } });
    const post = await db.communityPost.create({ data: { id: "post", communityId: community.id, authorId: "owner", title: "İnceleme", body: "Spoiler olan gizli inceleme metni", type: "review", reviewKind: "book", subjectTitle: "Örnek kitap", rating: 8, spoiler: true, distribution: "general", createdAt: new Date(now.getTime() - 1000) } });
    const event = await db.communityEvent.create({ data: { id: "event", communityId: community.id, organizerId: "owner", title: "Buluşma", description: "Kurgusal test buluşması", city: "Örnek", venue: "Kamusal alan", startsAt: new Date(now.getTime() + 86_400_000), distribution: "general", createdAt: now } });
    await t.test("tek kronoloji ve doğru DTO, spoiler veya özel alan yok", async () => {
      const page = await mixedFeed(db, null, null, "all", "all", now);
      assert.deepEqual(timeline(page).map(item => item.kind), ["event", "post", "music"]);
      assert.equal(page.nextCursor, null); assert.equal(page.communityItems.find(item => item.id === post.id).excerpt, "");
      assert.ok(!JSON.stringify(page).includes("Spoiler olan gizli"));
      assert.deepEqual(page.posts[0].tags, ["rock"]); assert.equal(page.posts[0].isMine, false);
      assert.ok(!JSON.stringify(page).includes("email"));
      for (const [filter, count] of [["music", 1], ["discussion", 0], ["review", 1], ["event", 1]]) assert.equal(timeline(await mixedFeed(db, null, null, filter, "all", now)).length, count);
    });
    await t.test("müzik beğeni, kaydetme, liste ve takip bayrakları korunur", async () => {
      await db.feedLike.create({ data: { postId: music.id, userId: "reader" } });
      await db.feedSave.create({ data: { postId: music.id, userId: "reader" } });
      await db.feedListAdd.create({ data: { postId: music.id, userId: "reader" } });
      const item = (await mixedFeed(db, "reader", null, "music", "all", now)).posts[0];
      assert.equal(item.likedByMe, true); assert.equal(item.savedByMe, true); assert.equal(item.addedByMe, true);
      assert.equal(item.likeCount, 1); assert.equal(item.addCount, 1);
      assert.equal((await mixedFeed(db, "owner", null, "music", "all", now)).posts[0].isMine, true);
    });
    await t.test("takip yalnız gerçek Follow ilişkisine bakar; üyelik örtük takip değildir", async () => {
      await assert.rejects(mixedFeed(db, null, null, "all", "following", now), denied(401));
      await db.communityMember.create({ data: { communityId: community.id, userId: "reader" } });
      assert.equal(timeline(await mixedFeed(db, "reader", null, "all", "following", now)).length, 0);
      await db.follow.create({ data: { followerId: "reader", followingId: "owner" } });
      assert.equal(timeline(await mixedFeed(db, "reader", null, "all", "following", now)).length, 3);
      assert.equal((await mixedFeed(db, "reader", null, "music", "following", now)).posts[0].followingAuthor, true);
      await db.follow.deleteMany({ where: { followerId: "reader", followingId: "owner" } });
      assert.equal(timeline(await mixedFeed(db, "reader", null, "all", "following", now)).length, 0);
    });
    await t.test("engelleme iki yönde tüm türleri, gizleme yalnız ilgili müziği süzer", async () => {
      await db.feedHide.create({ data: { postId: music.id, userId: "reader" } });
      assert.equal(timeline(await mixedFeed(db, "reader", null, "all", "all", now)).length, 2);
      await db.feedHide.deleteMany({ where: { userId: "reader" } });
      for (const block of [{ blockerId: "reader", blockedId: "owner" }, { blockerId: "owner", blockedId: "reader" }]) {
        await db.userBlock.create({ data: block });
        assert.equal(timeline(await mixedFeed(db, "reader", null, "all", "all", now)).length, 0);
        await db.userBlock.deleteMany({ where: block });
      }
      await db.userList.update({ where: { id: "owner" }, data: { status: "deleted" } });
      assert.equal(timeline(await mixedFeed(db, null, null, "all", "all", now)).length, 0);
      await db.userList.update({ where: { id: "owner" }, data: { status: "active" } });
    });
    await t.test("genel dağıtımdan geri çekme, kaldırma ve geçmiş etkinlik filtreleri", async () => {
      await db.communityPost.update({ where: { id: post.id }, data: { distribution: "community" } });
      await db.communityEvent.update({ where: { id: event.id }, data: { status: "removed" } });
      assert.equal(timeline(await mixedFeed(db, null, null, "all", "all", now)).length, 1);
      await db.communityPost.update({ where: { id: post.id }, data: { status: "removed" } });
      await db.feedPost.update({ where: { id: music.id }, data: { status: "removed" } });
      assert.equal(timeline(await mixedFeed(db, null, null, "all", "all", now)).length, 0);
    });
    await t.test("eşit zaman ve aynı ID üç tabloda tekrar veya kayıp yaratmaz", async () => {
      for (let i = 0; i < 13; i++) {
        const id = `collision-${i}`;
        await db.feedPost.create({ data: { id, authorId: "owner", trackId: id, trackName: id, artistName: "Örnek", createdAt: now } });
        await db.communityPost.create({ data: { id, communityId: community.id, authorId: "owner", title: id, body: "Örnek", distribution: "general", createdAt: now } });
        await db.communityEvent.create({ data: { id, communityId: community.id, organizerId: "owner", title: id, description: "Örnek", city: "Örnek", venue: "Örnek", startsAt: new Date(now.getTime() + 86_400_000), distribution: "general", createdAt: now } });
      }
      const keys = []; let cursor = null;
      do { const page = await mixedFeed(db, null, cursor, "all", "all", now); keys.push(...timeline(page).map(item => `${item.kind}:${item.id}`)); cursor = page.nextCursor; } while (cursor);
      assert.equal(keys.length, 39); assert.equal(new Set(keys).size, 39);
      assert.ok(keys.slice(0, 13).every(key => key.startsWith("post:")));
      assert.ok(keys.slice(13, 26).every(key => key.startsWith("music:")));
      assert.ok(keys.slice(26).every(key => key.startsWith("event:")));
    });
    await t.test("hatalı kapsam/tür/cursor reddedilir, eski topluluk cursor okunur", async () => {
      await assert.rejects(mixedFeed(db, null, null, "all", "saved", now), denied(400));
      await assert.rejects(mixedFeed(db, null, null, "unknown", "all", now), denied(400));
      for (const value of ["bad", "a".repeat(401), Buffer.from(JSON.stringify({ kind: "music", id: "x", createdAt: "invalid" })).toString("base64url")]) await assert.rejects(mixedFeed(db, null, value, "all", "all", now), denied(400));
      assert.equal(parseTimelineCursor(Buffer.from(JSON.stringify({ at: now.toISOString(), kind: "post", id: "legacy" })).toString("base64url")).createdAt, now.toISOString());
    });
  } finally { await db.$disconnect(); await rm(directory, { recursive: true, force: true }); }
});
