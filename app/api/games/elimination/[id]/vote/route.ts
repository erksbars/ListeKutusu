import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { chooseEliminationWinner, parseEliminationState } from "@/lib/games/elimination";
import { getMatchupDecision } from "@/lib/games/lockstep";
import { presentGameSession } from "@/lib/games/presentation";
import { describeDuelDecision, describeDuelVote, recordGameEvent } from "@/lib/games/events";

const playerInclude = {
  user: { select: { ownerName: true, slug: true } },
  votes: { select: { roundNumber: true, matchupNumber: true, selectedEntryId: true } },
} as const;
const eventInclude = { player: { select: { user: { select: { ownerName: true } } } } } as const;

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedAccountListId();
  if (!userId) return NextResponse.json({ error: "Oturum açmalısın." }, { status: 401 });
  const { id } = await context.params;
  const limited = checkRateLimit(req, { name: "game-vote", identifier: `${userId}:${id}`, limit: 40, windowMs: 10 * 60_000 });
  if (!limited.ok) return NextResponse.json({ error: "Çok hızlı seçim yapıyorsun." }, { status: 429 });
  const body = await req.json().catch(() => null);
  const matchupNumber = Number(body?.matchupNumber);
  const selectedEntryId = typeof body?.selectedEntryId === "string" ? body.selectedEntryId : "";
  if (!Number.isInteger(matchupNumber) || matchupNumber < 1 || !selectedEntryId) {
    return NextResponse.json({ error: "Seçim bilgisi geçersiz." }, { status: 400 });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const session = await tx.gameSession.findFirst({
        where: { id, gameCode: "song-elimination", status: "active" },
        include: {
          entries: { orderBy: { seed: "asc" } },
          players: { include: { user: { select: { ownerName: true } } } },
        },
      });
      const player = session?.players.find((item) => item.userId === userId);
      if (!session || !player) throw new Error("Düelloya katılmadan seçim yapamazsın.");
      if (player.completedAt) throw new Error("Bu düellodaki seçimlerin tamamlandı.");
      if (!session.entries.some((entry) => entry.id === selectedEntryId)) throw new Error("Şarkı bu oyunda yer almıyor.");

      if (session.gameVersion >= 5) {
        const currentState = parseEliminationState(session.state);
        const currentRound = currentState.rounds.find((round) => round.number === currentState.currentRound);
        const currentMatchup = currentRound?.matchups.find((matchup) => !matchup.winnerEntryId);
        if (!currentMatchup || currentMatchup.number !== matchupNumber) throw new Error("Bu eşleşme artık oylamaya açık değil.");
        if (selectedEntryId !== currentMatchup.entryAId && selectedEntryId !== currentMatchup.entryBId) {
          throw new Error("Seçilen şarkı bu eşleşmede yer almıyor.");
        }
        await tx.gameVote.create({
          data: {
            sessionId: session.id,
            playerId: player.id,
            selectedEntryId,
            roundNumber: currentState.currentRound,
            matchupNumber,
          },
        });
        await tx.gamePlayer.update({ where: { id: player.id }, data: { status: "waiting" } });
        await tx.gameSession.update({ where: { id: session.id }, data: { updatedAt: new Date(), revision: { increment: 1 } } });
        const voteEvent = describeDuelVote(player.user.ownerName);
        await recordGameEvent(tx, {
          sessionId: session.id,
          playerId: player.id,
          revision: session.revision + 1,
          ...voteEvent,
        });
        const votes = await tx.gameVote.findMany({
          where: { sessionId: session.id, roundNumber: currentState.currentRound, matchupNumber },
          select: { selectedEntryId: true },
        });
        const decision = getMatchupDecision(votes.map((vote) => vote.selectedEntryId), session.maxPlayers);
        if (!decision.ready) return session.id;
        const decidedEntryId = decision.leaders[crypto.randomInt(decision.leaders.length)]!;
        const nextState = chooseEliminationWinner(currentState, matchupNumber, decidedEntryId);
        const now = new Date();
        await tx.gamePlayer.updateMany({
          where: { sessionId: session.id },
          data: {
            state: JSON.stringify(nextState),
            status: nextState.completed ? "completed" : "ready",
            winnerEntryId: nextState.winnerEntryId,
            completedAt: nextState.completed ? now : null,
          },
        });
        await tx.gameSession.update({
          where: { id: session.id },
          data: {
            state: JSON.stringify(nextState),
            currentRound: nextState.currentRound,
            status: nextState.completed ? "completed" : "active",
            winnerEntryId: nextState.winnerEntryId,
            completedAt: nextState.completed ? now : null,
          },
        });
        const decidedEntry = session.entries.find((entry) => entry.id === decidedEntryId);
        const decisionEvent = describeDuelDecision(decidedEntry?.trackName, nextState.completed);
        await recordGameEvent(tx, {
          sessionId: session.id,
          revision: session.revision + 1,
          metadata: { entryId: decidedEntryId, round: currentState.currentRound, matchup: matchupNumber },
          ...decisionEvent,
        });
        return session.id;
      }

      const currentState = parseEliminationState(player.state === "{}" ? session.state : player.state);
      const nextState = chooseEliminationWinner(currentState, matchupNumber, selectedEntryId);
      await tx.gameVote.create({
        data: { sessionId: session.id, playerId: player.id, selectedEntryId, roundNumber: currentState.currentRound, matchupNumber },
      });
      const now = new Date();
      await tx.gamePlayer.update({
        where: { id: player.id },
        data: {
          state: JSON.stringify(nextState),
          status: nextState.completed ? "completed" : "playing",
          winnerEntryId: nextState.winnerEntryId,
          completedAt: nextState.completed ? now : null,
        },
      });
      const completedOthers = session.players.filter((item) => item.id !== player.id && item.completedAt).length;
      const sessionCompleted = nextState.completed && session.players.length >= 2 && completedOthers >= session.players.length - 1;
      await tx.gameSession.update({
        where: { id: session.id },
        data: {
          currentRound: Math.max(session.currentRound, nextState.currentRound),
          status: sessionCompleted ? "completed" : "active",
          winnerEntryId: sessionCompleted ? nextState.winnerEntryId : null,
          completedAt: sessionCompleted ? now : null,
          revision: { increment: 1 },
        },
      });
      const voteEvent = describeDuelVote(player.user.ownerName);
      await recordGameEvent(tx, {
        sessionId: session.id,
        playerId: player.id,
        revision: session.revision + 1,
        ...voteEvent,
      });
      return session.id;
    });

    const session = await prisma.gameSession.findUnique({
      where: { id: updated },
      include: {
        entries: { orderBy: { seed: "asc" } },
        players: { orderBy: { seat: "asc" }, include: playerInclude },
        events: { orderBy: { createdAt: "desc" }, take: 8, include: eventInclude },
      },
    });
    if (!session) return NextResponse.json({ error: "Düello bulunamadı." }, { status: 404 });
    return NextResponse.json({ session: presentGameSession(session, userId) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Bu eşleşmede oyunu zaten kullandın." }, { status: 409 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Seçim kaydedilemedi." }, { status: 400 });
  }
}
