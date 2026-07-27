import { prisma } from "./db";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;

const AUTH_BASE = "https://accounts.spotify.com";
const API_BASE = "https://api.spotify.com/v1";

export type TrackResult = {
  id: string;
  uri: string;
  name: string;
  artist: string;
  album: string;
  imageUrl: string | null;
  externalUrl: string | null;
  durationMs: number;
};

export type TrackMetadata = TrackResult & {
  artists: { id: string; name: string; genres: string[] }[];
  genres: string[];
};

type SpotifyArtist = {
  id: string;
  name: string;
  genres?: string[];
};

type SpotifyTrack = {
  id: string;
  uri: string;
  name: string;
  artists?: SpotifyArtist[];
  album?: { name?: string; images?: { url: string }[] };
  external_urls?: { spotify?: string };
  duration_ms: number;
};

function mapTrack(t: SpotifyTrack): TrackResult {
  return {
    id: t.id,
    uri: t.uri,
    name: t.name,
    artist: (t.artists ?? []).map((artist) => artist.name).join(", "),
    album: t.album?.name ?? "",
    imageUrl: t.album?.images?.[1]?.url ?? t.album?.images?.[0]?.url ?? null,
    externalUrl: t.external_urls?.spotify ?? null,
    durationMs: t.duration_ms,
  };
}

export function getAuthUrl(state: string) {
  const scopes = [
    "playlist-modify-public",
    "playlist-modify-private",
    "playlist-read-private",
    "playlist-read-collaborative",
  ].join(" ");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: scopes,
    redirect_uri: REDIRECT_URI,
    state,
    show_dialog: "true",
  });
  return `${AUTH_BASE}/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string) {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    "base64"
  );
  const res = await fetch(`${AUTH_BASE}/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });
  if (!res.ok) {
    throw new Error(`Spotify token exchange failed: ${await res.text()}`);
  }
  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>;
}

async function refreshOwnerToken(refreshToken: string) {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    "base64"
  );
  const res = await fetch(`${AUTH_BASE}/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    throw new Error(`Spotify token refresh failed: ${await res.text()}`);
  }
  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  }>;
}

export async function getValidOwnerAccessToken(): Promise<string> {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings?.spotifyAccessToken || !settings.spotifyRefreshToken) {
    throw new Error("Owner has not connected Spotify yet.");
  }

  const stillValid =
    settings.spotifyExpiresAt &&
    settings.spotifyExpiresAt.getTime() > Date.now() + 60_000;

  if (stillValid) return settings.spotifyAccessToken;

  const refreshed = await refreshOwnerToken(settings.spotifyRefreshToken);
  const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

  await prisma.settings.update({
    where: { id: 1 },
    data: {
      spotifyAccessToken: refreshed.access_token,
      spotifyExpiresAt: expiresAt,
      ...(refreshed.refresh_token
        ? { spotifyRefreshToken: refreshed.refresh_token }
        : {}),
    },
  });

  return refreshed.access_token;
}

let cachedClientToken: { token: string; expiresAt: number } | null = null;

function clearCachedClientToken(token?: string) {
  if (!token || cachedClientToken?.token === token) {
    cachedClientToken = null;
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSpotifyRetryDelay(response: Response, attempt: number) {
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after"));
    if (Number.isFinite(retryAfter) && retryAfter >= 0) {
      return Math.min(retryAfter * 1000, 2_000);
    }
  }
  return 250 * (attempt + 1);
}

export async function getClientCredentialsToken(): Promise<string> {
  if (cachedClientToken && cachedClientToken.expiresAt > Date.now() + 30_000) {
    return cachedClientToken.token;
  }

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    "base64"
  );
  const res = await fetch(`${AUTH_BASE}/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  if (!res.ok) {
    throw new Error(`Client credentials token failed: ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedClientToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

export async function searchTracks(query: string): Promise<TrackResult[]> {
  const token = await getClientCredentialsToken();
  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: "10",
  });
  const res = await fetch(`${API_BASE}/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Spotify search failed: ${await res.text()}`);
  }
  const data = (await res.json()) as { tracks?: { items?: SpotifyTrack[] } };
  return (data.tracks?.items ?? []).map(mapTrack);
}

export async function getTrack(trackId: string): Promise<TrackResult> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    let token = "";
    let res: Response;
    try {
      token = await getClientCredentialsToken();
      res = await fetch(`${API_BASE}/tracks/${encodeURIComponent(trackId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      lastError = error;
      if (attempt === 2) break;
      clearCachedClientToken(token);
      await wait(250 * (attempt + 1));
      continue;
    }

    if (res.ok) {
      return mapTrack((await res.json()) as SpotifyTrack);
    }

    const detail = await res.text();
    lastError = new Error(`Spotify track lookup failed (${res.status}): ${detail}`);
    const retryable =
      res.status === 401 || res.status === 408 || res.status === 429 || res.status >= 500;
    if (!retryable || attempt === 2) break;

    if (res.status === 401) clearCachedClientToken(token);
    await wait(getSpotifyRetryDelay(res, attempt));
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Spotify track lookup failed.");
}

export async function createOwnerPlaylist(name: string) {
  const token = await getValidOwnerAccessToken();

  const res = await fetch(`${API_BASE}/me/playlists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      public: false,
      description: "A moderated playlist built from listener suggestions.",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 403) {
      throw new Error(
        "Spotify liste oluşturma izni reddedildi. Liste sahibi Spotify bağlantısını /admin sayfasından yeniden bağla ve playlist izinlerini onayla."
      );
    }
    throw new Error(`Playlist could not be created: ${body}`);
  }
  const data = await res.json();
  return {
    id: data.id as string,
    externalUrl: data.external_urls?.spotify as string | undefined,
    snapshotId: data.snapshot_id as string | undefined,
  };
}

export async function updateOwnerPlaylistDetails(
  playlistId: string,
  name: string,
  description: string
) {
  const token = await getValidOwnerAccessToken();
  const res = await fetch(`${API_BASE}/playlists/${playlistId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description, public: false }),
  });
  if (!res.ok) {
    throw new Error(`Playlist details could not be updated: ${await res.text()}`);
  }
}

export async function isTrackInPlaylist(playlistId: string, trackId: string) {
  const token = await getValidOwnerAccessToken();
  let nextUrl: string | null = `${API_BASE}/playlists/${playlistId}/items?${new URLSearchParams(
    {
      fields: "items(item(id),track(id)),next",
      limit: "100",
    }
  ).toString()}`;

  while (nextUrl) {
    const res: Response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Playlist check failed: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      items?: { item?: { id?: string }; track?: { id?: string } }[];
      next?: string | null;
    };
    if ((data.items ?? []).some((entry) => (entry.item ?? entry.track)?.id === trackId)) {
      return true;
    }
    nextUrl = data.next ?? null;
  }

  return false;
}

export async function isTrackInOwnerPlaylist(trackId: string) {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings?.playlistId) return false;
  return isTrackInPlaylist(settings.playlistId, trackId);
}

export async function addTracksToPlaylist(playlistId: string, trackUris: string[]) {
  if (trackUris.length === 0) return;
  const token = await getValidOwnerAccessToken();
  const res = await fetch(`${API_BASE}/playlists/${playlistId}/items`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris: trackUris }),
  });
  if (!res.ok) {
    throw new Error(`Track could not be added: ${await res.text()}`);
  }
  const data = await res.json().catch(() => null);
  return data?.snapshot_id as string | undefined;
}

export async function removeTracksFromPlaylist(
  playlistId: string,
  trackUris: string[]
) {
  if (trackUris.length === 0) return;
  const token = await getValidOwnerAccessToken();
  const res = await fetch(`${API_BASE}/playlists/${playlistId}/items`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: trackUris.map((uri) => ({ uri })),
    }),
  });
  if (!res.ok) {
    throw new Error(`Track could not be removed: ${await res.text()}`);
  }
  const data = await res.json().catch(() => null);
  return data?.snapshot_id as string | undefined;
}

export async function replacePlaylistTracks(
  playlistId: string,
  trackUris: string[]
) {
  const token = await getValidOwnerAccessToken();
  const firstChunk = trackUris.slice(0, 100);
  const res = await fetch(`${API_BASE}/playlists/${playlistId}/items`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris: firstChunk }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 403) {
      throw new Error(
        "Spotify bu listeyi düzenlemeye izin vermedi. Liste sahibi Spotify bağlantısını /admin sayfasından yeniden bağlayıp playlist izinlerini onaylamalı."
      );
    }
    throw new Error(`Playlist could not be replaced: ${body}`);
  }

  let snapshotId = (await res.json().catch(() => null))?.snapshot_id as
    | string
    | undefined;

  for (let i = 100; i < trackUris.length; i += 100) {
    snapshotId =
      (await addTracksToPlaylist(playlistId, trackUris.slice(i, i + 100))) ??
      snapshotId;
  }

  return snapshotId;
}

export async function addTrackToPlaylist(trackUri: string, playlistId?: string) {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const targetPlaylistId = playlistId ?? settings?.playlistId;
  if (!targetPlaylistId) throw new Error("Target playlist is not set.");
  return addTracksToPlaylist(targetPlaylistId, [trackUri]);
}

export async function getPlaylistTrackUris(playlistId: string) {
  const token = await getValidOwnerAccessToken();
  const uris: string[] = [];
  let nextUrl: string | null = `${API_BASE}/playlists/${playlistId}/items?${new URLSearchParams(
    {
      fields: "items(item(uri),track(uri)),next",
      limit: "100",
    }
  ).toString()}`;

  while (nextUrl) {
    const res: Response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Playlist items could not be read: ${await res.text()}`);
    }
    const data = await res.json();
    for (const entry of data.items ?? []) {
      const item = entry.item ?? entry.track;
      if (item?.uri) uris.push(item.uri);
    }
    nextUrl = data.next;
  }

  return uris;
}

export async function getPlaylistTracks(playlistId: string): Promise<TrackResult[]> {
  const token = await getValidOwnerAccessToken();
  const tracks: TrackResult[] = [];
  let nextUrl: string | null = `${API_BASE}/playlists/${encodeURIComponent(playlistId)}/items?${new URLSearchParams(
    {
      fields:
        "items(item(id,uri,name,type,duration_ms,artists(id,name),album(name,images),external_urls),track(id,uri,name,type,duration_ms,artists(id,name),album(name,images),external_urls)),next",
      limit: "100",
    }
  ).toString()}`;

  while (nextUrl) {
    const res: Response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Playlist items could not be read: ${await res.text()}`);
    }

    const data = (await res.json()) as {
      items?: {
        item?: (SpotifyTrack & { type?: string }) | null;
        track?: (SpotifyTrack & { type?: string }) | null;
      }[];
      next?: string | null;
    };
    for (const entry of data.items ?? []) {
      const item = entry.item ?? entry.track;
      if (item?.id && item.uri && item.type !== "episode") {
        tracks.push(mapTrack(item));
      }
    }
    nextUrl = data.next ?? null;
  }

  return tracks;
}

export async function clearPlaylistItems(playlistId: string) {
  const uris = await getPlaylistTrackUris(playlistId);
  if (uris.length === 0) return;
  const token = await getValidOwnerAccessToken();

  for (let i = 0; i < uris.length; i += 100) {
    const chunk = uris.slice(i, i + 100);
    const res = await fetch(`${API_BASE}/playlists/${playlistId}/items`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: chunk.map((uri) => ({ uri })),
      }),
    });
    if (!res.ok) {
      throw new Error(`Playlist could not be cleared: ${await res.text()}`);
    }
  }
}

export async function getSpotifyProfile(accessToken: string) {
  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Profile lookup failed: ${await res.text()}`);
  return res.json() as Promise<{ id: string; display_name: string }>;
}

export async function getTracksMetadata(
  trackIds: string[]
): Promise<Map<string, TrackMetadata>> {
  const uniqueTrackIds = [...new Set(trackIds.filter(Boolean))];
  const metadata = new Map<string, TrackMetadata>();
  if (uniqueTrackIds.length === 0) return metadata;

  const token = await getClientCredentialsToken();
  const rawTracks: SpotifyTrack[] = [];

  for (let i = 0; i < uniqueTrackIds.length; i += 4) {
    const ids = uniqueTrackIds.slice(i, i + 4);
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const res = await fetch(`${API_BASE}/tracks/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error(`Spotify track metadata failed (${res.status}).`);
        }
        return (await res.json()) as SpotifyTrack;
      })
    );
    for (const result of results) {
      if (result.status === "fulfilled") rawTracks.push(result.value);
    }
  }

  const artistIds = [
    ...new Set(
      rawTracks.flatMap((track) =>
        (track.artists ?? []).map((artist) => artist.id).filter(Boolean)
      )
    ),
  ];
  const artistGenres = new Map<string, string[]>();

  for (let i = 0; i < artistIds.length; i += 4) {
    const ids = artistIds.slice(i, i + 4);
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const res = await fetch(`${API_BASE}/artists/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error(`Spotify artist metadata failed (${res.status}).`);
        }
        return (await res.json()) as SpotifyArtist;
      })
    );
    for (const result of results) {
      if (result.status === "fulfilled" && result.value.id) {
        artistGenres.set(result.value.id, result.value.genres ?? []);
      }
    }
  }

  for (const track of rawTracks) {
    const artists = (track.artists ?? []).map((artist) => ({
      id: artist.id,
      name: artist.name,
      genres: artistGenres.get(artist.id) ?? [],
    }));
    const genres: string[] = [
      ...new Set<string>(
        artists.flatMap((artist: { genres: string[] }) => artist.genres)
      ),
    ];

    metadata.set(track.id, {
      ...mapTrack(track),
      artists,
      genres,
    });
  }

  return metadata;
}
