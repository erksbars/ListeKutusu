export type GameAccount = { ownerName: string; email: string | null; slug: string; role?: string | null };

export type GameDefinition = {
  code: string;
  name: string;
  description: string;
  mode: string;
  duration: string;
  source: string;
  minPlayers: number;
  maxPlayers: number;
  playerCounts: readonly number[];
  durationLabel: string;
  visibilityModes: readonly ("public" | "unlisted")[];
  turnMode: "simultaneous" | "sequential" | "none";
  turnDurationSeconds: number | null;
  spectatorMode: boolean;
  available: boolean;
};

export type GameTrack = {
  id: string;
  submittedByPlayerId: string | null;
  trackId: string;
  trackName: string;
  artistName: string;
  externalUrl: string | null;
  youtubeVideoId: string | null;
  seed: number;
};

export type GameEventItem = {
  id: string;
  eventType: string;
  summary: string;
  revision: number;
  playerName: string | null;
  createdAt: string;
};

export type EliminationSession = {
  id: string;
  gameCode: string;
  gameVersion: number;
  status: string;
  targetSize: number;
  maxPlayers: number;
  currentRound: number;
  choicesRequired: number;
  winnerEntryId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  viewerCompleted: boolean;
  viewerHasVotedCurrent: boolean;
  matchupVoteCount: number;
  revision: number;
  events: GameEventItem[];
  players: Array<{
    id: string;
    seat: number;
    ownerName: string;
    slug: string;
    completed: boolean;
    completedAt: string | null;
    winnerEntryId: string | null;
    choiceCount: number;
    hasVotedCurrent: boolean;
    contributedEntryIds: string[];
    isViewer: boolean;
  }>;
  compatibility: { compared: number; matching: number; percentage: number } | null;
  entries: GameTrack[];
  bracket: {
    currentRound: number;
    completed: boolean;
    winnerEntryId: string | null;
    rounds: Array<{
      number: number;
      matchups: Array<{
        number: number;
        entryAId: string;
        entryBId: string;
        winnerEntryId: string | null;
      }>;
    }>;
  } | null;
};

export type GameOwner = { ownerName: string; slug: string };

export type GameStats = {
  completedGames: number;
  activeGames: number;
  totalChoices: number;
};

export type BackgammonCheckerStack = {
  count: number;
  color: "black" | "white" | null;
  actionPoint: number | "bar" | "off_board" | null;
  movable: boolean;
};

export type BackgammonSession = {
  id: string;
  status: string;
  visibility: string;
  revision: number;
  updatedAt: string;
  completedAt: string | null;
  isParticipant: boolean;
  isOwner: boolean;
  viewerSeat: number | null;
  viewerColor: "black" | "white" | null;
  players: Array<{
    userId: string;
    seat: number;
    status: string;
    ownerName: string;
    slug: string;
    color: "black" | "white" | null;
    direction: "clockwise" | "counterclockwise" | null;
    pipCount: number | null;
  }>;
  events: GameEventItem[];
  game: null | {
    stateKind: "rolling" | "moving" | "completed";
    activeUserId: string | null;
    activeColor: "black" | "white" | null;
    activePlayerName: string | null;
    winnerUserId: string | null;
    winnerName: string | null;
    dice: number[];
    remainingDice: number[];
    lastMove: {
      from: number | "bar";
      to: number | "off_board";
      revision: number;
      hit: boolean;
      color: "black" | "white" | null;
    } | null;
    canRoll: boolean;
    canPass: boolean;
    turnDeadlineAt: string | null;
    selectedPoint: number | "bar" | null;
    legalMoves: Array<{
      from: number | "bar";
      to: number | "off_board";
    }>;
    offSelectable: boolean;
    points: Array<BackgammonCheckerStack & {
      id: string;
      position: { clockwise: number; counterclockwise: number };
      selected: boolean;
    }>;
    bars: {
      clockwise: BackgammonCheckerStack & { id: string };
      counterclockwise: BackgammonCheckerStack & { id: string };
    };
    off: { clockwise: number; counterclockwise: number };
  };
};
