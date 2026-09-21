import { parseEliminationState, type EliminationState } from "@/lib/games/elimination";
import { calculateDuelCompatibility } from "@/lib/games/duel";

type SessionForPresentation = {
  id: string;
  gameCode: string;
  gameVersion: number;
  status: string;
  targetSize: number;
  maxPlayers: number;
  currentRound: number;
  revision: number;
  state: string;
  winnerEntryId: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  entries: Array<{
    id: string;
    submittedByPlayerId: string | null;
    trackId: string;
    trackName: string;
    artistName: string;
    externalUrl: string | null;
    youtubeVideoId: string | null;
    seed: number;
  }>;
  players?: Array<{
    id: string;
    userId: string;
    seat: number;
    status: string;
    state: string;
    winnerEntryId: string | null;
    completedAt: Date | null;
    user: { ownerName: string; slug: string };
    votes: Array<{ roundNumber: number; matchupNumber: number; selectedEntryId: string }>;
  }>;
  events?: Array<{
    id: string;
    eventType: string;
    summary: string;
    revision: number;
    createdAt: Date;
    player: null | { user: { ownerName: string } };
  }>;
};

function tryParseState(value: string | null | undefined): EliminationState | null {
  if (!value || value === "{}") return null;
  try {
    return parseEliminationState(value);
  } catch {
    return null;
  }
}

function requiredChoices(state: EliminationState | null) {
  const initialCount = (state?.rounds[0]?.matchups.length ?? 0) * 2;
  return initialCount > 0 ? initialCount - 1 : 0;
}

export function presentGameSession(session: SessionForPresentation, viewerId?: string | null) {
  const viewerPlayer = session.players?.find((player) => player.userId === viewerId) ?? null;
  const visibleState = session.gameVersion >= 5
    ? tryParseState(session.state)
    : tryParseState(viewerPlayer?.state) ?? tryParseState(session.players?.[0]?.state) ?? tryParseState(session.state);
  const currentMatchup = visibleState?.rounds
    .find((round) => round.number === visibleState.currentRound)
    ?.matchups.find((matchup) => !matchup.winnerEntryId) ?? null;
  const players = (session.players ?? []).map((player) => ({
    id: player.id,
    seat: player.seat,
    ownerName: player.user.ownerName,
    slug: player.user.slug,
    completed: Boolean(player.completedAt),
    completedAt: player.completedAt?.toISOString() ?? null,
    winnerEntryId: player.winnerEntryId,
    choiceCount: player.votes.length,
    hasVotedCurrent: Boolean(currentMatchup && player.votes.some((vote) => (
      vote.roundNumber === visibleState?.currentRound && vote.matchupNumber === currentMatchup.number
    ))),
    contributedEntryIds: session.entries.filter((entry) => entry.submittedByPlayerId === player.id).map((entry) => entry.id),
    isViewer: player.userId === viewerId,
  }));
  const compatibility = (session.gameVersion < 3 || session.gameVersion >= 4)
    && session.players?.length === 2
    && session.players.every((player) => player.completedAt)
    ? calculateDuelCompatibility(session.players[0].votes, session.players[1].votes)
    : null;
  const currentVotes = currentMatchup
    ? (session.players ?? []).flatMap((player) => player.votes).filter(
        (vote) => vote.roundNumber === visibleState?.currentRound && vote.matchupNumber === currentMatchup.number
      )
    : [];
  const viewerHasVotedCurrent = Boolean(viewerPlayer && currentMatchup && viewerPlayer.votes.some((vote) => (
    vote.roundNumber === visibleState?.currentRound && vote.matchupNumber === currentMatchup.number
  )));
  return {
    id: session.id,
    gameCode: session.gameCode,
    gameVersion: session.gameVersion,
    status: session.status,
    targetSize: session.targetSize,
    maxPlayers: session.maxPlayers,
    currentRound: visibleState?.currentRound ?? session.currentRound,
    revision: session.revision,
    bracket: visibleState,
    choicesRequired: requiredChoices(visibleState),
    winnerEntryId: viewerPlayer?.winnerEntryId ?? session.winnerEntryId,
    viewerCompleted: Boolean(viewerPlayer?.completedAt),
    viewerHasVotedCurrent,
    matchupVoteCount: currentVotes.length,
    players,
    events: (session.events ?? []).map((event) => ({
      id: event.id,
      eventType: event.eventType,
      summary: event.summary,
      revision: event.revision,
      playerName: event.player?.user.ownerName ?? null,
      createdAt: event.createdAt.toISOString(),
    })),
    compatibility,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    entries: session.entries.map((entry) => ({ ...entry })),
  };
}
