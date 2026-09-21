import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { GAME_DEFINITIONS } from "@/lib/games/definitions";
import { getRoomStaleBefore } from "@/lib/games/room";

export async function GET() {
  const userId = await getAuthenticatedAccountListId();
  const now = new Date();
  const publicRooms = await prisma.gameSession.findMany({
    where: {
      OR: [
        { gameCode: "song-elimination", gameVersion: { gte: 5 } },
        { gameCode: "backgammon", gameVersion: { gte: 1 } },
      ],
      visibility: "public",
      AND: [{ OR: [
        { status: "waiting", updatedAt: { gt: getRoomStaleBefore("waiting", now) } },
        { status: "active", updatedAt: { gt: getRoomStaleBefore("active", now) } },
      ] }],
    },
    orderBy: { updatedAt: "desc" },
    take: 12,
    select: {
      id: true,
      gameCode: true,
      status: true,
      maxPlayers: true,
      updatedAt: true,
      owner: { select: { ownerName: true, slug: true } },
      players: { select: { userId: true, user: { select: { ownerName: true } } }, orderBy: { seat: "asc" } },
    },
  });
  const [account, sessions, completedGames, activeGames, totalChoices] = userId
    ? await Promise.all([
      prisma.userList.findUnique({
        where: { id: userId },
        select: { ownerName: true, email: true, slug: true, role: true },
      }),
      prisma.gameSession.findMany({
        where: { players: { some: { userId } } },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          gameCode: true,
          status: true,
          currentRound: true,
          targetSize: true,
          winnerEntryId: true,
          updatedAt: true,
          entries: { select: { id: true, trackName: true, artistName: true } },
        },
      }),
      prisma.gameSession.count({ where: { players: { some: { userId } }, status: "completed" } }),
      prisma.gameSession.count({ where: { players: { some: { userId } }, status: { in: ["waiting", "active"] } } }),
      prisma.gameVote.count({ where: { player: { userId } } }),
    ])
    : [null, [], 0, 0, 0] as const;

  return NextResponse.json({
    authenticated: Boolean(account),
    account,
    games: GAME_DEFINITIONS,
    stats: { completedGames, activeGames, totalChoices },
    sessions: sessions.map((session) => ({
      ...session,
      updatedAt: session.updatedAt.toISOString(),
      winner: session.entries.find((entry) => entry.id === session.winnerEntryId) ?? null,
      entries: undefined,
    })),
    publicRooms: publicRooms.map((room) => ({
      id: room.id,
      gameCode: room.gameCode,
      status: room.status,
      updatedAt: room.updatedAt.toISOString(),
      owner: room.owner,
      playerNames: room.players.map((player) => player.user.ownerName),
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers,
      isParticipant: Boolean(userId && room.players.some((player) => player.userId === userId)),
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}
