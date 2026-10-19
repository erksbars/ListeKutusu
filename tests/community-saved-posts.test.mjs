import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createCommunities, CommunityError } from "../lib/communities.ts";
import { communitySavedPosts } from "../lib/communitySavedPosts.ts";
import { communityGeneralFeed } from "../lib/communityGeneralFeed.ts";
const denied = status => error => error instanceof CommunityError && error.status === status;

test("karma kartlar ve topluluklar arası özel kayıt merkezi", async t => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-saved-center-"));
  let queries = 0;
  const db = new PrismaClient({ datasources: { db: { url: `file:${path.join(directory, "test.db").replaceAll("\\", "/")}` } }, log: [{ emit: "event", level: "query" }] });
  db.$on("query", () => queries++);
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) for (const sql of (await readFile(new URL(`${folder}/migration.sql`, root), "utf8")).split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(sql);
    for (const id of ["owner", "reader", "other", "inactive"]) await db.userList.create({ data: { id, slug: id, ownerName: id } });
    const service = createCommunities(db), sources = [];
    for (let i = 0; i < 2; i++) {
      const { slug } = await service.create("owner", { name: `Kayıt merkezi ${i}`, category: "interest", description: "Geçici sentetik kayıt topluluğu.", rules: "Yalnız test amaçlı içerik." });
      sources.push(await db.community.findUniqueOrThrow({ where: { slug } }));
      await service.mutate(slug, "reader", { action: "join" });
    }
    const posts = [];
    for (let i = 0; i < 25; i++) posts.push(await db.communityPost.create({ data: { id: `post-${i.toString().padStart(2, "0")}`, communityId: sources[i % 2].id, authorId: "owner", title: `Kayıt ${i}`, body: "Spoiler testi saklanmış kaynak metni.", type: i < 22 ? "review" : "discussion", reviewKind: i < 22 ? "book" : null, subjectTitle: i < 22 ? "Örnek kitap" : null, rating: i < 22 ? 8 : null, spoiler: i < 22, distribution: "general", createdAt: new Date(1700000000000 + i * 1000) } }));
    const react = (post, action, active, surface = "feed", user = "reader") => service.mutate(sources.find(source => source.id === post.communityId).slug, user, { action, active, postId: post.id, surface });
    await t.test("özel liste yalnız aktif hesaba açık, sayfa ve filtre katı", async () => {
      await assert.rejects(communitySavedPosts(db, null), denied(401));
      await db.userList.update({ where: { id: "inactive" }, data: { status: "deleted" } });
      await assert.rejects(communitySavedPosts(db, "inactive"), denied(401));
      for (const page of [0, 101, 1.5]) await assert.rejects(communitySavedPosts(db, "reader", page), denied(400));
      await assert.rejects(communitySavedPosts(db, "reader", 1, "discussion", "book"), denied(400));
      assert.equal((await communitySavedPosts(db, "other")).items.length, 0);
    });
    await t.test("yazma yanıtı güncel kendi bitleri; müzik ve etkinlik etkileşimi yok", async () => {
      const result = await react(posts[0], "set-like", true);
      assert.equal(result.reactionState.likeCount, 1); assert.equal(result.reactionState.viewerLiked, true);
      assert.equal(result.reactionState.viewerSaved, false);
      await react(posts[0], "set-save", true);
      const feed = await communityGeneralFeed(db, "reader", null, "review");
      assert.equal(feed.items.every(item => item.canSave && item.canLike), true);
      for (const item of feed.items) for (const field of ["body", "saves", "likes", "saveCount", "saverIds", "likerIds"]) assert.equal(Object.hasOwn(item, field), false);
      assert.equal((await communityGeneralFeed(db, "other", null, "review")).items.every(item => !item.viewerSaved && !item.viewerLiked && !item.canSave), true);
      assert.equal((await communityGeneralFeed(db, null, null, "review")).items.every(item => !item.viewerSaved && !item.canLike), true);
      assert.equal(await db.feedLike.count(), 0); assert.equal(await db.feedSave.count(), 0); assert.equal(await db.notification.count(), 0);
    });
    await t.test("iki topluluk tek liste, kaydetme zamanı ve deterministik eşitlik; filtre önce", async () => {
      await db.communityPostSave.deleteMany();
      await db.communityPostSave.createMany({ data: posts.map((post, i) => ({ userId: "reader", postId: post.id, createdAt: new Date(1800000000000 - Math.floor(i / 2) * 1000) })) });
      const first = await communitySavedPosts(db, "reader"), second = await communitySavedPosts(db, "reader", 2);
      assert.equal(first.items.length, 20); assert.equal(second.items.length, 5); assert.equal(first.hasMore, true); assert.equal(second.hasMore, false);
      assert.equal(first.items[0].id, "post-01"); assert.equal(first.items[1].id, "post-00");
      assert.equal(new Set([...first.items, ...second.items].map(item => item.id)).size, 25);
      assert.equal(new Set(first.items.map(item => item.community.slug)).size, 2);
      const book = await communitySavedPosts(db, "reader", 2, "review", "book"); assert.equal(book.items.length, 2);
      assert.equal((await communitySavedPosts(db, "reader", 1, "discussion")).items.length, 3);
      assert.ok(!JSON.stringify(first).includes("saklanmış kaynak metni"));
      for (const item of first.items) { assert.equal(item.viewerSaved, true); assert.equal(item.excerpt, ""); assert.equal(item.author.id, undefined); assert.equal(item.community.id, undefined); }
    });
    await t.test("çoklu kaynak metrikleri kaynak üyeliğini karıştırmaz; sorgu sayısı kartla artmaz", async () => {
      await db.communityMember.create({ data: { communityId: sources[0].id, userId: "other" } });
      await db.communityPostLike.createMany({ data: [posts[0], posts[1]].map(post => ({ postId: post.id, userId: "other" })) });
      queries = 0; const page = await communitySavedPosts(db, "reader"); const queryCount = queries;
      assert.equal(page.items.find(item => item.id === posts[0].id).likeCount, 2);
      assert.equal(page.items.find(item => item.id === posts[1].id).likeCount, 0);
      assert.ok(queryCount < 16, `bounded queries: ${queryCount}`);
      await db.userBlock.create({ data: { blockerId: "other", blockedId: "reader" } });
      assert.equal((await communitySavedPosts(db, "reader")).items.find(item => item.id === posts[0].id).likeCount, 1);
      await db.userBlock.deleteMany();
    });
    await t.test("dağıtımı geri çekilmiş eski karma kart yeni tercih yazamaz; özel kayıt okunur", async () => {
      await db.communityPost.update({ where: { id: posts[0].id }, data: { distribution: "community" } });
      await assert.rejects(react(posts[0], "set-like", true), denied(404));
      const removed = await react(posts[0], "set-like", false); assert.equal(removed.reactionState, null);
      assert.equal((await communitySavedPosts(db, "reader")).items.some(item => item.id === posts[0].id), true);
      assert.equal((await react(posts[0], "set-like", true, "saved")).reactionState.viewerLiked, true);
      await assert.rejects(react(posts[0], "set-save", true, "unknown"), denied(400));
    });
    await t.test("engel iki yönlü, kaldırma ve pasif yazar listeden kapanır", async () => {
      for (const block of [{ blockerId: "reader", blockedId: "owner" }, { blockerId: "owner", blockedId: "reader" }]) {
        await db.userBlock.create({ data: block }); assert.equal((await communitySavedPosts(db, "reader")).items.length, 0);
        assert.equal((await react(posts[0], "set-like", false, "saved")).reactionState, null);
        await db.userBlock.deleteMany();
      }
      await db.communityPost.update({ where: { id: posts[0].id }, data: { status: "removed" } });
      assert.equal((await communitySavedPosts(db, "reader")).items.some(item => item.id === posts[0].id), false);
      await db.communityPost.update({ where: { id: posts[0].id }, data: { status: "published" } });
      await db.userList.update({ where: { id: "owner" }, data: { status: "deleted" } });
      assert.equal((await communitySavedPosts(db, "reader")).items.length, 0);
      await db.userList.update({ where: { id: "owner" }, data: { status: "active" } });
    });
    await t.test("arşiv ve ayrılma kayıt okumayı genişletmez; yeni yazma yok, geri alma açık", async () => {
      await db.community.update({ where: { id: sources[0].id }, data: { status: "archived" } });
      const archived = (await communitySavedPosts(db, "reader")).items.find(item => item.id === posts[0].id);
      assert.equal(archived.community.status, "archived"); assert.equal(archived.canSave, false);
      await assert.rejects(react(posts[0], "set-save", true, "saved"), denied(409));
      assert.equal((await react(posts[0], "set-save", false, "saved")).reactionState.viewerSaved, false);
      await service.mutate(sources[1].slug, "reader", { action: "leave" });
      const left = (await communitySavedPosts(db, "reader")).items.filter(item => item.community.slug === sources[1].slug);
      assert.ok(left.length > 0); assert.equal(left.every(item => !item.canSave && item.viewerSaved), true);
    });
  } finally { await db.$disconnect(); await rm(directory, { recursive: true, force: true }); }
});
