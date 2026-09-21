import assert from "node:assert/strict";
import test from "node:test";
import {
  GAME_DEFINITIONS,
  getGameDefinition,
  normalizeGamePlayerCount,
  normalizeGameVisibility,
} from "../lib/games/definitions.ts";

test("published games expose the shared room contract", () => {
  for (const game of GAME_DEFINITIONS) {
    assert.ok(game.minPlayers >= 2);
    assert.ok(game.maxPlayers >= game.minPlayers);
    assert.ok(game.playerCounts.includes(game.minPlayers));
    assert.ok(game.playerCounts.every((count) => count >= game.minPlayers && count <= game.maxPlayers));
    assert.ok(game.visibilityModes.includes("public"));
    assert.ok(["simultaneous", "sequential", "none"].includes(game.turnMode));
  }
});

test("game input normalization stays inside the published contract", () => {
  const duel = getGameDefinition("song-elimination");
  const backgammon = getGameDefinition("backgammon");
  assert.ok(duel);
  assert.ok(backgammon);
  assert.equal(normalizeGamePlayerCount(duel, 4), 4);
  assert.equal(normalizeGamePlayerCount(duel, 3), 2);
  assert.equal(normalizeGamePlayerCount(backgammon, 4), 2);
  assert.equal(normalizeGameVisibility(duel, "unlisted"), "unlisted");
  assert.equal(normalizeGameVisibility(duel, "private"), "public");
});
