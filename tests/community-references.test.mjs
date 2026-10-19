import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { listReviewReferences } from "../lib/communityReferences.ts";
import { CommunityError, createCommunities } from "../lib/communities.ts";

const rejected = status => error => error instanceof CommunityError && error.status === status;
test("inceleme kitaplık seçimi sahiplik, metadata ve özel veri sınırı", async t => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-review-references-"));
  const db = new PrismaClient({ datasources: { db: { url: `file:${path.join(directory, "test.db").replaceAll("\\", "/")}` } } });
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) {
      const sql = await readFile(new URL(`${folder}/migration.sql`, root), "utf8");
      for (const statement of sql.split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(statement);
    }
    for (const id of ["alice", "bob"]) await db.userList.create({ data: { id, slug: id, ownerName: id } });
    const book = await db.mediaLibraryEntry.create({ data: { userId: "alice", kind: "book", provider: "openlibrary", externalId: "OL1W", catalogId: "openlibrary:book:OL1W", title: "Kitap başlığı", creators: '["Yazar"]', status: "reading", sourceUrl: "https://malicious.test/not-used" } });
    const movie = await db.mediaLibraryEntry.create({ data: { userId: "alice", kind: "movie", provider: "wikidata", externalId: "Q123", catalogId: "wikidata:movie:Q123", title: "Film başlığı", status: "watched", sourceUrl: "https://www.wikidata.org/wiki/Q123" } });
    const tv = await db.mediaLibraryEntry.create({ data: { userId: "alice", kind: "tv", provider: "tvmaze", externalId: "82", catalogId: "tvmaze:tv:82", title: "Dizi başlığı", status: "watching", sourceUrl: "https://www.tvmaze.com/shows/82" } });
    const legacy = await db.mediaLibraryEntry.create({ data: { userId: "alice", kind: "movie", provider: "tmdb", externalId: "10", catalogId: "tmdb:movie:10", title: "Eski film kaydı", status: "watched", sourceUrl: "https://www.themoviedb.org/movie/10" } });
    const track = await db.suggestion.create({ data: { listId: "alice", trackId: "67Hna13dNDkZvBpTXRIaOJ", trackUri: "spotify:track:67Hna13dNDkZvBpTXRIaOJ", trackName: "Onaylı parça", artistName: "Sanatçı", durationMs: 1000, status: "approved" } });
    const pending = await db.suggestion.create({ data: { listId: "alice", trackId: "2sW8fmnISifQTRgnRrQTYW", trackUri: "spotify:track:2sW8fmnISifQTRgnRrQTYW", trackName: "Bekleyen parça", artistName: "Sanatçı", durationMs: 1000 } });
    const service = createCommunities(db);
    const { slug } = await service.create("alice", { name: "Kitap Kulübü", category: "interest", description: "Kitap incelemeleri için topluluk", rules: "Spoiler işaretle ve saygılı ol." });
    await service.mutate(slug, "bob", { action: "join" });
    const payload = { action: "create-post", type: "review", reviewKind: "book", title: "Kitap incelemem", body: "Bu kitap hakkında ayrıntılı bir inceleme yazıyorum.", rating: 8, reference: { id: book.id }, subjectTitle: "Sahte başlık", sourceUrl: "javascript:bad", referenceProvider: "spoof" };
    let postId;
    await t.test("seçim listesi özel ve sınırlıdır; durum ve kitaplık sahibi sızmaz", async () => {
      await assert.rejects(listReviewReferences(db, null, "book", ""), rejected(401));
      assert.deepEqual((await listReviewReferences(db, "bob", "book", "")).references, []);
      const list = await listReviewReferences(db, "alice", "book", "başlığı");
      assert.equal(list.references.length, 1);
      assert.deepEqual(Object.keys(list.references[0]).sort(), ["id", "provider", "reviewKind", "sourceUrl", "title"]);
      assert.equal(list.references[0].sourceUrl, "https://openlibrary.org/works/OL1W");
      assert.equal((await listReviewReferences(db, "alice", "music", "")).references[0].id, track.id);
      await assert.rejects(listReviewReferences(db, "alice", "game", ""), rejected(400));
      await assert.rejects(listReviewReferences(db, "alice", "book", "x".repeat(101)), rejected(400));
    });
    await t.test("başkasının kaydı, yanlış tür ve onaysız müzik reddedilir", async () => {
      await assert.rejects(service.mutate(slug, "bob", payload), rejected(404));
      await assert.rejects(service.mutate(slug, "alice", { ...payload, reviewKind: "movie" }), rejected(404));
      await assert.rejects(service.mutate(slug, "alice", { ...payload, reviewKind: "music", reference: { id: pending.id } }), rejected(404));
      await assert.rejects(service.mutate(slug, "alice", { ...payload, reference: null }), rejected(400));
      postId = (await service.mutate(slug, "alice", payload)).post.id;
      const linkedMovie = (await service.mutate(slug, "alice", { ...payload, reviewKind: "movie", reference: { id: movie.id } })).post.id;
      assert.equal((await service.post(slug, linkedMovie, null, 1)).post.subjectTitle, movie.title);
      for (const sample of [tv, legacy]) {
        const created = (await service.mutate(slug, "alice", { ...payload, reviewKind: sample.kind, reference: { id: sample.id } })).post.id;
        assert.equal((await service.post(slug, created, null, 1)).post.sourceUrl, sample.sourceUrl);
      }
      const linkedMusic = (await service.mutate(slug, "alice", { ...payload, reviewKind: "music", reference: { id: track.id } })).post.id;
      assert.equal((await service.post(slug, linkedMusic, null, 1)).post.referenceProvider, "spotify");
    });
    await t.test("snapshot sunucudan gelir; kaynak silinse de yayın korunur", async () => {
      const published = (await service.post(slug, postId, null, 1)).post;
      assert.equal(published.subjectTitle, book.title); assert.equal(published.referenceProvider, "openlibrary");
      assert.equal(published.sourceUrl, "https://openlibrary.org/works/OL1W");
      for (const field of ["reference", "libraryEntryId", "userId", "readingStatus", "catalogId"]) assert.equal(Object.hasOwn(published, field), false);
      const before = await db.mediaLibraryEntry.findUnique({ where: { id: book.id } });
      assert.deepEqual(before, book);
      await db.mediaLibraryEntry.delete({ where: { id: book.id } });
      await assert.rejects(service.mutate(slug, "alice", payload), rejected(404));
      assert.equal((await service.post(slug, postId, null, 1)).post.subjectTitle, book.title);
      const manual = (await service.mutate(slug, "alice", { ...payload, reference: undefined, subjectTitle: "Elle girilen", sourceUrl: "", referenceProvider: "openlibrary" })).post.id;
      assert.equal((await service.post(slug, manual, null, 1)).post.referenceProvider, null);
    });
  } finally {
    await db.$disconnect();
    await rm(directory, { recursive: true, force: true });
  }
});
