import assert from "node:assert/strict";
import test from "node:test";
import {
  applyBackgammonAction,
  createBackgammonGame,
  inferBackgammonMoveTransition,
  parseBackgammonGame,
  presentBackgammonSession,
  serializeBackgammonGame,
} from "../lib/games/backgammon.ts";

test("bozuk veya eksik tavla kayitlarini reddeder", () => {
  assert.throws(() => parseBackgammonGame("not-json"), /Oyun durumu/);
  assert.throws(() => parseBackgammonGame(JSON.stringify({ game_state: {} })), /Oyun durumu/);
  const valid = createBackgammonGame("user-a", "user-b", "invalid-piece-count").asJson;
  valid.game_state.points[0].pieces.pop();
  assert.throws(() => parseBackgammonGame(JSON.stringify(valid)), /Oyun durumu/);
});

test("guvenli zarlar 1-6 araliginda kalir ve ilk turdan sonra ciftler dort hak verir", () => {
  const match = createBackgammonGame("user-a", "user-b", "game-dice");
  const activeUser = match.gameState.currentPlayerNumber === 1 ? "user-a" : "user-b";
  const openingDice = match.gameState.dice.asJson;
  assert.equal(openingDice.length, 2);
  assert.notEqual(openingDice[0].number, openingDice[1].number);
  assert.equal(match.gameState.firstTurn, false);
  assert.equal(match.gameState.currentPhase, "move");
  assert.equal(match.gameState.currentPlayerNumber, openingDice[0].number > openingDice[1].number ? 1 : 2);

  let foundDouble = false;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    match.gameState.currentPhase = "roll";
    applyBackgammonAction(match, activeUser, { type: "roll" });
    const dice = match.gameState.dice.asJson;
    assert.equal(dice.every((die) => Number.isInteger(die.number) && die.number >= 1 && die.number <= 6), true);
    if (dice.length === 4) {
      foundDouble = true;
      assert.equal(new Set(dice.map((die) => die.number)).size, 1);
      break;
    }
  }
  assert.equal(foundDouble, true, "120 atista hic cift gelmedi.");
});

function sessionFor(match) {
  return {
    id: "room-1",
    status: "active",
    visibility: "public",
    revision: 1,
    state: serializeBackgammonGame(match),
    updatedAt: new Date("2026-07-29T12:00:00.000Z"),
    completedAt: null,
    ownerId: "user-a",
    players: [
      { userId: "user-a", seat: 1, status: "ready", user: { ownerName: "Ada", slug: "ada" } },
      { userId: "user-b", seat: 2, status: "ready", user: { ownerName: "Bora", slug: "bora" } },
    ],
  };
}

test("tavla durumunu kayipsiz saklar ve zar sirasini yalnız aktif oyuncuya verir", () => {
  const match = createBackgammonGame("user-a", "user-b", "game-1");
  const activeNumber = match.gameState.currentPlayerNumber;
  const activeUser = activeNumber === 1 ? "user-a" : "user-b";
  const inactiveUser = activeNumber === 1 ? "user-b" : "user-a";

  assert.throws(() => applyBackgammonAction(match, inactiveUser, { type: "roll" }), /Sıra rakibinde/);
  match.gameState.currentPhase = "roll";
  applyBackgammonAction(match, activeUser, { type: "roll" });
  assert.equal(match.gameState.currentPhase, "move");
  assert.equal(match.gameState.dice.asJson.every((die) => Number.isInteger(die.number)), true);

  const restored = parseBackgammonGame(serializeBackgammonGame(match));
  assert.deepEqual(restored.asJson.game_state, match.asJson.game_state);
});

test("tavla kaydini surumlu zarfla saklar ve eski kayitlari okumaya devam eder", () => {
  const match = createBackgammonGame("user-a", "user-b", "state-envelope");
  const serialized = serializeBackgammonGame(match);
  const envelope = JSON.parse(serialized);
  assert.equal(envelope.schemaVersion, 1);
  assert.equal(envelope.engine, "@mrlhumphreys/jbackgammon");
  assert.equal(envelope.engineVersion, "1.2.5");
  assert.deepEqual(parseBackgammonGame(serialized).asJson, match.asJson);
  assert.deepEqual(parseBackgammonGame(JSON.stringify(match.asJson)).asJson, match.asJson);
  assert.throws(() => parseBackgammonGame(JSON.stringify({ ...envelope, schemaVersion: 99 })), /sürümü/);
});

test("sunum yalnız geçerli başlangıç taşlarını seçilebilir gösterir ve hamleyi doğrular", () => {
  const match = createBackgammonGame("user-a", "user-b", "game-2");
  const activeUser = match.gameState.currentPlayerNumber === 1 ? "user-a" : "user-b";

  const firstView = presentBackgammonSession(sessionFor(match), activeUser);
  const origin = firstView.game.points.find((point) => point.movable);
  assert.ok(origin?.actionPoint);
  const beforePoints = JSON.stringify(match.asJson.game_state.points);
  applyBackgammonAction(match, activeUser, { type: "point", point: origin.actionPoint });

  const selectedView = presentBackgammonSession(sessionFor(match), activeUser);
  assert.equal(selectedView.game.selectedPoint, origin.actionPoint);
  const destination = selectedView.game.points.find((point) => point.movable && point.actionPoint !== origin.actionPoint);
  assert.ok(destination?.actionPoint);
  applyBackgammonAction(match, activeUser, { type: "point", point: destination.actionPoint });
  assert.notEqual(JSON.stringify(match.asJson.game_state.points), beforePoints);
});

test("surukle birak hamlesini tek atomik islemde uygular", () => {
  const match = createBackgammonGame("user-a", "user-b", "drag-move");
  const activeUser = match.gameState.currentPlayerNumber === 1 ? "user-a" : "user-b";
  const view = presentBackgammonSession(sessionFor(match), activeUser);
  const move = view.game.legalMoves[0];
  assert.ok(move);
  assert.equal(view.game.turnDeadlineAt, null);
  const before = JSON.stringify(match.asJson.game_state.points);
  applyBackgammonAction(match, activeUser, { type: "move", from: move.from, to: move.to });
  assert.notEqual(JSON.stringify(match.asJson.game_state.points), before);
});

function pieces(count, playerNumber) {
  return Array.from({ length: count }, () => ({ player_number: playerNumber }));
}

function positionMatch({ points = {}, bar = {}, off = {}, dice, currentPlayer = 1, id = "position" }) {
  return parseBackgammonGame(JSON.stringify({
    id,
    game_state: {
      current_player_number: currentPlayer,
      current_phase: "move",
      first_turn: false,
      dice: dice.map((die) => typeof die === "number" ? { number: die } : die),
      bar: { pieces: [...pieces(bar[1] ?? 0, 1), ...pieces(bar[2] ?? 0, 2)] },
      points: Array.from({ length: 24 }, (_, index) => ({
        number: index + 1,
        pieces: points[index + 1]
          ? pieces(points[index + 1].count, points[index + 1].player)
          : [],
      })),
      off_board: { pieces: [...pieces(off[1] ?? 0, 1), ...pieces(off[2] ?? 0, 2)] },
    },
    players: [
      { player_number: 1, name: "user-a" },
      { player_number: 2, name: "user-b" },
    ],
  }));
}

test("yalnız bir zar oynanabiliyorsa büyük zarı zorunlu tutar", () => {
  const match = positionMatch({
    bar: { 1: 1 },
    points: { 7: { player: 2, count: 2 } },
    off: { 1: 14, 2: 13 },
    dice: [1, 6],
    id: "higher-die",
  });

  applyBackgammonAction(match, "user-a", { type: "point", point: "bar" });
  const view = presentBackgammonSession(sessionFor(match), "user-a");
  assert.equal(view.game.points.find((point) => point.id === "1").movable, false);
  assert.equal(view.game.points.find((point) => point.id === "6").movable, true);
  assert.throws(() => applyBackgammonAction(match, "user-a", { type: "point", point: 1 }), /zorunlu zar/);
  applyBackgammonAction(match, "user-a", { type: "point", point: 6 });
  assert.equal(match.gameState.currentPlayerNumber, 2, "Kalan zar oynanamıyorsa tur otomatik geçmeli.");
});

test("iki zarı kullanmayı mümkün kılan hamle sırasını zorunlu tutar", () => {
  const match = positionMatch({
    points: {
      1: { player: 1, count: 1 },
      2: { player: 1, count: 1 },
      4: { player: 2, count: 2 },
    },
    off: { 1: 13, 2: 13 },
    dice: [1, 2],
    id: "maximum-dice",
  });

  applyBackgammonAction(match, "user-a", { type: "point", point: 1 });
  const view = presentBackgammonSession(sessionFor(match), "user-a");
  assert.equal(view.game.points.find((point) => point.id === "2").movable, false);
  assert.equal(view.game.points.find((point) => point.id === "3").movable, true);
});

test("fazla zarla yalnız en gerideki taşı toplatır", () => {
  const match = positionMatch({
    points: {
      20: { player: 1, count: 1 },
      24: { player: 1, count: 1 },
    },
    off: { 1: 13, 2: 15 },
    dice: [{ number: 6 }, { number: 1, used: true }],
    id: "bear-off",
  });
  const view = presentBackgammonSession(sessionFor(match), "user-a");
  assert.equal(view.game.points.find((point) => point.id === "20").movable, true);
  assert.equal(view.game.points.find((point) => point.id === "24").movable, false);
});

test("oyuncu taş seçimini hamle yapmadan iptal edebilir", () => {
  const match = createBackgammonGame("user-a", "user-b", "cancel-selection");
  const activeUser = match.gameState.currentPlayerNumber === 1 ? "user-a" : "user-b";
  const view = presentBackgammonSession(sessionFor(match), activeUser);
  const origin = view.game.points.find((point) => point.movable);
  applyBackgammonAction(match, activeUser, { type: "point", point: origin.actionPoint });
  assert.ok(match.gameState.selectedPoint);
  applyBackgammonAction(match, activeUser, { type: "cancel" });
  assert.equal(match.gameState.selectedPoint, null);
});

test("oyuncu sırası dışında da çekilebilir ve rakibi kazanan olur", () => {
  const match = createBackgammonGame("user-a", "user-b", "resign");
  const resigningUser = match.gameState.currentPlayerNumber === 1 ? "user-b" : "user-a";
  const expectedWinner = resigningUser === "user-a" ? 2 : 1;
  const completed = applyBackgammonAction(match, resigningUser, { type: "resign" });
  assert.equal(completed.winner, expectedWinner);
  assert.equal(completed.asJson.game_state.off_board.pieces.filter((piece) => piece.player_number === expectedWinner).length, 15);
});

test("tek rakip taşını kırar ve bara gönderir", () => {
  const match = positionMatch({
    points: {
      1: { player: 1, count: 1 },
      3: { player: 2, count: 1 },
    },
    off: { 1: 14, 2: 14 },
    dice: [{ number: 2 }, { number: 6, used: true }],
    id: "hit-blot",
  });
  const before = parseBackgammonGame(serializeBackgammonGame(match));
  applyBackgammonAction(match, "user-a", { type: "point", point: 1 });
  applyBackgammonAction(match, "user-a", { type: "point", point: 3 });
  assert.deepEqual(inferBackgammonMoveTransition(before, match, 1), { from: 1, to: 3, hit: true });
  assert.equal(match.asJson.game_state.points[2].pieces[0].player_number, 1);
  assert.equal(match.asJson.game_state.bar.pieces.filter((piece) => piece.player_number === 2).length, 1);
});

test("çift zar dört ayrı hamle hakkı verir", () => {
  const match = positionMatch({
    points: {
      1: { player: 1, count: 4 },
      24: { player: 2, count: 1 },
    },
    off: { 1: 11, 2: 14 },
    dice: [1, 1, 1, 1],
    id: "double-four-moves",
  });
  for (let move = 0; move < 4; move += 1) {
    const view = presentBackgammonSession(sessionFor(match), "user-a");
    const origin = view.game.points.find((point) => point.movable);
    applyBackgammonAction(match, "user-a", { type: "point", point: origin.actionPoint });
    const selected = presentBackgammonSession(sessionFor(match), "user-a");
    const destination = selected.game.points.find((point) => point.movable && point.actionPoint !== origin.actionPoint);
    applyBackgammonAction(match, "user-a", { type: "point", point: destination.actionPoint });
  }
  assert.equal(match.gameState.currentPlayerNumber, 2);
  const travelledPips = match.asJson.game_state.points.reduce((total, point) => (
    total + point.number * point.pieces.filter((piece) => piece.player_number === 1).length
  ), 0);
  assert.equal(travelledPips, 8);
});

test("legal hamlelerle oyun taş toplamaya ve kazanana kadar ilerler", () => {
  const match = createBackgammonGame("user-a", "user-b", "game-complete");

  for (let step = 0; step < 5000 && !match.winner; step += 1) {
    const activeUser = match.gameState.currentPlayerNumber === 1 ? "user-a" : "user-b";
    if (match.gameState.currentPhase === "roll") {
      applyBackgammonAction(match, activeUser, { type: "roll" });
      continue;
    }

    const view = presentBackgammonSession(sessionFor(match), activeUser);
    if (view.game.canPass) {
      applyBackgammonAction(match, activeUser, { type: "pass" });
      continue;
    }
    if (view.game.offSelectable) {
      applyBackgammonAction(match, activeUser, { type: "point", point: "off_board" });
      continue;
    }

    const bar = Object.values(view.game.bars).find((stack) => stack.movable && stack.actionPoint);
    const point = view.game.points.find((stack) => stack.movable && stack.actionPoint !== null);
    const actionPoint = bar?.actionPoint ?? point?.actionPoint;
    assert.notEqual(actionPoint, null, `Oyun ${step}. adımda geçerli hamle bulamadı.`);
    assert.notEqual(actionPoint, undefined, `Oyun ${step}. adımda geçerli hamle bulamadı.`);
    applyBackgammonAction(match, activeUser, { type: "point", point: actionPoint });
  }

  assert.ok(match.winner === 1 || match.winner === 2, "Oyun güvenli adım sınırında tamamlanamadı.");
});
