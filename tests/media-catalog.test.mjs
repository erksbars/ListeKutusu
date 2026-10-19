import assert from "node:assert/strict";
import test from "node:test";
import { CatalogError, normalizeCatalogResults, parseCatalogQuery, searchMediaCatalog } from "../lib/mediaCatalog.ts";

test("katalog türü ve sorgusu doğrulanır", () => {
  assert.deepEqual(parseCatalogQuery("book", "  Suç   ve Ceza "), { kind: "book", query: "Suç ve Ceza" });
  for (const [kind, query] of [["music", "ab"], ["book", "a"], ["tv", "x".repeat(121)], ["movie", null]]) {
    assert.throws(() => parseCatalogQuery(kind, query), { code: "invalid_query" });
  }
});

test("dizi kimliği sağlayıcıya bağlıdır, bozuk sonuçlar atılır", () => {
  const results = normalizeCatalogResults("tv", [{ show: { id: 7, name: "Dizi" } }, { show: { id: "bad", name: "Bozuk" } }]);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, "tvmaze:tv:7");
  assert.equal(results[0].year, null);
});

test("kitaplar eser düzeyinde eşlenir; güvensiz bağlantı ve hatalı metadata alınmaz", () => {
  const results = normalizeCatalogResults("book", { docs: [
    { key: "/works/OL123W", title: " Kitap ", author_name: ["Yazar", null, 2], first_publish_year: 1999 },
    { key: "https://evil.test", title: "Yanlış" }, { key: "/books/OL123M", title: "Baskı" },
  ] });
  assert.deepEqual(results[0], { id: "openlibrary:book:OL123W", kind: "book", provider: "openlibrary", externalId: "OL123W", title: "Kitap", creators: ["Yazar"], year: 1999, sourceUrl: "https://openlibrary.org/works/OL123W" });
  assert.equal(results.length, 1);
});

test("boş sonuç geçerlidir, bozuk sağlayıcı yanıtı hata olur, sonuç sayısı sınırlıdır", () => {
  assert.deepEqual(normalizeCatalogResults("book", { docs: [] }), []);
  assert.throws(() => normalizeCatalogResults("tv", {}), CatalogError);
  assert.equal(normalizeCatalogResults("tv", Array.from({ length: 50 }, (_, i) => ({ show: { id: i + 1, name: "Dizi" } }))).length, 20);
});

test("yapılandırma yokken dış istek yapılmaz", async () => {
  const fetcher = () => { assert.fail("network should not run"); };
  await assert.rejects(searchMediaCatalog("book", "Kitap", { fetcher }), { code: "not_configured" });
});

const claim = value => ({ mainsnak: { datavalue: { value } } });
const entity = (label, type, extra = {}) => ({ labels: { en: { value: label } }, claims: { P31: [claim({ id: type })], ...extra } });
test("Wikidata iki dilde arar; film alt türünü kabul edip kitap/kişi ve döngüyü eler", async () => {
  let calls = 0;
  let signal;
  const results = await searchMediaCatalog("movie", "Bir & İki", { fetcher: async (url, init) => {
    calls++;
    assert.equal(url.origin, "https://www.wikidata.org");
    assert.equal(init.headers.Authorization, undefined);
    assert.equal(init.redirect, "error");
    if (signal) assert.equal(init.signal, signal); else signal = init.signal;
    if (url.searchParams.get("action") === "wbsearchentities") {
      assert.equal(url.searchParams.get("search"), "Bir & İki");
      assert.ok(["tr", "en"].includes(url.searchParams.get("language")));
      return Response.json({ search: [{ id: "Q1" }, { id: "Q2" }, { id: "Q3" }, { id: "https://evil.test" }] });
    }
    if (url.searchParams.get("ids") === "Q1|Q2|Q3") return Response.json({ entities: {
      Q1: { ...entity("Movie", "Q10", { P577: [claim({ time: "+2024-00-00T00:00:00Z", precision: 9 }), claim({ time: "+2023-02-01T00:00:00Z", precision: 11 })] }), labels: { tr: { value: "Film" } } },
      Q2: entity("Person", "Q5"), Q3: entity("Book", "Q20")
    } });
    return Response.json({ entities: { Q10: { claims: { P279: [claim({ id: "Q11424" })] } }, Q5: {}, Q20: { claims: { P279: [claim({ id: "Q20" })] } } } });
  } });
  assert.equal(calls, 4);
  assert.deepEqual(results, [{ id: "wikidata:movie:Q1", kind: "movie", provider: "wikidata", externalId: "Q1", title: "Film", creators: [], year: 2023, sourceUrl: "https://www.wikidata.org/wiki/Q1" }]);
});

test("Wikidata boş/bozuk yanıtları ve HTTP 200 API hatalarını ayırır", async () => {
  assert.deepEqual(await searchMediaCatalog("movie", "Film", { fetcher: async () => Response.json({ search: [] }) }), []);
  for (const [body, code] of [[{}, "unavailable"], [{ error: { code: "maxlag" } }, "rate_limited"], [{ error: { code: "badvalue" } }, "unavailable"]]) {
    await assert.rejects(searchMediaCatalog("movie", "Film", { fetcher: async () => Response.json(body) }), { code });
  }
});

test("Open Library sınırlı alanlarla ve kimlik belirten başlıkla aranır", async () => {
  await searchMediaCatalog("book", "Kitap", { openLibraryContact: "operator@example.org", fetcher: async (url, init) => {
    assert.equal(url.hostname, "openlibrary.org");
    assert.equal(url.searchParams.get("limit"), "20");
    assert.equal(init.headers["User-Agent"], "ListeKutusu/0.1 (operator@example.org)");
    assert.equal(init.headers.Authorization, undefined);
    return Response.json({ docs: [] });
  } });
});

test("TVmaze anahtarsız arar; yalnız güvenli kaynak ve temel metadata döner", async () => {
  const results = await searchMediaCatalog("tv", "Breaking Bad", { fetcher: async (url, init) => {
    assert.equal(url.origin, "https://api.tvmaze.com");
    assert.equal(url.pathname, "/search/shows");
    assert.equal(url.searchParams.get("q"), "Breaking Bad");
    assert.equal(init.headers.Authorization, undefined);
    return Response.json([{ show: { id: 169, name: "Breaking Bad", premiered: "2008-01-20", url: "https://evil.test", summary: "HTML", image: {} } }, { show: { id: 169, name: "Breaking Bad", premiered: "2008-01-20" } }, { show: { id: -1, name: "Bad" } }]);
  } });
  assert.equal(results.length, 1);
  assert.equal(results[0].id, "tvmaze:tv:169");
  assert.equal(results[0].sourceUrl, "https://www.tvmaze.com/shows/169");
  assert.equal(results[0].year, 2008);
  assert.equal(results[0].summary, undefined);
  assert.throws(() => normalizeCatalogResults("tv", {}), { code: "unavailable" });
  assert.deepEqual(normalizeCatalogResults("tv", []), []);
});

test("sağlayıcı hataları ve ağ/zaman aşımı güvenli hatalara dönüşür", async () => {
  for (const [status, code] of [[429, "rate_limited"], [401, "unavailable"], [500, "unavailable"]]) {
    await assert.rejects(searchMediaCatalog("movie", "Film", { fetcher: async () => new Response("private", { status }) }), { code });
  }
  for (const fetcher of [async () => { throw new Error("secret"); }, async () => { throw new DOMException("timeout", "TimeoutError"); }, async () => new Response("not json")]) {
    await assert.rejects(searchMediaCatalog("movie", "Film", { fetcher }), { code: "unavailable", message: "unavailable" });
  }
});
