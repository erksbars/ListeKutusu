import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createCommunities, CommunityError } from "../lib/communities.ts";
import { createCommunityLifecycle } from "../lib/communityLifecycle.ts";
import { deleteAccountData } from "../lib/accountDeletion.ts";
import { communityNavigationFromParams, communityNavigationParams } from "../lib/communityNavigation.ts";
const denied = status => error => error instanceof CommunityError && error.status === status;
test("topluluk beğenisi ve özel kayıt: tekillik, sınırlar ve yaşam döngüsü", async t => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-reactions-"));
  const config = { datasources: { db: { url: `file:${path.join(directory, "test.db").replaceAll("\\", "/")}` } } };
  const db = new PrismaClient(config), peer = new PrismaClient(config);
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) for (const sql of (await readFile(new URL(`${folder}/migration.sql`, root), "utf8")).split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(sql);
    for (const id of ["owner", "a", "b", "outsider"]) await db.userList.create({ data: { id, slug: id, ownerName: id, passwordHash: "test-verified-hash" } });
    const service = createCommunities(db), input = { name: "Etkileşim test topluluğu", category: "interest", description: "Beğeni ve özel kayıt için geçici topluluk.", rules: "Yalnız sentetik test verisi kullanılır." };
    const { slug } = await service.create("owner", input), other = await service.create("outsider", input);
    const source = await db.community.findUniqueOrThrow({ where: { slug } });
    for (const user of ["a", "b"]) await service.mutate(slug, user, { action: "join" });
    const post = (await service.mutate(slug, "owner", { action: "create-post", title: "Etkileşim sohbeti", body: "Örnek sohbet metni." })).post;
    const react = (user, action, active, fields = {}, target = service) => target.mutate(slug, user, { action, active, postId: post.id, ...fields });
    const detail = user => service.post(slug, post.id, user, 1);
    await t.test("aktif üyelik/strict bool/yazar ve kaynak sınırları", async () => {
      await assert.rejects(react("missing", "set-like", true), denied(401));
      await assert.rejects(react("outsider", "set-save", true), denied(403));
      await assert.rejects(react("owner", "set-like", true), denied(403));
      await assert.rejects(react("a", "set-like", "true"), denied(400));
      await assert.rejects(service.mutate(other.slug, "outsider", { action: "set-save", active: true, postId: post.id }), denied(404));
      await react("owner", "set-save", true); assert.equal((await detail("owner")).post.viewerSaved, true);
      assert.deepEqual(await service.mutate(other.slug, "owner", { action: "set-save", active: false, postId: post.id }), { ok: true });
      assert.equal((await detail("owner")).post.viewerSaved, true);
      assert.deepEqual(await react("b", "set-save", false, { postId: "missing" }), { ok: true });
      await react("owner", "set-save", false);
    });
    await t.test("iki bağlantıda tekrar açık tercih tek kayıt; içerik/sürüm değişmez", async () => {
      const before = await db.communityPost.findUniqueOrThrow({ where: { id: post.id } });
      await Promise.all([react("a", "set-like", true), react("a", "set-like", true, {}, createCommunities(peer))]);
      await react("a", "set-save", true, { userId: "b", likeCount: 999 });
      const savedAt = (await db.communityPostSave.findFirstOrThrow()).createdAt;
      await react("a", "set-save", true);
      assert.equal(await db.communityPostLike.count(), 1); assert.equal(await db.communityPostSave.count(), 1);
      assert.equal((await db.communityPostSave.findFirstOrThrow()).userId, "a"); assert.deepEqual((await db.communityPostSave.findFirstOrThrow()).createdAt, savedAt);
      const after = await db.communityPost.findUniqueOrThrow({ where: { id: post.id } }); assert.equal(after.revision, before.revision); assert.deepEqual(after.updatedAt, before.updatedAt); assert.equal(after.distribution, "community");
      assert.equal(await db.feedLike.count(), 0); assert.equal(await db.feedSave.count(), 0); assert.equal(await db.notification.count(), 0);
    });
    await t.test("sayı ve yalnız kendi bitleri; kimlik/kaydetme sayısı kamuya taşınmaz", async () => {
      const own = (await detail("a")).post, foreign = (await detail("b")).post, publicPost = (await detail(null)).post;
      assert.equal(own.likeCount, 1); assert.equal(own.viewerLiked, true); assert.equal(own.viewerSaved, true);
      assert.equal(foreign.viewerLiked, false); assert.equal(foreign.viewerSaved, false);
      assert.equal(publicPost.viewerSaved, false); assert.equal(publicPost.canSave, false);
      for (const key of ["likes", "saves", "saverIds", "likerIds", "saveCount"]) assert.equal(Object.hasOwn(publicPost, key), false);
      await assert.rejects(service.detail(slug, null, 1, "all", "all", true), denied(401));
      assert.equal((await service.detail(slug, "b", 1, "all", "all", true)).posts.length, 0);
    });
    await t.test("özel kayıt filtresi sayfalama öncesi; URL taşıma ve spoiler", async () => {
      const rows = Array.from({ length: 24 }, (_, i) => ({ id: `saved-fixture-${i}`, communityId: source.id, authorId: "owner", title: `Kayıt incelemesi ${i}`, body: "Spoiler içeren inceleme metni.", type: "review", reviewKind: "book", subjectTitle: "Kurgusal kitap", rating: 8, spoiler: true }));
      await db.communityPost.createMany({ data: rows }); await db.communityPostSave.createMany({ data: rows.map(row => ({ userId: "a", postId: row.id })) });
      const first = await service.detail(slug, "a", 1, "all", "all", true), next = await service.detail(slug, "a", 2, "all", "all", true);
      assert.equal(first.posts.length, 20); assert.equal(next.posts.length, 5); assert.equal(first.hasMore, true); assert.equal(next.hasMore, false);
      assert.equal((await service.detail(slug, "a", 1, "review", "book", true)).posts.every(item => item.excerpt === ""), true);
      const url = communityNavigationParams(new URLSearchParams("postType=review"), { savedOnly: true, page: 2 }); assert.equal(communityNavigationFromParams(url).savedOnly, true);
      assert.equal(communityNavigationParams(url, { savedOnly: false }).has("saved"), false);
    });
    await t.test("ban/ayrılma beğeniyi temizler; kayıt özel kalır ve yeni tercih kapanır", async () => {
      await service.mutate(slug, "owner", { action: "moderate-member", userId: "a", operation: "ban" });
      assert.equal(await db.communityPostLike.count({ where: { userId: "a" } }), 0); assert.equal((await detail("a")).post.viewerSaved, true);
      await assert.rejects(react("a", "set-like", true), denied(403)); await assert.rejects(react("a", "set-save", true), denied(403));
      await react("a", "set-save", false); assert.equal((await detail("a")).post.viewerSaved, false);
      await service.mutate(slug, "owner", { action: "moderate-member", userId: "a", operation: "unban" }); assert.equal((await detail(null)).post.likeCount, 0);
      await react("b", "set-like", true); await react("b", "set-save", true); await service.mutate(slug, "b", { action: "leave" });
      assert.equal((await detail(null)).post.likeCount, 0); await react("b", "set-save", false); await react("b", "set-like", false);
      await service.mutate(slug, "b", { action: "join" });
    });
    await t.test("engel/kaldırılmış kaynak gizlenir; kendi tercihini geri almak açık kalır", async () => {
      await react("b", "set-like", true); await react("b", "set-save", true);
      await db.userBlock.create({ data: { blockerId: "b", blockedId: "owner" } });
      await assert.rejects(react("b", "set-save", true), denied(404)); await assert.rejects(detail("b"), denied(404));
      assert.equal((await service.detail(slug, "b", 1, "all", "all", true)).posts.length, 0);
      await react("b", "set-save", false); await react("b", "set-like", false); await db.userBlock.deleteMany();
      await react("b", "set-save", true); await db.communityPost.update({ where: { id: post.id }, data: { status: "removed" } });
      await assert.rejects(react("b", "set-like", true), denied(404)); await react("b", "set-save", false);
      await db.communityPost.update({ where: { id: post.id }, data: { status: "published" } });
    });
    await t.test("tercih ve ban yarışı son durumda yasak üyenin beğenisini bırakmaz", async () => {
      await Promise.allSettled([react("b", "set-like", true, {}, createCommunities(peer)), service.mutate(slug, "owner", { action: "moderate-member", userId: "b", operation: "ban" })]);
      assert.equal((await db.communityMember.findUniqueOrThrow({ where: { communityId_userId: { communityId: source.id, userId: "b" } } })).status, "banned");
      assert.equal(await db.communityPostLike.count({ where: { userId: "b" } }), 0);
      await service.mutate(slug, "owner", { action: "moderate-member", userId: "b", operation: "unban" });
    });
    await t.test("arşivde ekleme kapalı; kendi geri alması idempotent", async () => {
      await react("b", "set-like", true); await react("b", "set-save", true);
      await createCommunityLifecycle(db).mutate(slug, "owner", { action: "archive", confirmation: "TOPLULUĞU ARŞİVLE" });
      await assert.rejects(react("b", "set-save", true), denied(409)); assert.equal((await detail("b")).post.canSave, false);
      await react("b", "set-like", false); await react("b", "set-like", false); await react("b", "set-save", false);
      await createCommunityLifecycle(db).mutate(slug, "owner", { action: "restore", confirmation: "TOPLULUĞU YENİDEN AÇ" });
    });
    await t.test("hesap kapatma yalnız kendi tercihlerini temizler; fiziksel içerik silme cascade", async () => {
      await react("a", "set-like", true); await react("a", "set-save", true); await react("b", "set-like", true); await react("b", "set-save", true);
      await deleteAccountData(db, "a", "test-verified-hash", false);
      assert.equal(await db.communityPostLike.count({ where: { userId: "a" } }), 0); assert.equal(await db.communityPostSave.count({ where: { userId: "a" } }), 0);
      assert.equal(await db.communityPostLike.count({ where: { userId: "b" } }), 1); assert.equal(await db.communityPostSave.count({ where: { userId: "b" } }), 1);
      await db.communityPost.delete({ where: { id: post.id } }); assert.equal(await db.communityPostLike.count(), 0); assert.equal(await db.communityPostSave.count(), 0);
    });
  } finally { await Promise.all([db.$disconnect(), peer.$disconnect()]); await rm(directory, { recursive: true, force: true }); }
});
