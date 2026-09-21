import assert from "node:assert/strict";
import test from "node:test";
import {
  FEED_COMMENT_MAX_LENGTH,
  normalizeFeedComment,
} from "../lib/feedComments.ts";

test("yorum metnini kırpar ve satır sonlarını normalleştirir", () => {
  assert.deepEqual(normalizeFeedComment("  Güzel seçim\r\nKatılıyorum.  "), {
    ok: true,
    body: "Güzel seçim\nKatılıyorum.",
  });
});

test("çok kısa yorumu reddeder", () => {
  assert.equal(normalizeFeedComment("a").ok, false);
});

test("uzun yorum için sınırı uygular", () => {
  assert.equal(normalizeFeedComment("a".repeat(FEED_COMMENT_MAX_LENGTH + 1)).ok, false);
});
