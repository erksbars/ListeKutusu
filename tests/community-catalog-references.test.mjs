import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { CommunityError, createCommunities } from "../lib/communities.ts";
import { resolveCatalogReviewReference } from "../lib/communityReferences.ts";
import { signCatalogSelection } from "../lib/catalogSelection.ts";
const denied = status => error => error instanceof CommunityError && error.status === status;
const book = { id: "openlibrary:book:OL1W", kind: "book", provider: "openlibrary", externalId: "OL1W", title: "Katalog kitabı", creators: ["Yazar"], year: 2020, sourceUrl: "https://openlibrary.org/works/OL1W" };

test("doğrudan katalog incelemesi: imza, kapsam, snapshot ve kitaplık ayrımı", async t => {
  const previous = { enabled: process.env.MEDIA_CATALOG_ENABLED, secret: process.env.SESSION_SECRET };
  process.env.SESSION_SECRET = "test-only-community-catalog-secret-over-32-chars";
  process.env.MEDIA_CATALOG_ENABLED = "true";
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-community-catalog-"));
  const db = new PrismaClient({ datasources: { db: { url: `file:${path.join(directory, "test.db").replaceAll("\\", "/")}` } } });
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) for (const sql of (await readFile(new URL(`${folder}/migration.sql`, root), "utf8")).split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(sql);
    for (const id of ["owner", "reader", "other"]) await db.userList.create({ data: { id, slug: id, ownerName: id } });
    const service = createCommunities(db), { slug } = await service.create("owner", { name: "Katalog incelemeleri", category: "interest", description: "Geçici katalog inceleme testidir.", rules: "Yalnız sentetik test verisi kullanılır." });
    await service.mutate(slug, "reader", { action: "join" });
    const token = signCatalogSelection(book, "reader"), payload = { action: "create-post", type: "review", reviewKind: "book", catalogSelection: token, title: "Katalogdan kitap incelemesi", body: "Bu kitap için yeterince uzun sentetik inceleme metni.", rating: 8, spoiler: true };
    const posts = [];
    await t.test("başkasının, süresi dolmuş, bozuk veya değiştirilmiş seçim yazamaz", async () => {
      for (const value of [signCatalogSelection(book, "other"), signCatalogSelection(book, "reader", Date.now() - 31 * 60_000), `x${token}`, "fake", null, 123, {}, token + "x"]) await assert.rejects(service.mutate(slug, "reader", { ...payload, catalogSelection: value }), denied(409));
      await assert.rejects(service.mutate(slug, "reader", { ...payload, reviewKind: "movie" }), denied(400));
      for (const reviewKind of ["music", "game", "boardgame", { toString: null }]) await assert.rejects(service.mutate(slug, "reader", { ...payload, reviewKind }), denied(400));
      assert.equal(await db.communityPost.count(), 0);
    });
    await t.test("iki kaynak yöntemi, sohbet ve uyumsuz imzalı metadata reddedilir", async () => {
      await assert.rejects(service.mutate(slug, "reader", { ...payload, reference: { id: "anything" } }), denied(400));
      await assert.rejects(service.mutate(slug, "reader", { ...payload, type: "discussion" }), denied(400));
      for (const altered of [{ ...book, provider: "tmdb" }, { ...book, externalId: "https://evil.test" }, { ...book, id: "other-id" }, { ...book, title: " " }, { ...book, title: null }]) await assert.rejects(service.mutate(slug, "reader", { ...payload, catalogSelection: signCatalogSelection(altered, "reader") }), denied(400));
      assert.equal(await db.communityPost.count(), 0);
    });
    await t.test("sunucu snapshot'ı kullanılır; metadata/URL/provider payload'ı güvenilmez", async () => {
      const signed = signCatalogSelection({ ...book, title: `  ${"K".repeat(200)}  `, sourceUrl: "javascript:untrusted" }, "reader");
      const { post } = await service.mutate(slug, "reader", { ...payload, catalogSelection: signed, subjectTitle: "Sahte eser", sourceUrl: "https://evil.test", referenceProvider: "tmdb", userId: "owner" }); posts.push(post.id);
      const row = await db.communityPost.findUniqueOrThrow({ where: { id: post.id } });
      assert.equal(row.subjectTitle, "K".repeat(160)); assert.equal(row.referenceProvider, "openlibrary"); assert.equal(row.sourceUrl, book.sourceUrl); assert.equal(row.authorId, "reader");
      assert.equal(await db.mediaLibraryEntry.count(), 0); assert.equal(await db.suggestion.count(), 0); assert.equal(await db.feedPost.count(), 0);
      const detail = (await service.post(slug, post.id, null, 1)).post;
      for (const field of ["catalogSelection", "selectionToken", "reference", "catalogId", "externalId", "creators", "readingStatus"]) assert.equal(Object.hasOwn(detail, field), false);
      assert.ok(!JSON.stringify(detail).includes(signed)); assert.equal((await service.detail(slug, null, 1)).posts[0].excerpt, "");
    });
    await t.test("üç mevcut sağlayıcı; yayın sırasında dış istek yok", async () => {
      const fetcher = globalThis.fetch; globalThis.fetch = () => { assert.fail("No provider calls while publishing"); };
      try {
        for (const item of [book, { ...book, id: "tvmaze:tv:82", kind: "tv", provider: "tvmaze", externalId: "82", title: "Dizi", sourceUrl: "https://www.tvmaze.com/shows/82" }, { ...book, id: "wikidata:movie:Q123", kind: "movie", provider: "wikidata", externalId: "Q123", title: "Film", sourceUrl: "https://www.wikidata.org/wiki/Q123" }]) {
          const { post } = await service.mutate(slug, "reader", { ...payload, reviewKind: item.kind, catalogSelection: signCatalogSelection(item, "reader") }); posts.push(post.id);
          const detail = (await service.post(slug, post.id, null, 1)).post; assert.equal(detail.subjectTitle, item.title); assert.equal(detail.sourceUrl, item.sourceUrl); assert.equal(detail.referenceProvider, item.provider);
        }
      } finally { globalThis.fetch = fetcher; }
    });
    await t.test("özellik kapalıyken yeni katalog yayını kapanır; manuel/eski snapshot korunur", async () => {
      process.env.MEDIA_CATALOG_ENABLED = "false";
      await assert.rejects(service.mutate(slug, "reader", payload), denied(503));
      assert.equal((await service.post(slug, posts[0], null, 1)).post.referenceProvider, "openlibrary");
      const manual = await service.mutate(slug, "reader", { ...payload, catalogSelection: undefined, subjectTitle: "Elle girilen kitap", sourceUrl: "", referenceProvider: "openlibrary" });
      assert.equal((await service.post(slug, manual.post.id, null, 1)).post.referenceProvider, null);
      process.env.MEDIA_CATALOG_ENABLED = "true";
    });
    await t.test("üyelik/ban/arşiv/aktif hesap sınırları katalogla aşılamaz", async () => {
      await assert.rejects(service.mutate(slug, "other", { ...payload, catalogSelection: signCatalogSelection(book, "other") }), denied(403));
      await service.mutate(slug, "owner", { action: "moderate-member", userId: "reader", operation: "ban" }); await assert.rejects(service.mutate(slug, "reader", payload), denied(403));
      await service.mutate(slug, "owner", { action: "moderate-member", userId: "reader", operation: "unban" });
      const source = await db.community.findUniqueOrThrow({ where: { slug } }); await db.community.update({ where: { id: source.id }, data: { status: "archived" } });
      await assert.rejects(service.mutate(slug, "reader", payload), denied(409)); await db.community.update({ where: { id: source.id }, data: { status: "active" } });
      await db.userList.update({ where: { id: "reader" }, data: { status: "deleted" } }); await assert.rejects(service.mutate(slug, "reader", payload), denied(401));
      await db.userList.update({ where: { id: "reader" }, data: { status: "active" } });
    });
    await t.test("inceleme düzenlemesi imzalı eseri ve kaynağı değiştiremez", async () => {
      const postId = posts[1], before = (await service.post(slug, postId, null, 1)).post;
      await service.mutate(slug, "reader", { action: "edit-review", postId, expectedRevision: before.revision, title: "Düzenlenen inceleme", body: "Yeni ve yeterince uzun inceleme metni.", rating: 9, spoiler: false, catalogSelection: signCatalogSelection({ ...book, title: "Başka eser" }, "reader"), referenceProvider: "tmdb" });
      const after = (await service.post(slug, postId, null, 1)).post; assert.equal(after.subjectTitle, before.subjectTitle); assert.equal(after.sourceUrl, before.sourceUrl); assert.equal(after.referenceProvider, before.referenceProvider);
      assert.equal(await db.mediaLibraryEntry.count(), 0);
      assert.throws(() => resolveCatalogReviewReference("reader", token, "movie"), denied(400));
    });
  } finally {
    await db.$disconnect(); await rm(directory, { recursive: true, force: true });
    if (previous.enabled === undefined) delete process.env.MEDIA_CATALOG_ENABLED; else process.env.MEDIA_CATALOG_ENABLED = previous.enabled;
    if (previous.secret === undefined) delete process.env.SESSION_SECRET; else process.env.SESSION_SECRET = previous.secret;
  }
});
