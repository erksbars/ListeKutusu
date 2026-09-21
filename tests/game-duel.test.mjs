import assert from "node:assert/strict";
import test from "node:test";
import { calculateDuelCompatibility } from "../lib/games/duel.ts";

const vote = (roundNumber, matchupNumber, selectedEntryId) => ({
  roundNumber,
  matchupNumber,
  selectedEntryId,
});

test("iki tamamlanmış seçim dizisinin uyumunu hesaplar", () => {
  const result = calculateDuelCompatibility(
    [vote(1, 1, "a"), vote(1, 2, "b"), vote(2, 1, "c")],
    [vote(1, 1, "a"), vote(1, 2, "x"), vote(2, 1, "c")]
  );
  assert.deepEqual(result, { compared: 3, matching: 2, percentage: 67 });
});

test("henüz ortak seçim yoksa sıfır uyum döndürür", () => {
  assert.deepEqual(calculateDuelCompatibility([vote(1, 1, "a")], []), {
    compared: 0,
    matching: 0,
    percentage: 0,
  });
});
