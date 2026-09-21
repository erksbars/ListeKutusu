import assert from "node:assert/strict";
import test from "node:test";
import { normalizeProfileBanner, normalizeProfileDensity, getProfilePreset, PROFILE_PRESETS } from "../lib/profileAppearance.ts";

test("önizleme ve profil aynı preset'i kullanır; bilinmeyen anahtar varsayılana döner", () => {
  assert.equal(getProfilePreset("violet"), PROFILE_PRESETS.violet);
  assert.equal(getProfilePreset("unknown"), PROFILE_PRESETS.aurora);
  assert.equal(getProfilePreset("__proto__"), PROFILE_PRESETS.aurora);
});

test("onaylı profil görünüm değerlerini korur", () => {
  assert.equal(normalizeProfileDensity("compact"), "compact");
  assert.equal(normalizeProfileBanner("band"), "band");
  assert.equal(normalizeProfileBanner("split"), "split");
});

test("bilinmeyen görünüm değerlerini güvenli varsayılana çevirir", () => {
  assert.equal(normalizeProfileDensity("tiny"), "comfortable");
  assert.equal(normalizeProfileBanner(null), "line");
});
