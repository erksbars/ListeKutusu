import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { BACKGAMMON_CODE, presentBackgammonSession } from "@/lib/games/backgammon";
import { abandonExpiredWaitingRoom } from "@/lib/games/backgammonRoom";
import { WAITING_ROOM_LIFETIME_MS } from "@/lib/games/room";

const playerInclude = { user: { select: { ownerName: true, slug: true } } } as const;
const eventInclude = { player: { select: { user: { select: { ownerName: true } } } } } as const;

function getSessionSnapshot(id: string) {
  return prisma.gameSession.findFirst({
    where: { id, gameCode: BACKGAMMON_CODE },
    select: {
      id: true,
      status: true,
      visibility: true,
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
  if (!snapshot) return NextResponse.json({ error: "Tavla odası bulunamadı." }, { status: 404 });

  const ageMs = Date.now() - snapshot.updatedAt.getTime();
  if (snapshot.status === "waiting" && ageMs >= WAITING_ROOM_LIFETIME_MS) {
    await abandonExpiredWaitingRoom(id).catch(() => false);
    snapshot = await getSessionSnapshot(id);
  }
  if (!snapshot) return NextResponse.json({ error: "Tavla odası bulunamadı." }, { status: 404 });

  const participant = snapshot.players.some((player) => player.userId === userId);
  const joinable = snapshot.status === "waiting" && snapshot.visibility !== "private" && snapshot.players.length < 2;
  const spectatable = snapshot.visibility === "public" && ["active", "completed"].includes(snapshot.status);
  if (!participant && !joinable && !spectatable) {
    return NextResponse.json({ error: "Tavla odası bulunamadı." }, { status: 404 });
  }

  const etag = `"game-${snapshot.id}-${snapshot.revision}-${snapshot.status}"`;
  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag, "Cache-Control": "no-store" } });
  }

  const session = await prisma.gameSession.findUnique({
    where: { id },
    include: {
      players: { orderBy: { seat: "asc" }, include: playerInclude },
      events: { orderBy: { createdAt: "desc" }, take: 8, include: eventInclude },
    },
  });
  if (!session) return NextResponse.json({ error: "Tavla odası bulunamadı." }, { status: 404 });

  const account = userId
    ? await prisma.userList.findUnique({
        where: { id: userId },
        select: { ownerName: true, email: true, slug: true, role: true },
      })
    : null;

  return NextResponse.json({
    account,
    canJoin: Boolean(userId && joinable && !participant),
    requiresLogin: Boolean(!userId && joinable),
    session: presentBackgammonSession(session, userId),
  }, { headers: { "Cache-Control": "no-store", ETag: etag } });
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedAccountListId();
  if (!userId) return NextResponse.json({ error: "Masayı kapatmak için giriş yapmalısın." }, { status: 401 });
  const { id } = await context.params;
  const deleted = await prisma.gameSession.deleteMany({
    where: { id, gameCode: BACKGAMMON_CODE, ownerId: userId, status: "waiting" },
  });
  if (deleted.count !== 1) return NextResponse.json({ error: "Bu masa artık kapatılamaz." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
