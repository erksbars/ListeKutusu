import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createMediaLibrary, parseMediaStatus } from "../lib/mediaLibrary.ts";
import { createLibraryHandler } from "../lib/mediaLibraryApi.ts";
import { signCatalogSelection, verifyCatalogSelection } from "../lib/catalogSelection.ts";
import { getMediaShowcase } from "../lib/mediaShowcase.ts";

const book = { id: "openlibrary:book:OL1W", kind: "book", provider: "openlibrary", externalId: "OL1W", title: "Kitap", creators: ["Yazar"], year: 2020, sourceUrl: "https://openlibrary.org/works/OL1W" };

test("kitap durumları izleme durumlarından ayrılır", () => {
  assert.equal(parseMediaStatus("book", "reading"), "reading");
  assert.equal(parseMediaStatus("tv", "watched"), "watched");
  for (const [kind, status] of [["book", "watched"], ["movie", "read"], ["tv", "toString"]]) assert.throws(() => parseMediaStatus(kind, status));
});

test("kitaplık HTTP akışı ve SQLite sahiplik/tekillik kuralları", async (t) => {
  const previousSecret = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = "test-only-catalog-secret-32-characters-long";
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-library-test-"));
  const db = new PrismaClient({ datasources: { db: { url: `file:${path.join(directory, "test.db").replaceAll("\\", "/")}` } } });
  try {
    await db.$executeRawUnsafe('CREATE TABLE "UserList" ("id" TEXT PRIMARY KEY)');
    await db.$executeRawUnsafe('INSERT INTO "UserList" ("id") VALUES (\'alice\'), (\'bob\')');
    const migration = await readFile(new URL("../prisma/migrations/20260923120000_media_library/migration.sql", import.meta.url), "utf8");
    for (const statement of migration.split(";").map(x => x.trim()).filter(Boolean)) await db.$executeRawUnsafe(statement);
    const showcaseMigration = await readFile(new URL("../prisma/migrations/20260923220000_media_showcase/migration.sql", import.meta.url), "utf8");
    for (const statement of showcaseMigration.split(";").map(x => x.trim()).filter(Boolean)) await db.$executeRawUnsafe(statement);
    const library = createMediaLibrary(db);
    let currentUser = "alice";
    let enabled = true;
    let limited = false;
    const handler = createLibraryHandler({ library, authenticate: async () => currentUser,
      enabled: () => enabled, appUrl: () => "http://localhost:3000",
      rateLimit: () => ({ ok: !limited, retryAfter: 10 }) });
    const request = (method = "GET", body, options = {}) => handler(new Request(`http://localhost:3000/api/library${options.query ?? ""}`, {
      method, headers: { "Content-Type": "application/json", Origin: "http://localhost:3000", ...options.headers },
      ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
    }));
    let entryId;
    await t.test("seçim imzası kullanıcıya bağlı, süreli ve değiştirilemez", () => {
      const token = signCatalogSelection(book, "alice", 1000);
      assert.deepEqual(verifyCatalogSelection(token, "alice", 1001), book);
      assert.equal(verifyCatalogSelection(token, "bob", 1001), null);
      assert.equal(verifyCatalogSelection(token, "alice", 1_801_000), null);
      assert.equal(verifyCatalogSelection(`x${token}`, "alice", 1001), null);
      assert.equal(verifyCatalogSelection("broken", "alice"), null);
    });
    await t.test("kapalı özellik, oturumsuz, farklı kaynak ve limit engellenir", async () => {
      enabled = false; assert.equal((await request()).status, 503); enabled = true;
      currentUser = null; assert.equal((await request()).status, 401); currentUser = "alice";
      assert.equal((await request("POST", {}, { headers: { Origin: "https://evil.test" } })).status, 403);
      limited = true; const response = await request(); assert.equal(response.status, 429); assert.equal(response.headers.get("Retry-After"), "10"); limited = false;
    });
    await t.test("geçersiz JSON, büyük gövde, bozuk seçim ve yanlış durum reddedilir", async () => {
      assert.equal((await request("POST", "{")).status, 400);
      assert.equal((await request("POST", "x".repeat(20001))).status, 413);
      assert.equal((await request("POST", { selectionToken: "fake", status: "read" })).status, 400);
      assert.equal((await request("POST", { selectionToken: signCatalogSelection(book, "alice"), status: "watched" })).status, 400);
    });
    await t.test("ekleme imzalı veriyi kullanır, tekrarda durum sıfırlanmaz", async () => {
      const body = { selectionToken: signCatalogSelection(book, "alice"), status: "reading", userId: "bob", title: "Sahte" };
      const response = await request("POST", body); assert.equal(response.status, 200);
      const { entry } = await response.json(); entryId = entry.id;
      assert.equal(entry.title, "Kitap"); assert.equal(entry.userId, undefined);
      assert.equal((await request("POST", { ...body, status: "to_read" })).status, 200);
      assert.equal(await db.mediaLibraryEntry.count(), 1);
      assert.equal((await library.list("alice")).entries[0].status, "reading");
      assert.equal((await library.list("bob")).entries.length, 0);
    });
    await t.test("başkası kayıt okuyamaz, değiştiremez veya silemez", async () => {
      currentUser = "bob";
      assert.deepEqual((await (await request()).json()).entries, []);
      assert.equal((await request("PATCH", { id: entryId, status: "read" })).status, 404);
      assert.equal((await request("DELETE", { id: entryId })).status, 404);
      assert.equal((await request("GET", undefined, { query: `?after=${entryId}` })).status, 400);
      currentUser = "alice";
      assert.equal((await request("PATCH", { id: entryId, status: "read" })).status, 200);
      assert.equal((await library.list("alice")).entries[0].status, "read");
    });
    await t.test("vitrin açık tercih gerektirir, özel alanlar dışarı çıkmaz ve geri alınabilir", async () => {
      assert.deepEqual(await getMediaShowcase(db, "alice", true, false), []);
      assert.equal((await request("PATCH", { id: entryId, showcase: "true" })).status, 400);
      currentUser = "bob";
      assert.equal((await request("PATCH", { id: entryId, showcase: true })).status, 404);
      currentUser = "alice";
      assert.equal((await request("PATCH", { id: entryId, showcase: true, status: "read" })).status, 400);
      assert.equal((await request("PATCH", { id: entryId, showcase: true })).status, 200);
      const visible = await getMediaShowcase(db, "alice", true, false);
      assert.equal(visible.length, 1);
      assert.deepEqual(Object.keys(visible[0]).sort(), ["catalogId", "creators", "kind", "provider", "sourceUrl", "title", "year"]);
      assert.deepEqual(await getMediaShowcase(db, "alice", true, true), []);
      assert.deepEqual(await getMediaShowcase(db, "alice", false, false), []);
      assert.equal((await request("PATCH", { id: entryId, showcase: false })).status, 200);
      assert.deepEqual(await getMediaShowcase(db, "alice", true, false), []);
      assert.equal((await library.list("alice")).entries[0].status, "read");
    });
    await t.test("TVmaze migration eski kayıtları korur ve yeni sağlayıcıyı kabul eder", async () => {
      const before = await db.mediaLibraryEntry.findMany();
      const sql = await readFile(new URL("../prisma/migrations/20260924100000_tvmaze_provider/migration.sql", import.meta.url), "utf8");
      for (const statement of sql.split(";").map(x => x.trim()).filter(Boolean)) await db.$executeRawUnsafe(statement);
      assert.deepEqual(await db.mediaLibraryEntry.findMany(), before);
      const entry = await library.add("bob", { ...book, id: "tvmaze:tv:169", externalId: "169", kind: "tv", provider: "tvmaze", sourceUrl: "https://www.tvmaze.com/shows/169" }, "to_watch");
      assert.equal(entry.provider, "tvmaze");
      await library.remove("bob", entry.id);
    });
    await t.test("Wikidata migration eski film ve vitrin tercihini korur; imzalı yeni film kaydedilir", async () => {
      const legacy = await library.add("bob", { ...book, id: "tmdb:movie:7", kind: "movie", provider: "tmdb", externalId: "7", sourceUrl: "https://www.themoviedb.org/movie/7" }, "watched");
      await library.showcase("bob", legacy.id, true);
      const before = await db.mediaLibraryEntry.findMany({ orderBy: { id: "asc" } });
      const sql = await readFile(new URL("../prisma/migrations/20260925120000_wikidata_provider/migration.sql", import.meta.url), "utf8");
      for (const statement of sql.split(";").map(x => x.trim()).filter(Boolean)) await db.$executeRawUnsafe(statement);
      assert.deepEqual(await db.mediaLibraryEntry.findMany({ orderBy: { id: "asc" } }), before);
      const movie = { ...book, id: "wikidata:movie:Q1", kind: "movie", provider: "wikidata", externalId: "Q1", sourceUrl: "https://www.wikidata.org/wiki/Q1" };
      const response = await request("POST", { selectionToken: signCatalogSelection(movie, "alice"), status: "to_watch" });
      assert.equal(response.status, 200);
      const saved = (await library.list("alice", "movie")).entries[0];
      assert.equal(saved.provider, "wikidata");
      await library.showcase("alice", saved.id, true);
      assert.equal((await getMediaShowcase(db, "alice", true, false))[0].provider, "wikidata");
      await assert.rejects(db.mediaLibraryEntry.update({ where: { id: saved.id }, data: { kind: "tv" } }));
      await library.remove("alice", saved.id);
      await library.remove("bob", legacy.id);
    });
    await t.test("tür filtresi ve sayfalama kayıp/tekrar üretmez", async () => {
      for (let i = 2; i <= 32; i++) await library.add("alice", { ...book, id: `openlibrary:book:OL${i}W`, externalId: `OL${i}W` }, "to_read");
      const page1 = await library.list("alice", "book");
      const page2 = await library.list("alice", "book", page1.nextCursor);
      assert.equal(page1.entries.length, 30); assert.equal(page2.entries.length, 2);
      assert.equal(new Set([...page1.entries, ...page2.entries].map(e => e.id)).size, 32);
      assert.equal(page2.nextCursor, null);
      assert.equal((await library.list("alice", "movie")).entries.length, 0);
    });
    await t.test("sahip silebilir ve veritabanı geçersiz durumları da engeller", async () => {
      await assert.rejects(db.mediaLibraryEntry.updateMany({ where: { userId: "alice" }, data: { status: "watched" } }));
      assert.equal((await request("DELETE", { id: entryId })).status, 200);
      assert.equal((await request("DELETE", { id: entryId })).status, 404);
      assert.equal(await db.mediaLibraryEntry.count(), 31);
    });
  } finally {
    await db.$disconnect();
    if (previousSecret === undefined) delete process.env.SESSION_SECRET; else process.env.SESSION_SECRET = previousSecret;
    await rm(directory, { recursive: true, force: true });
  }
});
