declare module "@mrlhumphreys/jbackgammon" {
  type PointKey = number | "bar" | "off_board";
  type MatchArgs = Record<string, unknown> & {
    id: string;
    game_state: Record<string, unknown>;
    players: Array<Record<string, unknown>>;
  };
  type SerializedGameState = Record<string, unknown> & {
    current_player_number: number;
    current_phase: string;
    dice: Array<{ number: number | null; used?: boolean }>;
    points: Array<{ number: number; pieces: Array<{ player_number: number }>; selected?: boolean }>;
    bar: { pieces: Array<{ player_number: number }>; selected?: boolean };
    off_board: { pieces: Array<{ player_number: number }>; selected?: boolean };
  };
  type SerializedMatch = Record<string, unknown> & {
    id: string;
    game_state: SerializedGameState;
    players: Array<Record<string, unknown>>;
  };
  type RuntimePoint = { number: number; constructorName?: string };
  type PointCollection = {
    points: RuntimePoint[];
    ownedByPlayer(playerNumber: number): PointCollection;
    destinations(from: RuntimePoint, dice: unknown, playerNumber: number): PointCollection;
  };

  interface MatchInstance {
    asJson: SerializedMatch;
    players: Array<{ playerNumber: number; name: string }>;
    winner: number | null;
    notification: string;
    gameState: {
      currentPlayerNumber: number;
      currentPhase: string;
      firstTurn: boolean;
      movePhase: boolean;
      selectedPoint: RuntimePoint | null;
      dice: unknown;
      bar: { hasPiecesOwnedByPlayer(playerNumber: number): boolean };
      points: PointCollection;
    };
    passable(playerNumber: number): boolean;
    touchDice(playerNumber: number): boolean;
    touchPoint(point: PointKey, playerNumber: number): boolean;
    touchPass(playerNumber: number): boolean;
  }

  type MatchConstructor = new (args: MatchArgs) => MatchInstance;
  const value: { Match: MatchConstructor } | { default: { Match: MatchConstructor } };
  export default value;
}
