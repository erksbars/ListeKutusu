import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { BACKGAMMON_CODE } from "@/lib/games/backgammon";
import { recordGameEvent } from "@/lib/games/events";
import { getGameDefinition, normalizeGameVisibility } from "@/lib/games/definitions";

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedAccountListId();
  if (!userId) return NextResponse.json({ error: "Tavla odası açmak için giriş yapmalısın." }, { status: 401 });
  const limited = checkRateLimit(req, { name: "backgammon-create", identifier: userId, limit: 10, windowMs: 60 * 60_000 });
  if (!limited.ok) return NextResponse.json({ error: "Çok fazla oda açtın. Biraz sonra tekrar dene." }, { status: 429 });
  const body = await req.json().catch(() => null);
  const definition = getGameDefinition(BACKGAMMON_CODE);
  if (!definition?.available) return NextResponse.json({ error: "Tavla şu anda kullanılamıyor." }, { status: 503 });
  const visibility = normalizeGameVisibility(definition, body?.visibility);

  const session = await prisma.$transaction(async (tx) => {
    const created = await tx.gameSession.create({
      data: {
        gameCode: BACKGAMMON_CODE,
        gameVersion: 1,
        ownerId: userId,
        status: "waiting",
        visibility,
        targetSize: 15,
        maxPlayers: definition.maxPlayers,
        currentRound: 1,
        state: "{}",
      },
    });
    const player = await tx.gamePlayer.create({ data: { sessionId: created.id, userId, seat: 1, status: "ready", state: "{}" } });
    await recordGameEvent(tx, {
      sessionId: created.id,
      playerId: player.id,
      eventType: "room_created",
      summary: "Tavla masası açıldı.",
      revision: created.revision,
    });
    return created;
  });

  return NextResponse.json({ sessionId: session.id }, { status: 201 });
}
