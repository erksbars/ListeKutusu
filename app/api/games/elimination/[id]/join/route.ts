import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { getPersonalGameCandidates } from "@/lib/games/candidates";
import { createEliminationState } from "@/lib/games/elimination";
import { presentGameSession } from "@/lib/games/presentation";
import { getNextAvailableSeat, isRoomReady } from "@/lib/games/room";
import { resolveGameEntryVideos } from "@/lib/youtube";
import type { GameTrackCandidate } from "@/lib/games/candidates";
import { recordGameEvent } from "@/lib/games/events";

const playerInclude = {
  user: { select: { ownerName: true, slug: true } },
  votes: { select: { roundNumber: true, matchupNumber: true, selectedEntryId: true } },
} as const;
const eventInclude = { player: { select: { user: { select: { ownerName: true } } } } } as const;

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = crypto.randomInt(index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedAccountListId();
  if (!userId) return NextResponse.json({ error: "Düelloya katılmak için giriş yapmalısın." }, { status: 401 });
  const { id } = await context.params;
  const limited = checkRateLimit(req, { name: "game-duel-join", identifier: `${userId}:${id}`, limit: 12, windowMs: 10 * 60_000 });
  if (!limited.ok) return NextResponse.json({ error: "Çok fazla katılma denemesi yaptın." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const rawTrackIds: unknown[] = Array.isArray(body?.trackIds) ? body.trackIds : [];
  const trackIds = [...new Set(rawTrackIds.filter((item): item is string => typeof item === "string"))];
  if (trackIds.length !== 4) return NextResponse.json({ error: "Düelloya katılmak için tam 4 parça seçmelisin." }, { status: 400 });

  const candidates = await getPersonalGameCandidates(prisma, userId);
  const candidateMap = new Map(candidates.map((candidate) => [candidate.trackId, candidate]));
  const selected = trackIds.map((trackId) => candidateMap.get(trackId)).filter((item): item is GameTrackCandidate => Boolean(item));
  if (selected.length !== 4) return NextResponse.json({ error: "Seçilen parçalardan bazıları kişisel havuzunda bulunamadı." }, { status: 400 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.gameSession.findFirst({
        where: {
          id,
          gameCode: "song-elimination",
          gameVersion: { in: [3, 4, 5] },
          status: "waiting",
          visibility: { in: ["unlisted", "public"] },
        },
        include: { players: { orderBy: { seat: "asc" } }, entries: { orderBy: { seed: "asc" } } },
      });
      if (!session) throw new Error("Düello bulunamadı veya artık katılıma açık değil.");
      if (session.players.some((player) => player.userId === userId)) throw new Error("Bu düelloya zaten katıldın.");
      if (session.players.length >= session.maxPlayers) throw new Error("Bu düellonun bütün oyuncu koltukları dolu.");
      const existingTrackIds = new Set(session.entries.map((entry) => entry.trackId));
      if (selected.some((track) => existingTrackIds.has(track.trackId))) {
        throw new Error("Odada daha önce seçilmiş bir şarkıyı tekrar ekleyemezsin.");
      }

      const seat = getNextAvailableSeat(session.players.map((player) => player.seat), session.maxPlayers);
      if (!seat) throw new Error("Uygun oyuncu koltuğu bulunamadı.");
      const guestPlayer = await tx.gamePlayer.create({ data: { sessionId: session.id, userId, seat, state: "{}" } });
      const guestEntries = [];
      for (let index = 0; index < selected.length; index += 1) {
        const track = selected[index]!;
        guestEntries.push(await tx.gameEntry.create({
          data: {
            sessionId: session.id,
            submittedByPlayerId: guestPlayer.id,
            trackId: track.trackId,
            trackName: track.trackName,
            artistName: track.artistName,
            externalUrl: track.externalUrl,
            seed: session.entries.length + index + 1,
          },
        }));
      }

      const playerCount = session.players.length + 1;
      const roomReady = isRoomReady(playerCount, session.maxPlayers);
      const allEntryIds = [...session.entries.map((entry) => entry.id), ...guestEntries.map((entry) => entry.id)];
      const sharedState = roomReady ? createEliminationState(shuffle(allEntryIds)) : null;
      if (sharedState) {
        await tx.gamePlayer.updateMany({
          where: { sessionId: session.id },
          data: { state: JSON.stringify(sharedState), status: "ready" },
        });
      }
      await tx.gameSession.update({
        where: { id: session.id },
        data: {
          gameVersion: 5,
          status: roomReady ? "active" : "waiting",
          visibility: session.gameVersion === 3 ? "public" : session.visibility,
          state: sharedState ? JSON.stringify(sharedState) : "{}",
          startedAt: roomReady ? new Date() : session.startedAt,
          revision: { increment: 1 },
        },
      });
      await recordGameEvent(tx, {
        sessionId: session.id,
        playerId: guestPlayer.id,
        eventType: "player_joined",
        summary: roomReady ? "Yeni oyuncu katıldı; turnuva başladı." : "Yeni oyuncu odaya katıldı.",
        revision: session.revision + 1,
      });
      return { guestEntryIds: guestEntries.map((entry) => entry.id) };
    });

    await resolveGameEntryVideos(prisma, result.guestEntryIds);
    const session = await prisma.gameSession.findUnique({
      where: { id },
      include: {
        entries: { orderBy: { seed: "asc" } },
        players: { orderBy: { seat: "asc" }, include: playerInclude },
        events: { orderBy: { createdAt: "desc" }, take: 8, include: eventInclude },
      },
    });
    if (!session) return NextResponse.json({ error: "Düello bulunamadı." }, { status: 404 });
    return NextResponse.json({ session: presentGameSession(session, userId), joined: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : [];
      if (target.includes("seat")) {
        return NextResponse.json(
          { error: "Bu koltuğa başka bir oyuncu katıldı. Oda durumunu yenileyip tekrar dene." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "Bu düelloya zaten katıldın veya şarkılardan biri odada mevcut." }, { status: 409 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Düelloya katılamadın." }, { status: 400 });
  }
}
