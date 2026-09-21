import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addSuggestionToSpotifyList, exportApprovedListToSpotify } from "@/lib/lists";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { getTrack, getTracksMetadata } from "@/lib/spotify";
import type { Suggestion } from "@prisma/client";
import type { TrackMetadata } from "@/lib/spotify";

const ARTIST_GENRES: Record<string, string[]> = {
  scorpions: ["hard rock", "classic rock"],
  "gary moore": ["blues rock", "blues"],
  metallica: ["metal", "thrash metal"],
  "guns n' roses": ["hard rock", "classic rock"],
  "guns n roses": ["hard rock", "classic rock"],
  "r.e.m.": ["alternative rock", "college rock"],
  rem: ["alternative rock", "college rock"],
  "barış manço": ["anadolu rock", "turkish rock"],
  "baris manco": ["anadolu rock", "turkish rock"],
  "cem karaca": ["anadolu rock", "turkish rock"],
  duman: ["turkish rock", "alternative rock"],
  mor: ["turkish rock"],
  "mor ve ötesi": ["turkish rock", "alternative rock"],
  "manga": ["turkish rock", "alternative metal"],
  "sezen aksu": ["turkish pop", "pop"],
  tarkan: ["turkish pop", "pop"],
  "müslüm gürses": ["arabesk", "turkish folk"],
  "muslum gurses": ["arabesk", "turkish folk"],
  "ibrahim tatlıses": ["arabesk", "turkish folk"],
  "ibrahim tatlises": ["arabesk", "turkish folk"],
};

const KEYWORD_GENRES: Array<[RegExp, string[]]> = [
  [/\b(remaster|rock|hurricane|wind of change|guitar)\b/i, ["rock"]],
  [/\b(blues|still got the blues)\b/i, ["blues"]],
  [/\b(metal|thrash)\b/i, ["metal"]],
  [/\b(acoustic|unplugged)\b/i, ["acoustic"]],
  [/\b(live|concert)\b/i, ["live performance"]],
  [/\b(remix|club|dance|house|techno|edm)\b/i, ["electronic"]],
  [/\b(rap|hip hop|trap)\b/i, ["hip hop"]],
  [/\b(jazz|swing)\b/i, ["jazz"]],
  [/\b(pop)\b/i, ["pop"]],
  [/\b(arabesk)\b/i, ["arabesk"]],
];

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function inferGenres(artistName: string, trackName: string) {
  const found = new Set<string>();
  const normalizedArtist = normalizeText(artistName);
  const normalizedTrack = normalizeText(trackName);

  for (const [artist, genres] of Object.entries(ARTIST_GENRES)) {
    if (normalizedArtist.includes(normalizeText(artist))) {
      genres.forEach((genre) => found.add(genre));
    }
  }

  for (const [pattern, genres] of KEYWORD_GENRES) {
    if (pattern.test(normalizedArtist) || pattern.test(normalizedTrack)) {
      genres.forEach((genre) => found.add(genre));
    }
  }

  return [...found];
}

function serializeSuggestion(item: Suggestion, meta?: TrackMetadata) {
  const inferredGenres = inferGenres(item.artistName, item.trackName);
  const genres = meta?.genres?.length
    ? meta.genres
    : inferredGenres.length
      ? inferredGenres
      : ["Tür belirtilmemiş"];
  const artists = meta?.artists?.length
    ? meta.artists
    : [{ id: item.artistName, name: item.artistName, genres: [] }];

  return {
    id: item.id,
    trackId: item.trackId,
    trackName: item.trackName,
    artistName: item.artistName,
    durationMs: item.durationMs,
    suggestedBy: item.suggestedBy,
    status: item.status,
    decidedAt: item.decidedAt,
    imageUrl: meta?.imageUrl ?? null,
    externalUrl: meta?.externalUrl ?? null,
    album: meta?.album ?? "",
    genres,
    primaryGenre: genres[0],
    artists,
  };
}

export async function GET() {
  const listId = await getAuthenticatedAccountListId();
  if (!listId) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const list = await prisma.userList.findUnique({
    where: { id: listId },
    select: {
      id: true,
      ownerName: true,
      email: true,
      slug: true,
      role: true,
      playlistName: true,
      spotifyExternalUrl: true,
      lastExportedAt: true,
      suggestions: {
        where: { status: "approved" },
        orderBy: [{ decidedAt: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!list) {
    return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });
  }

  let metadata = new Map<string, TrackMetadata>();

  try {
    metadata = await getTracksMetadata(list.suggestions.map((item) => item.trackId));
  } catch (err) {
    console.error("Control metadata failed", err);
  }

  return NextResponse.json({
    list: {
      id: list.id,
      ownerName: list.ownerName,
      email: list.email,
      slug: list.slug,
      role: list.role,
      playlistName: list.playlistName,
      spotifyExternalUrl: list.spotifyExternalUrl,
      lastExportedAt: list.lastExportedAt,
    },
    tracks: list.suggestions.map((item) =>
      serializeSuggestion(item, metadata.get(item.trackId))
    ),
  });
}

export async function POST(req: NextRequest) {
  const listId = await getAuthenticatedAccountListId();
  if (!listId) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";

  if (action === "add") {
    const trackId = typeof body?.trackId === "string" ? body.trackId.trim() : "";
    if (!trackId) {
      return NextResponse.json({ error: "Şarkı seçimi gerekli." }, { status: 400 });
    }

    const existing = await prisma.suggestion.findFirst({
      where: { listId, trackId, status: "approved" },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Bu şarkı zaten onaylı listede." },
        { status: 409 }
      );
    }

    try {
      let track;
      try {
        track = await getTrack(trackId);
      } catch (err) {
        console.error("Control track verification failed", err);
        return NextResponse.json(
          { error: "Şarkı şu anda Spotify tarafında doğrulanamadı. Biraz sonra tekrar dene." },
          { status: 502 }
        );
      }

      const suggestion = await prisma.suggestion.create({
        data: {
          listId,
          trackId: track.id,
          trackUri: track.uri,
          trackName: track.name,
          artistName: track.artist,
          durationMs: track.durationMs,
          suggestedBy: "Liste kontrolü",
          status: "approved",
          decidedAt: new Date(),
        },
      });

      let warning: string | null = null;
      try {
        await addSuggestionToSpotifyList(suggestion.id);
      } catch (err) {
        console.error("Control add Spotify sync failed", err);
        warning =
          "Şarkı yerel listeye eklendi, Spotify senkronu için listeyi yenile.";
      }

      return NextResponse.json({ suggestion, warning });
    } catch (err) {
      console.error("Control add failed", err);
      return NextResponse.json(
        { error: "Şarkı listeye eklenemedi." },
        { status: 502 }
      );
    }
  }

  if (action === "remove") {
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json({ error: "Şarkı ID gerekli." }, { status: 400 });
    }

    const suggestion = await prisma.suggestion.findFirst({
      where: { id, listId, status: "approved" },
    });
    if (!suggestion) {
      return NextResponse.json({ error: "Şarkı bulunamadı." }, { status: 404 });
    }

    const updated = await prisma.suggestion.update({
      where: { id },
      data: { status: "removed", decidedAt: new Date() },
    });

    let warning: string | null = null;
    try {
      await exportApprovedListToSpotify(listId);
    } catch (err) {
      console.error("Control remove Spotify sync failed", err);
      warning =
        "Şarkı yerel listeden çıkarıldı, Spotify senkronu için listeyi yenile.";
    }

    return NextResponse.json({ suggestion: updated, warning });
  }

  return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
}
