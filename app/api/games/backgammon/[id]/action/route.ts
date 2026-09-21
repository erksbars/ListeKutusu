import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  applyBackgammonAction,
  BACKGAMMON_CODE,
  inferBackgammonMoveTransition,
  parseBackgammonGame,
  presentBackgammonSession,
  serializeBackgammonGame,
  type BackgammonAction,
} from "@/lib/games/backgammon";
import { describeBackgammonAction, describeBackgammonMove, recordGameEvent } from "@/lib/games/events";

const playerInclude = { user: { select: { ownerName: true, slug: true } } } as const;
const eventInclude = { player: { select: { user: { select: { ownerName: true } } } } } as const;
const ACTIONS = new Set(["roll", "point", "move", "cancel", "resign", "pass"]);

class GameRevisionConflictError extends Error {}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedAccountListId();
  if (!userId) return NextResponse.json({ error: "Hamle yapmak için giriş yapmalısın." }, { status: 401 });
  const { id } = await context.params;
  const limited = checkRateLimit(req, { name: "backgammon-action", identifier: `${userId}:${id}`, limit: 90, windowMs: 10 * 60_000 });
  if (!limited.ok) return NextResponse.json({ error: "Çok hızlı işlem yapıyorsun." }, { status: 429 });
  const body = await req.json().catch(() => null);
  const type = typeof body?.type === "string" ? body.type : "";
  if (!ACTIONS.has(type)) return NextResponse.json({ error: "Oyun işlemi geçersiz." }, { status: 400 });
  const point = body?.point === "bar" || body?.point === "off_board" || Number.isInteger(body?.point) ? body.point : null;
  if (type === "point" && point === null) return NextResponse.json({ error: "Hane seçimi geçersiz." }, { status: 400 });
  const from = body?.from === "bar" || Number.isInteger(body?.from) ? body.from : null;
  const to = body?.to === "off_board" || Number.isInteger(body?.to) ? body.to : null;
  if (type === "move" && (from === null || to === null)) return NextResponse.json({ error: "Sürükleme hamlesi geçersiz." }, { status: 400 });
  if (!Number.isInteger(body?.revision) || body.revision < 0) return NextResponse.json({ error: "Oyun sürümü eksik. Tahtayı yenileyip tekrar dene." }, { status: 400 });
  const action = type === "point"
    ? { type, point }
    : type === "move"
      ? { type, from, to }
      : { type };

  try {
    await prisma.$transaction(async (tx) => {
      const session = await tx.gameSession.findFirst({
        where: { id, gameCode: BACKGAMMON_CODE, status: "active" },
        include: { players: { include: playerInclude } },
      });
      if (!session || !session.players.some((player) => player.userId === userId)) {
        throw new Error("Bu tavla odasında oyuncu değilsin.");
      }
      if (session.revision !== body.revision) {
        throw new GameRevisionConflictError("Oyun durumu değişti. Tahta yenileniyor.");
      }

      const game = parseBackgammonGame(session.state);
      const beforeGame = parseBackgammonGame(serializeBackgammonGame(game));
      const actingPlayer = session.players.find((player) => player.userId === userId)!;
      const nextGame = applyBackgammonAction(game, userId, action as BackgammonAction);
      const transition = type === "move" || type === "point"
        ? inferBackgammonMoveTransition(beforeGame, nextGame, actingPlayer.seat)
        : null;
      const winnerNumber = nextGame.winner as number | null;
      const completed = winnerNumber !== null;
      const winnerId = completed ? session.players.find((player) => player.seat === winnerNumber)?.userId ?? null : null;
      const now = new Date();
      const updated = await tx.gameSession.updateMany({
        where: { id, revision: session.revision },
        data: {
          revision: { increment: 1 },
          state: serializeBackgammonGame(nextGame),
          status: completed ? "completed" : "active",
          completedAt: completed ? now : null,
        },
      });
      if (updated.count !== 1) throw new GameRevisionConflictError("Rakibin önce hamle yaptı. Tahta yenileniyor.");
      const event = transition
        ? describeBackgammonMove(actingPlayer.user.ownerName, transition, actingPlayer.seat === 1 ? "white" : "black")
        : describeBackgammonAction(actingPlayer.user.ownerName, action as BackgammonAction);
      if (event) {
        await recordGameEvent(tx, {
          sessionId: id,
          playerId: actingPlayer.id,
          revision: session.revision + 1,
          ...event,
        });
      }
      if (completed) {
        for (const player of session.players) {
          await tx.gamePlayer.update({
            where: { id: player.id },
            data: { status: player.userId === winnerId ? "winner" : "completed", score: player.userId === winnerId ? 1 : 0, completedAt: now },
          });
        }
      }
    });

    const session = await prisma.gameSession.findUnique({
      where: { id },
      include: {
        players: { orderBy: { seat: "asc" }, include: playerInclude },
        events: { orderBy: { createdAt: "desc" }, take: 8, include: eventInclude },
      },
    });
    if (!session) return NextResponse.json({ error: "Tavla odası bulunamadı." }, { status: 404 });
    return NextResponse.json({ session: presentBackgammonSession(session, userId) });
  } catch (error) {
    const status = error instanceof GameRevisionConflictError ? 409 : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Hamle kaydedilemedi." }, { status });
  }
}
