import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { getPersonalGameCandidates } from "@/lib/games/candidates";
import { getGameDefinition, normalizeGamePlayerCount, normalizeGameVisibility, SONG_ELIMINATION_CODE } from "@/lib/games/definitions";
import { resolveGameEntryVideos } from "@/lib/youtube";
import type { GameTrackCandidate } from "@/lib/games/candidates";
import { recordGameEvent } from "@/lib/games/events";

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedAccountListId();
  if (!userId) return NextResponse.json({ error: "Oyun başlatmak için giriş yapmalısın." }, { status: 401 });
  const limited = checkRateLimit(req, { name: "game-session-create", identifier: userId, limit: 10, windowMs: 60 * 60_000 });
  if (!limited.ok) return NextResponse.json({ error: "Çok fazla oyun başlattın. Biraz sonra tekrar dene." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const definition = getGameDefinition(SONG_ELIMINATION_CODE);
  if (!definition?.available) return NextResponse.json({ error: "Şarkı Düellosu şu anda kullanılamıyor." }, { status: 503 });
  const maxPlayers = normalizeGamePlayerCount(definition, body?.maxPlayers);
  const visibility = normalizeGameVisibility(definition, body?.visibility);
  const rawTrackIds: unknown[] = Array.isArray(body?.trackIds) ? body.trackIds : [];
  const trackIds = [...new Set(rawTrackIds.filter((item): item is string => typeof item === "string"))];
  if (trackIds.length !== 4) {
    return NextResponse.json({ error: "Şarkı Düellosu için tam 4 parça seçmelisin." }, { status: 400 });
  }

  const candidates = await getPersonalGameCandidates(prisma, userId);
  const candidateMap = new Map(candidates.map((candidate) => [candidate.trackId, candidate]));
  const selected = trackIds
    .map((trackId) => candidateMap.get(trackId))
    .filter((item): item is GameTrackCandidate => Boolean(item));
  if (selected.length !== 4) {
    return NextResponse.json({ error: "Seçilen parçalardan bazıları kişisel havuzunda bulunamadı." }, { status: 400 });
  }

  const created = await prisma.$transaction(async (tx) => {
    const session = await tx.gameSession.create({
      data: {
        gameCode: SONG_ELIMINATION_CODE,
        gameVersion: 5,
        ownerId: userId,
        status: "waiting",
        visibility,
        targetSize: maxPlayers * 4,
        maxPlayers,
        currentRound: 1,
        state: "{}",
      },
    });
    const player = await tx.gamePlayer.create({
      data: { sessionId: session.id, userId, seat: 1, state: "{}" },
    });
    await recordGameEvent(tx, {
      sessionId: session.id,
      playerId: player.id,
      eventType: "room_created",
      summary: "Şarkı Düellosu odası açıldı.",
      revision: session.revision,
    });
    const entries = [];
    for (let index = 0; index < selected.length; index += 1) {
      const track = selected[index]!;
      entries.push(await tx.gameEntry.create({
        data: {
          sessionId: session.id,
          submittedByPlayerId: player.id,
          trackId: track.trackId,
          trackName: track.trackName,
          artistName: track.artistName,
          externalUrl: track.externalUrl,
          seed: index + 1,
        },
      }));
    }
    return { sessionId: session.id, entryIds: entries.map((entry) => entry.id) };
  });

  await resolveGameEntryVideos(prisma, created.entryIds);
  return NextResponse.json({ sessionId: created.sessionId }, { status: 201 });
}
