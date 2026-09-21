import assert from "node:assert/strict";
import test from "node:test";
import { normalizeProfileBanner, normalizeProfileDensity } from "../lib/profileAppearance.ts";

test("onaylı profil görünüm değerlerini korur", () => {
  assert.equal(normalizeProfileDensity("compact"), "compact");
  assert.equal(normalizeProfileBanner("band"), "band");
  assert.equal(normalizeProfileBanner("split"), "split");
});

test("bilinmeyen görünüm değerlerini güvenli varsayılana çevirir", () => {
  assert.equal(normalizeProfileDensity("tiny"), "comfortable");
  assert.equal(normalizeProfileBanner(null), "line");
});
