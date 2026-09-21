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

export const GAME_DEFINITIONS = [
  {
    code: "song-elimination",
    name: "Şarkı Düellosu",
    description: "Herkes dörder şarkı getirir; grup aynı eşleşmelere oy verip oda favorisini birlikte belirler.",
    mode: "2 veya 4 oyuncu",
    duration: "5-15 dk",
    source: "Davet bağlantılı",
    minPlayers: 2,
    maxPlayers: 4,
    playerCounts: [2, 4],
    durationLabel: "5-15 dk",
    visibilityModes: ["public", "unlisted"],
    turnMode: "simultaneous",
    turnDurationSeconds: null,
    spectatorMode: true,
    available: true,
  },
  {
    code: "backgammon",
    name: "Tavla",
    description: "İki oyuncu klasik tavlada karşılaşır. Zarlar ve bütün hamleler sunucuda doğrulanır.",
    mode: "2 oyuncu",
    duration: "10-25 dk",
    source: "Açık oda veya davet",
    minPlayers: 2,
    maxPlayers: 2,
    playerCounts: [2],
    durationLabel: "10-25 dk",
    visibilityModes: ["public", "unlisted"],
    turnMode: "sequential",
    turnDurationSeconds: 30,
    spectatorMode: true,
    available: true,
  },
] as const satisfies readonly GameDefinition[];

export const SONG_ELIMINATION_CODE = "song-elimination";
export const BACKGAMMON_CODE = "backgammon";

export function getGameDefinition(code: string) {
  return GAME_DEFINITIONS.find((game) => game.code === code) ?? null;
}

export function normalizeGameVisibility(definition: GameDefinition, value: unknown) {
  return value === "unlisted" && definition.visibilityModes.includes("unlisted") ? "unlisted" : "public";
}

export function normalizeGamePlayerCount(definition: GameDefinition, value: unknown) {
  const requested = typeof value === "number" ? value : Number(value);
  return definition.playerCounts.includes(requested) ? requested : definition.minPlayers;
}
