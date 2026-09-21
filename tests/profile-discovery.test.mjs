import assert from "node:assert/strict";
import test from "node:test";
import {
  compareProfileSuggestions,
  describeProfileSuggestion,
  findSharedProfileGenres,
} from "../lib/profileDiscovery.ts";

test("ortak türleri büyük küçük harf ve tekrar farkından bağımsız bulur", () => {
  assert.deepEqual(
    findSharedProfileGenres(["Rock", "Caz"], ["rock", "Elektronik", "ROCK", "Caz"]),
    ["rock", "Caz"]
  );
});

test("öneri nedeninde önce ortak müzik zevkini açıklar", () => {
  assert.equal(
    describeProfileSuggestion({ sharedGenres: ["Rock", "Blues"], posts: 12, followers: 8 }),
    "Rock · Blues ortak zevkiniz"
  );
});

test("ortak tür yoksa etkinlik sinyalini kullanır", () => {
  assert.equal(describeProfileSuggestion({ sharedGenres: [], posts: 5, followers: 0 }), "Toplulukta aktif paylaşımcı");
  assert.equal(describeProfileSuggestion({ sharedGenres: [], posts: 0, followers: 1 }), "Toplulukta takip edilen profil");
  assert.equal(describeProfileSuggestion({ sharedGenres: [], posts: 0, followers: 0 }), "Yeni müziksever");
});

test("ortak zevki takipçi sayısından önce sıralar", () => {
  const commonTaste = { sharedGenres: ["Rock"], posts: 1, followers: 0 };
  const popular = { sharedGenres: [], posts: 20, followers: 50 };
  assert.ok(compareProfileSuggestions(commonTaste, popular) < 0);
});
