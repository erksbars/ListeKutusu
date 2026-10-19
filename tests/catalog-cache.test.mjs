import test from "node:test";
import assert from "node:assert/strict";
import { createCatalogCache } from "../lib/catalogCache.ts";
import { CatalogError } from "../lib/mediaCatalog.ts";

test("aynı sorgu birleşir, farklı sorgu sağlayıcıyı paralel yüklemez, sonuç kopyalanır", async () => {
  const cache = createCatalogCache(() => 1000);
  let resolve;
  let calls = 0;
  const load = () => { calls++; return new Promise(done => { resolve = done; }); };
  const a = cache("movie", "Film", load);
  const b = cache("movie", "Film", load);
  await assert.rejects(cache("movie", "Başka", load), { code: "rate_limited" });
  resolve([{ title: "Film" }]);
  const first = await a;
  first[0].title = "changed";
  assert.equal((await b)[0].title, "Film");
  assert.equal((await cache("movie", "Film", load))[0].title, "Film");
  assert.equal(calls, 1);
});

test("hata önbelleğe alınmaz; sağlayıcı yoğunluğu 60 saniye bekletir", async () => {
  let now = 0;
  const cache = createCatalogCache(() => now);
  await assert.rejects(cache("movie", "Film", async () => { throw new CatalogError("rate_limited"); }));
  now = 59_999;
  await assert.rejects(cache("movie", "Film", async () => []), { code: "rate_limited" });
  now = 60_000;
  assert.deepEqual(await cache("movie", "Film", async () => []), []);
  now += 300_000;
  assert.deepEqual(await cache("movie", "Film", async () => [{ title: "Yeni" }]), [{ title: "Yeni" }]);
});

test("önbellek 100 sorguyla sınırlıdır ve türler birbirini engellemez", async () => {
  let now = 0;
  const cache = createCatalogCache(() => now);
  for (let i = 0; i <= 100; i++) {
    now += 1000;
    await cache("movie", String(i), async () => []);
  }
  await cache("book", "Kitap", async () => []);
  now += 1000;
  assert.deepEqual(await cache("movie", "0", async () => [{ title: "Reloaded" }]), [{ title: "Reloaded" }]);
});
