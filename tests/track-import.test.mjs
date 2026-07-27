import assert from "node:assert/strict";
import test from "node:test";
import { parseSpotifyTrackReferences } from "../lib/track-import.ts";

test("Spotify track links and URIs are parsed and deduplicated", () => {
  const parsed = parseSpotifyTrackReferences(`
https://open.spotify.com/track/1Y7VG310Lf5IYP7sVOob4X
spotify:track:1GqlvSEtMx5xbGptxOTTyk
https://open.spotify.com/track/1Y7VG310Lf5IYP7sVOob4X?si=test
  `);

  assert.deepEqual(parsed.ids, [
    "1Y7VG310Lf5IYP7sVOob4X",
    "1GqlvSEtMx5xbGptxOTTyk",
  ]);
  assert.equal(parsed.totalReferences, 3);
  assert.equal(parsed.duplicateCount, 1);
  assert.equal(parsed.invalidLineCount, 0);
});

test("Raw IDs and localized Spotify links are accepted", () => {
  const parsed = parseSpotifyTrackReferences(`
1Y7VG310Lf5IYP7sVOob4X
https://open.spotify.com/intl-tr/track/1GqlvSEtMx5xbGptxOTTyk
not-a-track
  `);

  assert.equal(parsed.ids.length, 2);
  assert.equal(parsed.invalidLineCount, 1);
});

test("Import parsing reports values above the configured limit", () => {
  const parsed = parseSpotifyTrackReferences(
    `https://open.spotify.com/track/1Y7VG310Lf5IYP7sVOob4X\nhttps://open.spotify.com/track/1GqlvSEtMx5xbGptxOTTyk`,
    1
  );

  assert.equal(parsed.ids.length, 1);
  assert.equal(parsed.truncatedCount, 1);
});
