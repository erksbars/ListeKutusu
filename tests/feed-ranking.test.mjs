import assert from "node:assert/strict";
import test from "node:test";
import { rankPersonalizedFeed } from "../lib/feedRanking.ts";

const now = new Date("2026-07-14T12:00:00.000Z");

function post(overrides) {
  return {
    id: "post",
    authorId: "author",
    artistName: "Artist",
    tags: [],
    createdAt: new Date("2026-07-14T10:00:00.000Z"),
    likeCount: 0,
    addCount: 0,
    ...overrides,
  };
}

const emptySignals = {
  favoriteGenres: [],
  likedTags: [],
  addedTags: [],
  likedArtists: [],
  addedArtists: [],
  followingIds: [],
};

test("favori türe uyan paylaşım kişisel akışta öne çıkar", () => {
  const ranked = rankPersonalizedFeed(
    [post({ id: "pop", tags: ["pop"] }), post({ id: "rock", tags: ["classic rock"] })],
    { ...emptySignals, favoriteGenres: ["rock"] },
    now
  );
  assert.equal(ranked[0].post.id, "rock");
  assert.match(ranked[0].reason, /rock/);
});

test("daha önce listeye eklenen sanatçı güçlü sinyal üretir", () => {
  const ranked = rankPersonalizedFeed(
    [post({ id: "known", artistName: "Scorpions" }), post({ id: "popular", likeCount: 3 })],
    { ...emptySignals, addedArtists: ["Scorpions"] },
    now
  );
  assert.equal(ranked[0].post.id, "known");
  assert.equal(ranked[0].reason, "Daha önce eklediğin sanatçı");
});

test("zaten listede olan paylaşım aşağı taşınır", () => {
  const ranked = rankPersonalizedFeed(
    [post({ id: "added", addCount: 2, addedByMe: true }), post({ id: "fresh" })],
    emptySignals,
    now
  );
  assert.equal(ranked[0].post.id, "fresh");
});

test("aynı paylaşımcı ve sanatçı akışı art arda kaplamaz", () => {
  const ranked = rankPersonalizedFeed(
    [
      post({ id: "same-1", authorId: "same", artistName: "Same Artist", likeCount: 8 }),
      post({ id: "same-2", authorId: "same", artistName: "Same Artist", likeCount: 7 }),
      post({ id: "different", authorId: "different", artistName: "New Artist", likeCount: 5 }),
    ],
    emptySignals,
    now
  );

  assert.deepEqual(ranked.slice(0, 2).map((item) => item.post.id), ["same-1", "different"]);
});
