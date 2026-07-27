import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { selectRandomTracks } from "@/lib/discovery";
import { checkRateLimit } from "@/lib/rateLimit";
import { getPlaylistTracks, type TrackResult } from "@/lib/spotify";

export const dynamic = "force-dynamic";

let cachedSource: { playlistId: string; tracks: TrackResult[]; expiresAt: number } | null = null;

export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, {
    name: "random-discovery",
    limit: 20,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Yeni keşifleri çok hızlı istiyorsun. Biraz sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const settings = await prisma.settings.findUnique({
    where: { id: 1 },
    select: { playlistId: true, playlistName: true },
  });
  if (!settings?.playlistId) {
    return NextResponse.json(
      { error: "Keşif kaynağı henüz ayarlanmadı." },
      { status: 503 }
    );
  }

  const excluded = (req.nextUrl.searchParams.get("exclude") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 50);
  const requestedCount = Number(req.nextUrl.searchParams.get("count") ?? 5);
  const count = Math.min(5, Math.max(1, Number.isFinite(requestedCount) ? requestedCount : 5));

  try {
    if (
      !cachedSource ||
      cachedSource.playlistId !== settings.playlistId ||
      cachedSource.tracks.length === 0 ||
      cachedSource.expiresAt <= Date.now()
    ) {
      cachedSource = {
        playlistId: settings.playlistId,
        tracks: await getPlaylistTracks(settings.playlistId),
        expiresAt: Date.now() + 5 * 60_000,
      };
    }

    let tracks = selectRandomTracks(cachedSource.tracks, count, excluded);
    if (tracks.length < count) {
      tracks = selectRandomTracks(cachedSource.tracks, count);
    }

    return NextResponse.json({
      sourceName: settings.playlistName || "Editör seçkisi",
      total: cachedSource.tracks.length,
      tracks: tracks.map((track) => ({
        id: track.id,
        uri: track.uri,
        name: track.name,
        artist: track.artist,
        album: track.album,
        externalUrl: track.externalUrl,
        durationMs: track.durationMs,
      })),
    });
  } catch (error) {
    console.error("Random discovery failed", error);
    return NextResponse.json(
      { error: "Beşli keşif şu anda hazırlanamadı. Biraz sonra tekrar dene." },
      { status: 502 }
    );
  }
}
