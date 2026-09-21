import assert from "node:assert/strict";
import test from "node:test";
import {
  clearAccountSessionCache,
  loadAccountSession,
} from "../lib/clientAccountSession.ts";

test("account summary requests are shared and cached", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return new Response(JSON.stringify({
      list: { id: "user-1", slug: "listener", ownerName: "Listener" },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  try {
    clearAccountSessionCache();
    const [first, second] = await Promise.all([
      loadAccountSession(),
      loadAccountSession(),
    ]);
    const cached = await loadAccountSession();

    assert.equal(calls, 1);
    assert.equal(first?.slug, "listener");
    assert.equal(second, first);
    assert.equal(cached, first);
  } finally {
    clearAccountSessionCache();
    globalThis.fetch = originalFetch;
  }
});

test("anonymous account state is cached without throwing", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(JSON.stringify({ error: "Yetkisiz." }), { status: 401 });
  };

  try {
    clearAccountSessionCache();
    assert.equal(await loadAccountSession(), null);
    assert.equal(await loadAccountSession(), null);
    assert.equal(calls, 1);
  } finally {
    clearAccountSessionCache();
    globalThis.fetch = originalFetch;
  }
});
