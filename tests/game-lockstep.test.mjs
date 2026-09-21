import assert from "node:assert/strict";
import test from "node:test";
import { getMatchupDecision } from "../lib/games/lockstep.ts";

test("iki oyuncuda ilk oy eslesmeyi ilerletmez", () => {
  assert.deepEqual(getMatchupDecision(["a"], 2), {
    ready: false,
    receivedVotes: 1,
    remainingVotes: 1,
    leaders: [],
  });
});

test("dort oyuncunun tamami oy vermeden karar uretilmez", () => {
  const decision = getMatchupDecision(["a", "b", "a"], 4);
  assert.equal(decision.ready, false);
  assert.equal(decision.remainingVotes, 1);
});

test("cogunluk kazananini ve beraberlik adaylarini dogru verir", () => {
  assert.deepEqual(getMatchupDecision(["a", "a", "a", "b"], 4).leaders, ["a"]);
  assert.deepEqual(getMatchupDecision(["a", "b", "a", "b"], 4).leaders.sort(), ["a", "b"]);
});
