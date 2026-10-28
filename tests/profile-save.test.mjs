import test from "node:test";
import assert from "node:assert/strict";
import { parseSavedProfile } from "../lib/profileSave.ts";

const saved = { id: "owner", bio: null, profileStatus: "Sunucunun kabul ettiği durum", universityName: null, universityPublic: false, pinnedFeedPostId: null, featuredAchievementId: null, favoriteGenres: '["Rock"]', profileShowcase: '["featured","identity"]', profileTheme: "aurora", profileDensity: "comfortable", profileBanner: "line" };
test("only the same account's complete profile confirmation becomes the baseline", () => {
  assert.deepEqual(parseSavedProfile(saved, "owner"), saved);
  for (const value of [null, {}, [], { ...saved, id: "other" }, { ...saved, profileStatus: undefined }, { ...saved, universityPublic: "false" }]) assert.equal(parseSavedProfile(value, "owner"), null);
});
test("invalid serialized collections and appearance fields cannot confirm a save", () => {
  for (const change of [{ favoriteGenres: "{" }, { favoriteGenres: '{}' }, { favoriteGenres: '[1]' }, { favoriteGenres: JSON.stringify(Array(7).fill("Rock")) }, { profileShowcase: '[]' }, { profileShowcase: '["identity","identity"]' }, { profileShowcase: '["unknown"]' }, { profileTheme: "unknown" }, { profileDensity: "unknown" }, { profileBanner: "unknown" }]) assert.equal(parseSavedProfile({ ...saved, ...change }, "owner"), null);
});
test("unrelated account fields are never merged from a profile confirmation", () => {
  assert.deepEqual(parseSavedProfile({ ...saved, role: "admin", suggestions: [{}], ownerName: "Başka ad" }, "owner"), saved);
});
test("nullable cleared fields and empty genres remain a confirmed clean baseline", () => {
  const cleared = { ...saved, profileStatus: null, favoriteGenres: null };
  assert.deepEqual(parseSavedProfile(cleared, "owner"), cleared);
});
