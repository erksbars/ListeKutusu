import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createCommunities, CommunityError } from "../lib/communities.ts";
import { createCommunityLifecycle } from "../lib/communityLifecycle.ts";
import { readPostFilters, validPostFilters } from "../lib/communityPostFilters.ts";
import { communityNavigationFromParams, communityNavigationParams } from "../lib/communityNavigation.ts";
const denied = status => error => error instanceof CommunityError && error.status === status;
test("inceleme düzenleme ve sayfalama öncesi içerik filtresi", async t => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-review-edit-"));
  const config = { datasources: { db: { url: `file:${path.join(directory, "test.db").replaceAll("\\", "/")}` } } };
  const db = new PrismaClient(config), peer = new PrismaClient(config);
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) for (const sql of (await readFile(new URL(`${folder}/migration.sql`, root), "utf8")).split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(sql);
    for (const id of ["owner", "author", "other", "outsider"]) await db.userList.create({ data: { id, slug: id, ownerName: id, role: id === "other" ? "admin" : "member" } });
    const service = createCommunities(db), create = user => service.create(user, { name: "İnceleme düzenleme testi", description: "Yalnız geçici inceleme düzenleme topluluğu.", category: "interest", rules: "Yalnız test verisidir; hassas veri kullanma." });
    const { slug } = await create("owner"), second = await create("outsider");
    for (const user of ["author", "other"]) await service.mutate(slug, user, { action: "join" });
    const community = await db.community.findUniqueOrThrow({ where: { slug } });
    const review = (await service.mutate(slug, "author", { action: "create-post", type: "review", reviewKind: "tv", subjectTitle: "Kaynak dizi", sourceUrl: "https://www.tvmaze.com/shows/1", rating: 8, spoiler: false, title: "İlk inceleme başlığı", body: "Değiştirilebilir ilk inceleme metni yeterince uzundur." })).post;
    await db.communityPost.update({ where: { id: review.id }, data: { referenceProvider: "tvmaze" } });
    const edit = (user = "author", patch = {}) => service.mutate(slug, user, { action: "edit-review", postId: review.id, expectedRevision: 0, title: "Güncel inceleme başlığı", body: "Güncellenen inceleme metni en az yirmi karakter içeriyor.", rating: 9, spoiler: true, ...patch });
    await t.test("filtre normalizasyonu, URL ve katı API değerleri", async () => {
      assert.deepEqual(readPostFilters("review", "book"), { postType: "review", reviewKind: "book" });
      assert.deepEqual(readPostFilters("discussion", "book"), { postType: "discussion", reviewKind: "all" });
      assert.equal(validPostFilters("review", "toString"), false);
      for (const values of [["invalid", "all"], ["discussion", "book"], ["review", "constructor"]]) await assert.rejects(service.detail(slug, null, 1, ...values), denied(400));
      const query = communityNavigationParams(new URLSearchParams("page=2"), { postType: "review", reviewKind: "book", page: 1 });
      assert.equal(query.has("page"), false); assert.equal(communityNavigationFromParams(query).reviewKind, "book");
      assert.equal(communityNavigationParams(query, { postType: "discussion" }).has("reviewKind"), false);
    });
    await t.test("aktif yazar dışında kurucu/global admin/yabancı düzenleyemez", async () => {
      for (const user of ["owner", "other", "outsider"]) await assert.rejects(edit(user), denied(403));
      await assert.rejects(service.mutate(second.slug, "outsider", { action: "edit-review", postId: review.id }), denied(404));
      const discussion = (await service.mutate(slug, "author", { action: "create-post", title: "Sohbet örneği", body: "Sohbet metni." })).post;
      await assert.rejects(edit("author", { postId: discussion.id }), denied(409));
      await service.mutate(slug, "owner", { action: "moderate-member", userId: "author", operation: "ban" }); await assert.rejects(edit(), denied(403));
      await service.mutate(slug, "owner", { action: "moderate-member", userId: "author", operation: "unban" });
      await db.userList.update({ where: { id: "author" }, data: { status: "deleted" } }); await assert.rejects(edit(), denied(401));
      await db.userList.update({ where: { id: "author" }, data: { status: "active" } });
    });
    await t.test("girdi sınırları ve gerçek no-op sürüm/audit üretmez", async () => {
      for (const patch of [{ title: "xx" }, { body: "kısa" }, { rating: 0 }, { rating: 1.2 }, { spoiler: "true" }, { expectedRevision: -1 }, { expectedRevision: "0" }]) await assert.rejects(edit("author", patch), denied(400));
      const before = await db.communityPost.findUniqueOrThrow({ where: { id: review.id } });
      const result = await edit("author", { title: before.title, body: before.body, rating: before.rating, spoiler: before.spoiler });
      assert.equal(result.changed, false); assert.equal(await db.communityModerationLog.count({ where: { action: "edit-review" } }), 0);
      assert.equal((await db.communityPost.findUniqueOrThrow({ where: { id: review.id } })).editedAt, null);
    });
    await t.test("audit hatasında edit rollback; yazar/eser/kaynak/dağıtım korunur", async () => {
      await db.$executeRawUnsafe("CREATE TRIGGER fail_review_edit BEFORE INSERT ON CommunityModerationLog WHEN NEW.action='edit-review' BEGIN SELECT RAISE(ABORT,'audit unavailable'); END");
      await assert.rejects(edit()); assert.equal((await db.communityPost.findUniqueOrThrow({ where: { id: review.id } })).revision, 0);
      await db.$executeRawUnsafe("DROP TRIGGER fail_review_edit");
      await service.mutate(slug, "other", { action: "report", postId: review.id, reason: "Korunacak şikâyet açıklaması" });
      await edit("author", { authorId: "other", type: "discussion", subjectTitle: "Sahte eser", sourceUrl: "https://evil.test", referenceProvider: "fake", distribution: "general", status: "removed" });
      const row = await db.communityPost.findUniqueOrThrow({ where: { id: review.id } });
      assert.equal(row.revision, 1); assert.ok(row.editedAt); assert.equal(row.authorId, "author"); assert.equal(row.type, "review"); assert.equal(row.subjectTitle, "Kaynak dizi"); assert.equal(row.sourceUrl, "https://www.tvmaze.com/shows/1"); assert.equal(row.referenceProvider, "tvmaze"); assert.equal(row.distribution, "community"); assert.equal(row.status, "published");
      assert.equal((await db.communityReport.findFirstOrThrow({ where: { targetId: review.id } })).status, "pending");
      const dto = await service.detail(slug, "other", 1, "review", "tv"); assert.equal(dto.posts[0].excerpt, ""); assert.ok(dto.posts[0].editedAt);
      await assert.rejects(edit(), denied(409));
    });
    await t.test("iki bağlantıdaki aynı sürümden yalnız tek edit kaydedilir", async () => {
      const body = { action: "edit-review", postId: review.id, expectedRevision: 1, title: "Yarışan inceleme başlığı", body: "İki bağlantıdan gelen düzenleme için yeterince uzun metin.", rating: 7, spoiler: false };
      const results = await Promise.allSettled([service.mutate(slug, "author", body), createCommunities(peer).mutate(slug, "author", { ...body, rating: 6 })]);
      assert.equal(results.filter(item => item.status === "fulfilled").length, 1); assert.equal(results.find(item => item.status === "rejected").reason.status, 409);
      assert.equal((await db.communityPost.findUniqueOrThrow({ where: { id: review.id } })).revision, 2);
      assert.equal(await db.communityModerationLog.count({ where: { action: "edit-review" } }), 2);
    });
    await t.test("tür/alan filtresi sayfalama öncesindedir; engellenen yazar görünmez", async () => {
      await db.communityPost.createMany({ data: Array.from({ length: 25 }, (_, index) => ({ communityId: community.id, authorId: "author", title: `Kitap incelemesi ${index}`, body: "Yalnız filtre testi için kitap incelemesi.", type: "review", reviewKind: "book", subjectTitle: "Kurgusal kitap", rating: 8 })) });
      const first = await service.detail(slug, null, 1, "review", "book"), next = await service.detail(slug, null, 2, "review", "book");
      assert.equal(first.posts.length, 20); assert.equal(first.hasMore, true); assert.equal(next.posts.length, 5); assert.equal(next.hasMore, false);
      assert.equal((await service.detail(slug, null, 1, "discussion")).posts.length, 1);
      await db.userBlock.create({ data: { blockerId: "other", blockedId: "author" } });
      assert.equal((await service.detail(slug, "other", 1, "review", "book")).posts.length, 0);
      await db.userBlock.deleteMany();
    });
    await t.test("kaldırılan inceleme ve arşiv yazmaya kapalıdır; okumalar korunur", async () => {
      await db.communityPost.update({ where: { id: review.id }, data: { status: "removed" } }); await assert.rejects(edit("author", { expectedRevision: 2 }), denied(404));
      await db.communityPost.update({ where: { id: review.id }, data: { status: "published" } });
      await createCommunityLifecycle(db).mutate(slug, "owner", { action: "archive", confirmation: "TOPLULUĞU ARŞİVLE" });
      await assert.rejects(edit("author", { expectedRevision: 2 }), denied(409)); assert.equal((await service.detail(slug, null, 1, "review", "tv")).posts.length, 1);
    });
  } finally { await Promise.all([db.$disconnect(), peer.$disconnect()]); await rm(directory, { recursive: true, force: true }); }
});
