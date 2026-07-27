import assert from "node:assert/strict";
import test from "node:test";
import { selectRandomTracks } from "../lib/discovery.ts";

function track(id) {
  return {
    id,
    uri: `spotify:track:${id}`,
    name: `Track ${id}`,
    artist: "Artist",
    album: "Album",
    imageUrl: null,
    externalUrl: null,
    durationMs: 180_000,
  };
}

test("beşli keşif benzersiz şarkılar döndürür", () => {
  const result = selectRandomTracks(
    [track("1"), track("2"), track("2"), track("3"), track("4"), track("5"), track("6")],
    5
  );
  assert.equal(result.length, 5);
  assert.equal(new Set(result.map((item) => item.id)).size, 5);
});

test("beşli keşif görülen şarkıları mümkün olduğunda dışarıda bırakır", () => {
  const result = selectRandomTracks(
    [track("1"), track("2"), track("3"), track("4"), track("5"), track("6")],
    5,
    ["1"]
  );
  assert.equal(result.length, 5);
  assert.equal(result.some((item) => item.id === "1"), false);
});
