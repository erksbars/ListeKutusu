import assert from "node:assert/strict";
import test from "node:test";
import { buildDiscoverData } from "../lib/discover.ts";

const now = new Date("2026-07-14T12:00:00.000Z");

function post(overrides) {
  return {
    id: "post",
    trackId: "track",
    trackName: "Track",
    artistName: "Artist",
    externalUrl: null,
    tags: [],
    createdAt: new Date("2026-07-14T10:00:00.000Z"),
    likeCount: 0,
    addCount: 0,
    author: {
      id: "author",
      ownerName: "Curator",
      slug: "curator",
      profileTheme: "aurora",
    },
    ...overrides,
  };
}

test("keşfet aynı şarkının en güçlü paylaşımını gösterir", () => {
  const result = buildDiscoverData(
    [
      post({ id: "weak", trackId: "same", likeCount: 1 }),
      post({ id: "strong", trackId: "same", addCount: 2 }),
    ],
    now
  );
  assert.equal(result.tracks.length, 1);
  assert.equal(result.tracks[0].id, "strong");
});

test("etiketler etkileşim ve paylaşım sayısıyla sıralanır", () => {
  const result = buildDiscoverData(
    [
      post({ id: "rock", trackId: "1", tags: ["Rock"], addCount: 2 }),
      post({ id: "pop-1", trackId: "2", tags: ["pop"] }),
      post({ id: "pop-2", trackId: "3", tags: ["pop"] }),
    ],
    now
  );
  assert.equal(result.tags[0].tag, "rock");
  assert.equal(result.tags[0].engagement, 6);
});

test("aktif küratörler sosyal etkiye göre sıralanır", () => {
  const result = buildDiscoverData(
    [
      post({ id: "a", trackId: "a", author: { id: "a", ownerName: "A", slug: "a", profileTheme: "aurora" }, likeCount: 1 }),
      post({ id: "b", trackId: "b", author: { id: "b", ownerName: "B", slug: "b", profileTheme: "emerald" }, addCount: 1 }),
    ],
    now
  );
  assert.equal(result.curators[0].id, "b");
  assert.equal(result.totals.curators, 2);
});
