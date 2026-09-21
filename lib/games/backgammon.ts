import crypto from "node:crypto";
import { createBackgammonEngineMatch, type BackgammonEngineMatch } from "./backgammonEngineAdapter.ts";

export const BACKGAMMON_CODE = "backgammon";
export const BACKGAMMON_STATE_SCHEMA_VERSION = 1;
export const BACKGAMMON_ENGINE_VERSION = "1.2.5";

type PlayerNumber = 1 | 2;
type PointKey = number | "bar" | "off_board";
type Piece = { player_number: PlayerNumber };
type PointJson = { number: number; pieces: Piece[]; selected?: boolean };
type MatchJson = {
  id: string;
  game_state: {
    current_player_number: PlayerNumber;
    current_phase: "roll" | "move";
    first_turn?: boolean;
    dice: Array<{ number: number | null; used?: boolean }>;
    bar: { pieces: Piece[]; selected?: boolean };
    points: PointJson[];
    off_board: { pieces: Piece[]; selected?: boolean };
  };
  players: Array<{ player_number: PlayerNumber; name: string }>;
  move_list?: unknown[];
  last_action?: unknown;
  notification?: string;
};

type Match = BackgammonEngineMatch;

type BackgammonStateEnvelope = {
  schemaVersion: typeof BACKGAMMON_STATE_SCHEMA_VERSION;
  engine: "@mrlhumphreys/jbackgammon";
  engineVersion: typeof BACKGAMMON_ENGINE_VERSION;
  match: MatchJson;
};

type RuntimeDie = {
  number: number | null;
  used: boolean;
  constructor: new (args: { id: number; number: number; used?: boolean }) => RuntimeDie;
};

type RuntimeDiceSet = { dice: RuntimeDie[] };
type MutableMatch = Match & {
  gameState: Match["gameState"] & {
    currentPhase: "roll" | "move";
    firstTurn: boolean;
    dice: RuntimeDiceSet;
  };
  lastAction: { kind: string; data: Record<string, unknown> } | null;
  notification: string;
};

export type BackgammonAction =
  | { type: "roll" }
  | { type: "point"; point: PointKey }
  | { type: "move"; from: Exclude<PointKey, "off_board">; to: Exclude<PointKey, "bar"> }
  | { type: "cancel" }
  | { type: "resign" }
  | { type: "pass" };

type LegalStep = {
  from: Exclude<PointKey, "off_board">;
  to: Exclude<PointKey, "bar">;
  die: number;
};

type BoardState = {
  points: Array<{ owner: PlayerNumber | null; count: number }>;
  bar: Record<PlayerNumber, number>;
  off: Record<PlayerNumber, number>;
};

export type BackgammonMoveTransition = {
  from: number | "bar";
  to: number | "off_board";
  hit: boolean;
};

type SessionPlayer = {
  userId: string;
  seat: number;
  status: string;
  user: { ownerName: string; slug: string };
};

type SessionEvent = {
  id: string;
  eventType: string;
  summary: string;
  revision: number;
  metadata: string;
  createdAt: Date;
  player: null | { user: { ownerName: string } };
};

type BackgammonSessionRecord = {
  id: string;
  status: string;
  visibility: string;
  state: string;
  revision: number;
  updatedAt: Date;
  completedAt: Date | null;
  ownerId: string;
  players: SessionPlayer[];
  events?: SessionEvent[];
};

function pieces(count: number, playerNumber: PlayerNumber) {
  return Array.from({ length: count }, () => ({ player_number: playerNumber }));
}

function initialPoints() {
  const points: PointJson[] = Array.from({ length: 24 }, (_, index) => ({ number: index + 1, pieces: [] }));
  points[0]!.pieces = pieces(2, 1);
  points[11]!.pieces = pieces(5, 1);
  points[16]!.pieces = pieces(3, 1);
  points[18]!.pieces = pieces(5, 1);
  points[5]!.pieces = pieces(5, 2);
  points[7]!.pieces = pieces(3, 2);
  points[12]!.pieces = pieces(5, 2);
  points[23]!.pieces = pieces(2, 2);
  return points;
}

export function createBackgammonGame(playerOneId: string, playerTwoId: string, id = crypto.randomUUID()) {
  const openingDice = secureRoll(true);
  const startingPlayer = (openingDice[0]! > openingDice[1]! ? 1 : 2) as PlayerNumber;
  return createBackgammonEngineMatch({
    id,
    game_state: {
      current_player_number: startingPlayer,
      current_phase: "move",
      first_turn: false,
      dice: openingDice.map((number) => ({ number })),
      bar: { pieces: [] },
      points: initialPoints(),
      off_board: { pieces: [] },
    },
    players: [
      { player_number: 1, name: playerOneId },
      { player_number: 2, name: playerTwoId },
    ],
  }) as Match;
}

function isPiece(value: unknown): value is Piece {
  return Boolean(value && typeof value === "object" && [1, 2].includes((value as Piece).player_number));
}

function isValidMatchJson(value: unknown): value is MatchJson {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MatchJson>;
  const state = candidate.game_state;
  if (!state || ![1, 2].includes(state.current_player_number) || !["roll", "move"].includes(state.current_phase)) return false;
  if (!Array.isArray(candidate.players) || candidate.players.length !== 2) return false;
  if (new Set(candidate.players.map((player) => player.player_number)).size !== 2) return false;
  if (!Array.isArray(state.points) || state.points.length !== 24) return false;
  if (!Array.isArray(state.dice) || state.dice.length < 2 || state.dice.length > 4) return false;
  if (!state.bar || !Array.isArray(state.bar.pieces) || !state.off_board || !Array.isArray(state.off_board.pieces)) return false;
  const validPieces = state.points.every((point, index) => point?.number === index + 1
      && Array.isArray(point.pieces)
      && point.pieces.every(isPiece)
      && new Set(point.pieces.map((piece) => piece.player_number)).size <= 1)
    && state.bar.pieces.every(isPiece)
    && state.off_board.pieces.every(isPiece)
    && state.dice.every((die) => die && (die.number === null || (Number.isInteger(die.number) && die.number >= 1 && die.number <= 6)));
  if (!validPieces) return false;
  const allPieces = [
    ...state.points.flatMap((point) => point.pieces),
    ...state.bar.pieces,
    ...state.off_board.pieces,
  ];
  return [1, 2].every((playerNumber) => allPieces.filter((piece) => piece.player_number === playerNumber).length === 15);
}

export function parseBackgammonGame(value: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("Oyun durumu okunamadı.");
  }
  const candidate = parsed && typeof parsed === "object" && "schemaVersion" in parsed
    ? parseStateEnvelope(parsed)
    : parsed;
  if (!isValidMatchJson(candidate)) throw new Error("Oyun durumu geçersiz veya eksik.");
  return createBackgammonEngineMatch(candidate as MatchJson);
}

export function serializeBackgammonGame(match: Match) {
  const envelope: BackgammonStateEnvelope = {
    schemaVersion: BACKGAMMON_STATE_SCHEMA_VERSION,
    engine: "@mrlhumphreys/jbackgammon",
    engineVersion: BACKGAMMON_ENGINE_VERSION,
    match: match.asJson as MatchJson,
  };
  return JSON.stringify(envelope);
}

function parseStateEnvelope(value: object) {
  const envelope = value as Partial<BackgammonStateEnvelope>;
  if (envelope.schemaVersion !== BACKGAMMON_STATE_SCHEMA_VERSION) {
    throw new Error("Oyun durumu sürümü desteklenmiyor.");
  }
  if (envelope.engine !== "@mrlhumphreys/jbackgammon" || envelope.engineVersion !== BACKGAMMON_ENGINE_VERSION) {
    throw new Error("Oyun motoru sürümü desteklenmiyor.");
  }
  return envelope.match;
}

function playerNumberFor(match: Match, userId: string) {
  const player = match.players.find((item) => item.name === userId);
  if (!player) throw new Error("Bu tavla odasında oyuncu değilsin.");
  return player.playerNumber as PlayerNumber;
}

function secureRoll(firstTurn: boolean) {
  const first = crypto.randomInt(1, 7);
  let second = crypto.randomInt(1, 7);
  while (firstTurn && first === second) second = crypto.randomInt(1, 7);
  return first === second ? [first, second, first, second] : [first, second];
}

function rollDice(match: Match) {
  const mutableMatch = match as MutableMatch;
  const diceSet = mutableMatch.gameState.dice;
  const Die = diceSet.dice[0]?.constructor;
  if (!Die) throw new Error("Zarlar hazırlanamadı.");
  const values = secureRoll(mutableMatch.gameState.firstTurn);
  diceSet.dice = values.map((number, index) => new Die({ id: index + 1, number }));
  mutableMatch.gameState.currentPhase = "move";
  mutableMatch.gameState.firstTurn = false;
  mutableMatch.lastAction = { kind: "roll", data: {} };
  mutableMatch.notification = "Dice have been rolled.";
}

function boardFromState(state: MatchJson["game_state"]): BoardState {
  return {
    points: state.points.map((point) => ({ owner: pointOwner(point), count: point.pieces.length })),
    bar: {
      1: state.bar.pieces.filter((piece) => piece.player_number === 1).length,
      2: state.bar.pieces.filter((piece) => piece.player_number === 2).length,
    },
    off: {
      1: state.off_board.pieces.filter((piece) => piece.player_number === 1).length,
      2: state.off_board.pieces.filter((piece) => piece.player_number === 2).length,
    },
  };
}

function cloneBoard(board: BoardState): BoardState {
  return {
    points: board.points.map((point) => ({ ...point })),
    bar: { ...board.bar },
    off: { ...board.off },
  };
}

export function inferBackgammonMoveTransition(before: Match, after: Match, playerNumberValue: number): BackgammonMoveTransition | null {
  if (playerNumberValue !== 1 && playerNumberValue !== 2) return null;
  const playerNumber = playerNumberValue as PlayerNumber;
  const opponentNumber = (playerNumber === 1 ? 2 : 1) as PlayerNumber;
  const beforeBoard = boardFromState((before.asJson as MatchJson).game_state);
  const afterBoard = boardFromState((after.asJson as MatchJson).game_state);
  const fromCandidates: Array<number | "bar"> = [];
  const toCandidates: Array<number | "off_board"> = [];

  beforeBoard.points.forEach((point, index) => {
    const beforeCount = point.owner === playerNumber ? point.count : 0;
    const nextPoint = afterBoard.points[index]!;
    const afterCount = nextPoint.owner === playerNumber ? nextPoint.count : 0;
    if (afterCount === beforeCount - 1) fromCandidates.push(index + 1);
    if (afterCount === beforeCount + 1) toCandidates.push(index + 1);
  });
  if (afterBoard.bar[playerNumber] === beforeBoard.bar[playerNumber] - 1) fromCandidates.push("bar");
  if (afterBoard.off[playerNumber] === beforeBoard.off[playerNumber] + 1) toCandidates.push("off_board");
  if (fromCandidates.length !== 1 || toCandidates.length !== 1) return null;

  return {
    from: fromCandidates[0]!,
    to: toCandidates[0]!,
    hit: afterBoard.bar[opponentNumber] === beforeBoard.bar[opponentNumber] + 1,
  };
}

function allPiecesHome(board: BoardState, playerNumber: PlayerNumber) {
  if (board.bar[playerNumber] > 0) return false;
  return board.points.every((point, index) => {
    if (point.owner !== playerNumber || point.count === 0) return true;
    const number = index + 1;
    return playerNumber === 1 ? number >= 19 : number <= 6;
  });
}

function farthestHomePoint(board: BoardState, playerNumber: PlayerNumber) {
  const occupied = board.points
    .map((point, index) => ({ ...point, number: index + 1 }))
    .filter((point) => point.owner === playerNumber && point.count > 0);
  if (!occupied.length) return null;
  return playerNumber === 1
    ? Math.min(...occupied.map((point) => point.number))
    : Math.max(...occupied.map((point) => point.number));
}

function destinationOpen(board: BoardState, destination: number, playerNumber: PlayerNumber) {
  const point = board.points[destination - 1];
  return Boolean(point && (point.owner === null || point.owner === playerNumber || point.count <= 1));
}

function legalStepsForDie(board: BoardState, playerNumber: PlayerNumber, die: number): LegalStep[] {
  if (board.bar[playerNumber] > 0) {
    const destination = playerNumber === 1 ? die : 25 - die;
    return destinationOpen(board, destination, playerNumber) ? [{ from: "bar", to: destination, die }] : [];
  }

  const canBearOff = allPiecesHome(board, playerNumber);
  const farthest = canBearOff ? farthestHomePoint(board, playerNumber) : null;
  const steps: LegalStep[] = [];
  board.points.forEach((point, index) => {
    if (point.owner !== playerNumber || point.count === 0) return;
    const from = index + 1;
    const destination = playerNumber === 1 ? from + die : from - die;
    if (destination >= 1 && destination <= 24) {
      if (destinationOpen(board, destination, playerNumber)) steps.push({ from, to: destination, die });
      return;
    }
    if (!canBearOff) return;
    const distance = playerNumber === 1 ? 25 - from : from;
    if (die === distance || (die > distance && from === farthest)) steps.push({ from, to: "off_board", die });
  });
  return steps;
}

function applyStepToBoard(board: BoardState, playerNumber: PlayerNumber, step: LegalStep) {
  const next = cloneBoard(board);
  if (step.from === "bar") {
    next.bar[playerNumber] -= 1;
  } else {
    const origin = next.points[step.from - 1]!;
    origin.count -= 1;
    if (origin.count === 0) origin.owner = null;
  }

  if (step.to === "off_board") {
    next.off[playerNumber] += 1;
    return next;
  }

  const destination = next.points[step.to - 1]!;
  if (destination.owner !== null && destination.owner !== playerNumber && destination.count === 1) {
    next.bar[destination.owner] += 1;
    destination.count = 0;
    destination.owner = null;
  }
  destination.owner = playerNumber;
  destination.count += 1;
  return next;
}

function enumerateLegalSequences(board: BoardState, playerNumber: PlayerNumber, dice: number[]): LegalStep[][] {
  const sequences: LegalStep[][] = [];
  let foundMove = false;
  for (const die of [...new Set(dice)]) {
    const dieIndex = dice.indexOf(die);
    const remaining = dice.filter((_, index) => index !== dieIndex);
    for (const step of legalStepsForDie(board, playerNumber, die)) {
      foundMove = true;
      const continuations = enumerateLegalSequences(applyStepToBoard(board, playerNumber, step), playerNumber, remaining);
      if (!continuations.length) sequences.push([step]);
      else continuations.forEach((continuation) => sequences.push([step, ...continuation]));
    }
  }
  return foundMove ? sequences : [];
}

function optimalLegalSequences(match: Match, playerNumber: PlayerNumber) {
  const state = match.asJson.game_state as MatchJson["game_state"];
  if (state.current_phase !== "move" || state.current_player_number !== playerNumber) return [];
  const dice = state.dice
    .filter((die) => !die.used && typeof die.number === "number")
    .map((die) => die.number as number);
  if (!dice.length) return [];
  const sequences = enumerateLegalSequences(boardFromState(state), playerNumber, dice);
  const maximumMoves = Math.max(0, ...sequences.map((sequence) => sequence.length));
  let optimal = sequences.filter((sequence) => sequence.length === maximumMoves);
  if (maximumMoves === 1 && new Set(dice).size > 1) {
    const highestPlayableDie = Math.max(...optimal.map((sequence) => sequence[0]!.die));
    optimal = optimal.filter((sequence) => sequence[0]!.die === highestPlayableDie);
  }
  return optimal;
}

function selectedPointFromState(state: MatchJson["game_state"]): Exclude<PointKey, "off_board"> | null {
  if (state.bar.selected) return "bar";
  return state.points.find((point) => point.selected)?.number ?? null;
}

function nextLegalSteps(match: Match, playerNumber: PlayerNumber) {
  const seen = new Set<string>();
  return optimalLegalSequences(match, playerNumber)
    .map((sequence) => sequence[0]!)
    .filter((step) => {
      const key = `${step.from}:${step.to}:${step.die}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function resignBackgammonGame(match: Match, resigningPlayer: PlayerNumber) {
  const winner = (resigningPlayer === 1 ? 2 : 1) as PlayerNumber;
  const json = JSON.parse(JSON.stringify(match.asJson)) as MatchJson;
  json.game_state.points.forEach((point) => {
    point.selected = false;
    point.pieces = point.pieces.filter((piece) => piece.player_number !== winner);
  });
  json.game_state.bar.selected = false;
  json.game_state.bar.pieces = json.game_state.bar.pieces.filter((piece) => piece.player_number !== winner);
  json.game_state.off_board.selected = false;
  json.game_state.off_board.pieces = [
    ...json.game_state.off_board.pieces.filter((piece) => piece.player_number !== winner),
    ...pieces(15, winner),
  ];
  json.game_state.current_player_number = winner;
  json.game_state.current_phase = "move";
  json.game_state.dice = [{ number: null }, { number: null }];
  json.last_action = { kind: "resign", data: { player_number: resigningPlayer } };
  json.notification = "Oyuncu oyundan çekildi.";
  return createBackgammonEngineMatch(json);
}

export function applyBackgammonAction(match: Match, userId: string, action: BackgammonAction) {
  const playerNumber = playerNumberFor(match, userId);
  if (match.winner) throw new Error("Bu oyun tamamlandı.");
  if (action.type === "resign") return resignBackgammonGame(match, playerNumber);
  if (match.gameState.currentPlayerNumber !== playerNumber) throw new Error("Sıra rakibinde.");

  if (action.type === "roll") {
    if (match.gameState.currentPhase !== "roll") throw new Error("Zarlar zaten atıldı.");
    rollDice(match);
    return match;
  }

  if (action.type === "pass") {
    if (optimalLegalSequences(match, playerNumber).length > 0) throw new Error("Oynayabileceğin bir hamle varken turu geçemezsin.");
    if (!match.touchPass(playerNumber)) throw new Error(match.notification || "Geçebileceğin bir hamle yok.");
    return match;
  }

  if (action.type === "cancel") {
    const state = match.asJson.game_state as MatchJson["game_state"];
    if (!selectedPointFromState(state)) throw new Error("İptal edilecek bir taş seçimi yok.");
    (match.gameState as Match["gameState"] & { deselect: () => void }).deselect();
    return match;
  }

  if (action.type === "move") {
    const legalMove = nextLegalSteps(match, playerNumber).some((step) => step.from === action.from && step.to === action.to);
    if (!legalMove) throw new Error("Bu sürükleme zorunlu zar kuralına uygun değil.");
    match.touchPoint(action.from, playerNumber);
    match.touchPoint(action.to, playerNumber);
    if (!match.winner && match.gameState.currentPlayerNumber === playerNumber && optimalLegalSequences(match, playerNumber).length === 0) {
      match.touchPass(playerNumber);
    }
    return match;
  }

  const state = match.asJson.game_state as MatchJson["game_state"];
  const selectedPoint = selectedPointFromState(state);
  const legalSteps = nextLegalSteps(match, playerNumber);
  const legalTouch = selectedPoint === null
    ? legalSteps.some((step) => step.from === action.point)
    : legalSteps.some((step) => step.from === selectedPoint && step.to === action.point);
  if (!legalTouch) throw new Error(selectedPoint === null ? "Bu taşla zorunlu zar kuralına uygun hamle yok." : "Bu hedef zorunlu zar kuralına uygun değil.");
  const before = JSON.stringify(match.asJson.game_state);
  match.touchPoint(action.point, playerNumber);
  const after = JSON.stringify(match.asJson.game_state);
  if (before === after) throw new Error(match.notification || "Bu hamle kurallara uygun değil.");
  const beforeState = JSON.parse(before) as MatchJson["game_state"];
  const afterState = JSON.parse(after) as MatchJson["game_state"];
  const boardChanged = JSON.stringify(beforeState.points) !== JSON.stringify(afterState.points)
    || JSON.stringify(beforeState.bar) !== JSON.stringify(afterState.bar)
    || JSON.stringify(beforeState.off_board) !== JSON.stringify(afterState.off_board);
  if (boardChanged && !match.winner && match.gameState.currentPlayerNumber === playerNumber && optimalLegalSequences(match, playerNumber).length === 0) {
    match.touchPass(playerNumber);
  }
  return match;
}

function pointOwner(point: PointJson) {
  return point.pieces[0]?.player_number ?? null;
}

function pipCount(state: MatchJson["game_state"], playerNumber: PlayerNumber) {
  const pointPips = state.points.reduce((total, point) => {
    const count = point.pieces.filter((piece) => piece.player_number === playerNumber).length;
    return total + count * (playerNumber === 1 ? 25 - point.number : point.number);
  }, 0);
  const barCount = state.bar.pieces.filter((piece) => piece.player_number === playerNumber).length;
  return pointPips + barCount * 25;
}

function getSelectablePoints(match: Match, viewerNumber: PlayerNumber | null) {
  const selectable = new Set<PointKey>();
  if (!viewerNumber) return selectable;
  const state = match.asJson.game_state as MatchJson["game_state"];
  if (state.current_player_number !== viewerNumber) return selectable;
  const selected = selectedPointFromState(state);
  for (const step of nextLegalSteps(match, viewerNumber)) {
    if (selected === null) selectable.add(step.from);
    else if (step.from === selected) selectable.add(step.to);
  }
  return selectable;
}

export function presentBackgammonSession(session: BackgammonSessionRecord, viewerId?: string | null) {
  const match = session.state && session.state !== "{}" ? parseBackgammonGame(session.state) : null;
  const participant = session.players.find((player) => player.userId === viewerId) ?? null;
  const viewerNumber = participant?.seat === 1 ? 1 : participant?.seat === 2 ? 2 : null;
  const selectable = match ? getSelectablePoints(match, viewerNumber) : new Set<PointKey>();
  const json = match?.asJson as MatchJson | undefined;
  const state = json?.game_state;
  const winnerNumber = match?.winner as PlayerNumber | null | undefined;
  const winnerPlayer = winnerNumber ? session.players.find((player) => player.seat === winnerNumber) : null;
  const activePlayer = state ? session.players.find((player) => player.seat === state.current_player_number) : null;
  const lastMoveEvent = session.events?.find((event) => event.eventType === "checker_moved") ?? null;
  const lastMoveMetadata = (() => {
    if (!lastMoveEvent) return null;
    try {
      const parsed = JSON.parse(lastMoveEvent.metadata) as { from?: unknown; to?: unknown; hit?: unknown; color?: unknown };
      const from = parsed.from === "bar" || Number.isInteger(parsed.from) ? parsed.from as number | "bar" : null;
      const to = parsed.to === "off_board" || Number.isInteger(parsed.to) ? parsed.to as number | "off_board" : null;
      const color = parsed.color === "black" || parsed.color === "white" ? parsed.color : null;
      return from !== null && to !== null ? { from, to, revision: lastMoveEvent.revision, hit: parsed.hit === true, color } : null;
    } catch {
      return null;
    }
  })();

  return {
    id: session.id,
    status: session.status,
    visibility: session.visibility,
    revision: session.revision,
    updatedAt: session.updatedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    isParticipant: Boolean(participant),
    isOwner: session.ownerId === viewerId,
    viewerSeat: participant?.seat ?? null,
    viewerColor: viewerNumber === 1 ? "white" : viewerNumber === 2 ? "black" : null,
    players: session.players.map((player) => ({
      userId: player.userId,
      seat: player.seat,
      status: player.status,
      ownerName: player.user.ownerName,
      slug: player.user.slug,
      color: player.seat === 1 ? "white" : "black",
      direction: player.seat === 1 ? "clockwise" : "counterclockwise",
      pipCount: state ? pipCount(state, player.seat as PlayerNumber) : null,
    })),
    events: (session.events ?? []).map((event) => ({
      id: event.id,
      eventType: event.eventType,
      summary: event.summary,
      revision: event.revision,
      playerName: event.player?.user.ownerName ?? null,
      createdAt: event.createdAt.toISOString(),
    })),
    game: state ? {
      stateKind: winnerNumber ? "completed" : state.current_phase === "roll" ? "rolling" : "moving",
      activeUserId: activePlayer?.userId ?? null,
      activeColor: state.current_player_number === 1 ? "white" : "black",
      activePlayerName: activePlayer?.user.ownerName ?? null,
      winnerUserId: winnerPlayer?.userId ?? null,
      winnerName: winnerPlayer?.user.ownerName ?? null,
      dice: state.dice.map((die) => die.number).filter((number): number is number => typeof number === "number"),
      remainingDice: state.dice.filter((die) => !die.used && typeof die.number === "number").map((die) => die.number as number),
      lastMove: lastMoveMetadata,
      canRoll: Boolean(viewerNumber && state.current_player_number === viewerNumber && state.current_phase === "roll"),
      canPass: Boolean(viewerNumber && state.current_player_number === viewerNumber && state.current_phase === "move" && optimalLegalSequences(match!, viewerNumber).length === 0 && match?.passable(viewerNumber)),
      turnDeadlineAt: null,
      selectedPoint: state.points.find((point) => point.selected)?.number ?? (state.bar.selected ? "bar" : null),
      legalMoves: viewerNumber && state.current_player_number === viewerNumber
        ? nextLegalSteps(match!, viewerNumber).map((step) => ({ from: step.from, to: step.to }))
        : [],
      offSelectable: selectable.has("off_board"),
      points: state.points.map((point) => ({
        id: String(point.number),
        position: { clockwise: point.number, counterclockwise: 25 - point.number },
        count: point.pieces.length,
        color: pointOwner(point) === 1 ? "white" : pointOwner(point) === 2 ? "black" : null,
        actionPoint: selectable.has(point.number) ? point.number : null,
        movable: selectable.has(point.number),
        selected: Boolean(point.selected),
      })),
      bars: {
        clockwise: {
          id: "bar-white",
          count: state.bar.pieces.filter((piece) => piece.player_number === 1).length,
          color: "white",
          actionPoint: selectable.has("bar") && viewerNumber === 1 ? "bar" : null,
          movable: selectable.has("bar") && viewerNumber === 1,
        },
        counterclockwise: {
          id: "bar-black",
          count: state.bar.pieces.filter((piece) => piece.player_number === 2).length,
          color: "black",
          actionPoint: selectable.has("bar") && viewerNumber === 2 ? "bar" : null,
          movable: selectable.has("bar") && viewerNumber === 2,
        },
      },
      off: {
        clockwise: state.off_board.pieces.filter((piece) => piece.player_number === 1).length,
        counterclockwise: state.off_board.pieces.filter((piece) => piece.player_number === 2).length,
      },
    } : null,
  };
}
