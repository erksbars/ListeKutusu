import type { Prisma } from "@prisma/client";
import type { BackgammonAction, BackgammonMoveTransition } from "./backgammon.ts";

type RecordGameEventInput = {
  sessionId: string;
  playerId?: string | null;
  eventType: string;
  summary: string;
  revision: number;
  metadata?: Record<string, string | number | boolean | null>;
};

export function recordGameEvent(tx: Prisma.TransactionClient, input: RecordGameEventInput) {
  return tx.gameEvent.create({
    data: {
      sessionId: input.sessionId,
      playerId: input.playerId ?? null,
      eventType: input.eventType,
      summary: input.summary,
      revision: input.revision,
      metadata: JSON.stringify(input.metadata ?? {}),
    },
  });
}

function pointLabel(point: number | "bar" | "off_board") {
  if (point === "bar") return "bar";
  if (point === "off_board") return "tahta dışı";
  return `${point}. hane`;
}

export function describeBackgammonMove(
  playerName: string,
  move: BackgammonMoveTransition,
  color?: "black" | "white",
) {
  return {
    eventType: "checker_moved",
    summary: `${playerName}, ${pointLabel(move.from)} konumundan ${pointLabel(move.to)} konumuna oynadı${move.hit ? " ve rakip taşı kırdı" : ""}.`,
    metadata: { from: move.from, to: move.to, ...(move.hit ? { hit: true } : {}), ...(color ? { color } : {}) },
  };
}

export function describeBackgammonAction(playerName: string, action: BackgammonAction) {
  switch (action.type) {
    case "roll":
      return { eventType: "dice_rolled", summary: `${playerName} zar attı.` };
    case "move":
      return describeBackgammonMove(playerName, { from: action.from, to: action.to, hit: false });
    case "pass":
      return { eventType: "turn_passed", summary: `${playerName} oynayamadığı için sırayı geçti.` };
    case "resign":
      return { eventType: "player_resigned", summary: `${playerName} oyundan çekildi.` };
    default:
      return null;
  }
}

export function describeDuelVote(playerName: string) {
  return {
    eventType: "vote_cast",
    summary: `${playerName} bu eşleşmede oy verdi.`,
  };
}

export function describeDuelDecision(trackName: string | null | undefined, completed: boolean) {
  const visibleName = trackName || (completed ? "Oda favorisi" : "Seçilen parça");
  return {
    eventType: "matchup_decided",
    summary: completed
      ? `${visibleName} turnuvayı kazandı.`
      : `${visibleName} bir sonraki tura geçti.`,
  };
}
