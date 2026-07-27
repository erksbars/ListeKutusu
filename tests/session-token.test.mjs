import assert from "node:assert/strict";
import test from "node:test";
import {
  createAccountSessionToken,
  hashAccountSessionToken,
  isAccountSessionToken,
} from "../lib/sessionToken.ts";

test("hesap oturum tokeni kriptografik biçimde ve benzersiz üretilir", () => {
  const first = createAccountSessionToken();
  const second = createAccountSessionToken();

  assert.match(first, /^[a-f0-9]{64}$/);
  assert.match(second, /^[a-f0-9]{64}$/);
  assert.notEqual(first, second);
});

test("oturum tokeni özeti deterministiktir ve sırra bağlıdır", () => {
  const token = "a".repeat(64);
  const first = hashAccountSessionToken(token, "first-secret");
  const repeated = hashAccountSessionToken(token, "first-secret");
  const differentSecret = hashAccountSessionToken(token, "second-secret");

  assert.equal(first, repeated);
  assert.notEqual(first, differentSecret);
  assert.match(first, /^[a-f0-9]{64}$/);
});

test("yalnızca 64 karakterlik küçük harfli hexadecimal token kabul edilir", () => {
  assert.equal(isAccountSessionToken("0".repeat(64)), true);
  assert.equal(isAccountSessionToken("A".repeat(64)), false);
  assert.equal(isAccountSessionToken("g".repeat(64)), false);
  assert.equal(isAccountSessionToken("0".repeat(63)), false);
  assert.equal(isAccountSessionToken("0".repeat(65)), false);
});
