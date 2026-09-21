import assert from "node:assert/strict";
import test from "node:test";
import { FEED_NOTE_MAX_LENGTH, normalizeFeedNote } from "../lib/feedContent.ts";

test("paylaşım açıklamasını kırpar ve boş değeri null yapar", () => {
  assert.deepEqual(normalizeFeedNote("  Gece yürüyüşü için.  "), {
    ok: true,
    note: "Gece yürüyüşü için.",
  });
  assert.deepEqual(normalizeFeedNote("   "), { ok: true, note: null });
});

test("paylaşım açıklaması karakter sınırını doğrular", () => {
  assert.equal(normalizeFeedNote("a".repeat(FEED_NOTE_MAX_LENGTH)).ok, true);
  const result = normalizeFeedNote("a".repeat(FEED_NOTE_MAX_LENGTH + 1));
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /en fazla 400 karakter/u);
});

test("paylaşım açıklaması yalnız metin kabul eder", () => {
  assert.equal(normalizeFeedNote({ text: "geçersiz" }).ok, false);
});
