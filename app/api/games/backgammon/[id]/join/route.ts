import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  BACKGAMMON_CODE,
  createBackgammonGame,
  presentBackgammonSession,
  serializeBackgammonGame,
} from "@/lib/games/backgammon";
import { recordGameEvent } from "@/lib/games/events";

const playerInclude = { user: { select: { ownerName: true, slug: true } } } as const;
const eventInclude = { player: { select: { user: { select: { ownerName: true } } } } } as const;

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedAccountListId();
  if (!userId) return NextResponse.json({ error: "Tavla odasına katılmak için giriş yapmalısın." }, { status: 401 });
  const { id } = await context.params;
  const limited = checkRateLimit(req, { name: "backgammon-join", identifier: `${userId}:${id}`, limit: 12, windowMs: 10 * 60_000 });
  if (!limited.ok) return NextResponse.json({ error: "Çok fazla katılma denemesi yaptın." }, { status: 429 });

  try {
    await prisma.$transaction(async (tx) => {
      const session = await tx.gameSession.findFirst({
        where: { id, gameCode: BACKGAMMON_CODE, status: "waiting", visibility: { in: ["public", "unlisted"] } },
        include: { players: { orderBy: { seat: "asc" } } },
      });
      if (!session) throw new Error("Oda artık katılıma açık değil.");
      if (session.players.some((player) => player.userId === userId)) return;
      if (session.players.length !== 1) throw new Error("Odanın oyuncu koltukları dolu.");

      const ownerPlayer = session.players[0]!;
      const guestPlayer = await tx.gamePlayer.create({ data: { sessionId: id, userId, seat: 2, status: "ready", state: "{}" } });
      const game = createBackgammonGame(ownerPlayer.userId, userId);
      await tx.gameSession.update({
        where: { id },
        data: { status: "active", revision: { increment: 1 }, state: serializeBackgammonGame(game), startedAt: new Date() },
      });
      await recordGameEvent(tx, {
        sessionId: id,
        playerId: guestPlayer.id,
        eventType: "player_joined",
        summary: "İkinci oyuncu masaya katıldı; oyun başladı.",
        revision: session.revision + 1,
      });
    });

    const session = await prisma.gameSession.findUnique({
      where: { id },
      include: {
        players: { orderBy: { seat: "asc" }, include: playerInclude },
        events: { orderBy: { createdAt: "desc" }, take: 8, include: eventInclude },
      },
    });
    if (!session) return NextResponse.json({ error: "Tavla odası bulunamadı." }, { status: 404 });
    return NextResponse.json({ session: presentBackgammonSession(session, userId), joined: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Bu odaya zaten katıldın veya koltuk doldu." }, { status: 409 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Odaya katılamadın." }, { status: 400 });
  }
}
