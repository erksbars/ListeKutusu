import assert from "node:assert/strict";
import test from "node:test";
import {
  hashPassword,
  isValidEmail,
  normalizeEmail,
  passwordValidationError,
  verifyPassword,
} from "../lib/password.ts";

test("parola hash'i dogru parolayi kabul eder", async () => {
  const hash = await hashPassword("GuvenliParola123!");
  assert.match(hash, /^pbkdf2:\d+:[a-f0-9]+:[a-f0-9]+$/);
  assert.equal(await verifyPassword("GuvenliParola123!", hash), true);
  assert.equal(await verifyPassword("YanlisParola123!", hash), false);
});

test("ayni parola farkli salt ile hashlenir", async () => {
  const first = await hashPassword("AyniParola123!");
  const second = await hashPassword("AyniParola123!");
  assert.notEqual(first, second);
});

test("bozuk hash reddedilir", async () => {
  assert.equal(await verifyPassword("parola", "gecersiz-hash"), false);
  assert.equal(await verifyPassword("parola", "pbkdf2:x:salt:hash"), false);
});

test("parola ve e-posta validasyonu", () => {
  assert.match(passwordValidationError("kisa") || "", /8/);
  assert.equal(passwordValidationError("yeterince-uzun"), null);
  assert.equal(normalizeEmail("  TEST@Example.COM "), "test@example.com");
  assert.equal(isValidEmail("test@example.com"), true);
  assert.equal(isValidEmail("gecersiz"), false);
});
