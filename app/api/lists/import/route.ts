import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { getTrack, type TrackResult } from "@/lib/spotify";
import { isSpotifyTrackId, TRACK_IMPORT_BATCH_SIZE } from "@/lib/track-import";

export const dynamic = "force-dynamic";

async function resolveTracks(trackIds: string[]) {
  const tracks = new Map<string, TrackResult>();
  const failed: string[] = [];

  for (let index = 0; index < trackIds.length; index += 4) {
    const chunk = trackIds.slice(index, index + 4);
    const results = await Promise.allSettled(chunk.map((trackId) => getTrack(trackId)));

    results.forEach((result, resultIndex) => {
      const trackId = chunk[resultIndex];
      if (result.status === "fulfilled") tracks.set(trackId, result.value);
      else failed.push(trackId);
    });
  }

  return { tracks, failed };
}

export async function POST(req: NextRequest) {
  const listId = await getAuthenticatedAccountListId();
  if (!listId) {
    return NextResponse.json({ error: "Şarkı aktarmak için giriş yapmalısın." }, { status: 401 });
  }

  const limited = checkRateLimit(req, {
    name: "track-import",
    identifier: listId,
    limit: 40,
    windowMs: 10 * 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok fazla aktarım isteği gönderildi. Biraz sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  const rawIds: unknown[] = Array.isArray(body?.trackIds) ? body.trackIds : [];
  const trackIds = [
    ...new Set(
      rawIds
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(isSpotifyTrackId)
    ),
  ];

  if (trackIds.length === 0) {
    return NextResponse.json({ error: "Geçerli Spotify şarkı bağlantısı bulunamadı." }, { status: 400 });
  }
  if (trackIds.length > TRACK_IMPORT_BATCH_SIZE) {
    return NextResponse.json(
      { error: `Bir istekte en fazla ${TRACK_IMPORT_BATCH_SIZE} şarkı aktarılabilir.` },
      { status: 400 }
    );
  }

  const account = await prisma.userList.findFirst({
    where: { id: listId, status: "active" },
    select: { id: true },
  });
  if (!account) {
    return NextResponse.json({ error: "Aktif hesap bulunamadı." }, { status: 404 });
  }

  const existingRows = await prisma.suggestion.findMany({
    where: { listId, trackId: { in: trackIds } },
    orderBy: { createdAt: "desc" },
  });
  const activeTrackIds = new Set(
    existingRows
      .filter((item) => item.status === "approved" || item.status === "pending")
      .map((item) => item.trackId)
  );
  const reusableByTrackId = new Map<string, (typeof existingRows)[number]>();
  for (const row of existingRows) {
    if (!activeTrackIds.has(row.trackId) && !reusableByTrackId.has(row.trackId)) {
      reusableByTrackId.set(row.trackId, row);
    }
  }

  const idsToResolve = trackIds.filter((trackId) => !activeTrackIds.has(trackId));
  const { tracks, failed } = await resolveTracks(idsToResolve);
  const now = new Date();

  const operations = [...tracks.values()].map((track) => {
    const reusable = reusableByTrackId.get(track.id);
    const data = {
      trackId: track.id,
      trackUri: track.uri,
      trackName: track.name,
      artistName: track.artist,
      durationMs: track.durationMs,
      suggestedBy: "Toplu bağlantı aktarımı",
      suggestedById: listId,
      status: "approved",
      decidedAt: now,
    };

    return reusable
      ? prisma.suggestion.update({ where: { id: reusable.id }, data })
      : prisma.suggestion.create({ data: { ...data, listId } });
  });

  if (operations.length > 0) await prisma.$transaction(operations);

  return NextResponse.json({
    imported: operations.length,
    existing: activeTrackIds.size,
    failed,
  });
}
