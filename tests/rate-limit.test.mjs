import assert from "node:assert/strict";
import test from "node:test";
import { checkRateLimit } from "../lib/rateLimit.ts";

function request(ip = "127.0.0.1") {
  return { headers: new Headers({ "x-forwarded-for": ip }) };
}

test("limit dolana kadar isteklere izin verir", () => {
  const name = `unit-limit-${Date.now()}`;
  const options = { name, limit: 2, windowMs: 60_000 };
  assert.equal(checkRateLimit(request(), options).ok, true);
  assert.equal(checkRateLimit(request(), options).ok, true);
  const blocked = checkRateLimit(request(), options);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfter > 0);
});

test("farkli kimlik ve IP bucket'lari birbirinden ayrilir", () => {
  const name = `unit-isolation-${Date.now()}`;
  const base = { name, limit: 1, windowMs: 60_000 };
  assert.equal(checkRateLimit(request("10.0.0.1"), { ...base, identifier: "a" }).ok, true);
  assert.equal(checkRateLimit(request("10.0.0.1"), { ...base, identifier: "b" }).ok, true);
  assert.equal(checkRateLimit(request("10.0.0.2"), { ...base, identifier: "a" }).ok, true);
  assert.equal(checkRateLimit(request("10.0.0.1"), { ...base, identifier: "a" }).ok, false);
});
