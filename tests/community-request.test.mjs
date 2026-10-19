import assert from "node:assert/strict";
import test from "node:test";
import { communityFetch, communityError, communityRequestStatus } from "../lib/communityRequest.ts";

test("HTTP status survives JSON and non-JSON errors without leaking response markup", async t => {
  for (const status of [401, 403, 404, 500, 503]) {
    for (const json of [true, false]) {
      const mock = t.mock.method(globalThis, "fetch", async () => new Response(json ? JSON.stringify({ error: "Kontrollü hata" }) : "<html>private proxy body</html>", { status }));
      await assert.rejects(communityFetch("/example"), error => {
        assert.equal(communityRequestStatus(error), status);
        assert.equal(communityError(error), json ? "Kontrollü hata" : "İşlem tamamlanamadı.");
        return true;
      });
      mock.mock.restore();
    }
  }
});

test("network failures do not become login failures and invalid success is not empty data", async t => {
  const mock = t.mock.method(globalThis, "fetch", async () => { throw new TypeError("private transport detail"); });
  await assert.rejects(communityFetch("/example"), error => {
    assert.equal(communityRequestStatus(error), null);
    assert.equal(communityError(error), "İşlem tamamlanamadı. Bağlantını kontrol edip tekrar dene."); return true;
  });
  mock.mock.restore();
  t.mock.method(globalThis, "fetch", async () => new Response("not JSON", { status: 200 }));
  await assert.rejects(communityFetch("/example"), /geçerli yanıt/);
});

test("successful requests preserve no-store, abort signal and explicit mutation method", async t => {
  const controller = new AbortController(); let received;
  t.mock.method(globalThis, "fetch", async (url, init) => { received = { url, init }; return new Response('{"ok":true}', { status: 200 }); });
  assert.deepEqual(await communityFetch("/example", { action: "test" }, controller.signal, "PATCH"), { ok: true });
  assert.equal(received.init.method, "PATCH"); assert.equal(received.init.cache, "no-store"); assert.equal(received.init.signal, controller.signal);
  assert.deepEqual(JSON.parse(received.init.body), { action: "test" });
});
