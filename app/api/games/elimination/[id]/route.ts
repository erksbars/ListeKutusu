import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { presentGameSession } from "@/lib/games/presentation";
import { getPersonalGameCandidates } from "@/lib/games/candidates";
import { abandonExpiredGameRoom } from "@/lib/games/backgammonRoom";
import { isRoomStale } from "@/lib/games/room";

const playerInclude = {
  user: { select: { ownerName: true, slug: true } },
  votes: { select: { roundNumber: true, matchupNumber: true, selectedEntryId: true } },
} as const;
const eventInclude = { player: { select: { user: { select: { ownerName: true } } } } } as const;

function getSessionSnapshot(id: string) {
  return prisma.gameSession.findFirst({
    where: { id, gameCode: "song-elimination" },
    select: {
      id: true,
      gameVersion: true,
      status: true,
      visibility: true,
      maxPlayers: true,
      revision: true,
      updatedAt: true,
      players: { select: { userId: true } },
    },
  });
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedAccountListId();
  const { id } = await context.params;
  let snapshot = await getSessionSnapshot(id);
  if (!snapshot) return NextResponse.json({ error: "Oyun bulunamadı." }, { status: 404 });
  if ((snapshot.status === "waiting" || snapshot.status === "active") && isRoomStale(snapshot.status, snapshot.updatedAt)) {
    await abandonExpiredGameRoom(id, "song-elimination").catch(() => false);
    snapshot = await getSessionSnapshot(id);
  }
  if (!snapshot) return NextResponse.json({ error: "Oyun bulunamadı." }, { status: 404 });

  const participant = snapshot.players.some((player) => player.userId === userId);
  const joinable = snapshot.gameVersion >= 2
    && ["waiting", "active"].includes(snapshot.status)
    && snapshot.visibility !== "private"
    && snapshot.players.length < snapshot.maxPlayers;
  if (!userId && joinable) {
    return NextResponse.json({ error: "Düelloya katılmak için giriş yapmalısın." }, { status: 401 });
  }
  const completedWithLink = snapshot.status === "completed" && snapshot.visibility !== "private";
  const publicSpectatable = (snapshot.visibility === "public" || (snapshot.gameVersion === 3 && snapshot.visibility === "unlisted"))
    && snapshot.status === "active";
  const canView = participant || completedWithLink || publicSpectatable || Boolean(userId && joinable);
  if (!canView) return NextResponse.json({ error: "Oyun bulunamadı." }, { status: 404 });

  const etag = `"game-${snapshot.id}-${snapshot.revision}-${snapshot.status}"`;
  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag, "Cache-Control": "no-store" } });
  }

  const session = await prisma.gameSession.findFirst({
    where: { id, gameCode: "song-elimination" },
    include: {
      entries: { orderBy: { seed: "asc" } },
      owner: { select: { ownerName: true, slug: true } },
      players: { orderBy: { seat: "asc" }, include: playerInclude },
      events: { orderBy: { createdAt: "desc" }, take: 8, include: eventInclude },
    },
  });
  if (!session) return NextResponse.json({ error: "Oyun bulunamadı." }, { status: 404 });
  const account = userId
    ? await prisma.userList.findUnique({
        where: { id: userId },
        select: { ownerName: true, email: true, slug: true, role: true },
      })
    : null;
  const joinCandidates = userId && joinable && !participant
    ? (await getPersonalGameCandidates(prisma, userId)).filter(
        (candidate) => !session.entries.some((entry) => entry.trackId === candidate.trackId)
      )
    : [];
  return NextResponse.json(
    {
      session: presentGameSession(session, userId),
      account,
      owner: session.owner,
      isOwner: session.ownerId === userId,
      canJoin: Boolean(userId && joinable && !participant),
      joinCandidates,
    },
    { headers: { "Cache-Control": "no-store", ETag: etag } }
  );
}
