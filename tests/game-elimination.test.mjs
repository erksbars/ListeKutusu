import assert from "node:assert/strict";
import test from "node:test";
import { chooseEliminationWinner, createEliminationState } from "../lib/games/elimination.ts";

const entries = Array.from({ length: 8 }, (_, index) => `entry-${index + 1}`);

test("dört şarkılık düello seçkisi üç kararlık ağaç üretir", () => {
  let state = createEliminationState(entries.slice(0, 4));
  let choices = 0;
  while (!state.completed) {
    const round = state.rounds.find((item) => item.number === state.currentRound);
    for (const matchup of round.matchups) {
      state = chooseEliminationWinner(state, matchup.number, matchup.entryAId);
      choices += 1;
    }
  }
  assert.equal(choices, 3);
  assert.equal(state.winnerEntryId, "entry-1");
});

test("sekiz şarkıdan dört ilk tur eşleşmesi üretir", () => {
  const state = createEliminationState(entries);
  assert.equal(state.currentRound, 1);
  assert.equal(state.rounds[0].matchups.length, 4);
});

test("tur tamamlandığında kazananlarla sonraki turu açar", () => {
  let state = createEliminationState(entries);
  for (const matchup of state.rounds[0].matchups) {
    state = chooseEliminationWinner(state, matchup.number, matchup.entryAId);
  }
  assert.equal(state.currentRound, 2);
  assert.equal(state.rounds[1].matchups.length, 2);
});

test("final seçimi oyunu tamamlar", () => {
  let state = createEliminationState(entries);
  while (!state.completed) {
    const round = state.rounds.find((item) => item.number === state.currentRound);
    for (const matchup of round.matchups) {
      state = chooseEliminationWinner(state, matchup.number, matchup.entryAId);
    }
  }
  assert.equal(state.winnerEntryId, "entry-1");
});

test("aynı eşleşmede ikinci oyu reddeder", () => {
  const state = chooseEliminationWinner(createEliminationState(entries), 1, "entry-1");
  assert.throws(() => chooseEliminationWinner(state, 1, "entry-2"));
});
