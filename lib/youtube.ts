import type { PrismaClient } from "@prisma/client";

type SearchResponse = {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: { channelTitle?: string; title?: string };
  }>;
};

type VideosResponse = {
  items?: Array<{
    id?: string;
    snippet?: { channelTitle?: string; title?: string };
    status?: { embeddable?: boolean; privacyStatus?: string };
    contentDetails?: { regionRestriction?: { blocked?: string[] } };
  }>;
};

function isVideoId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{11}$/.test(value);
}

function normalizeYouTubeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getYouTubeSearchTrackName(trackName: string) {
  return trackName
    .replace(/\s+-\s+(?:\d{4}\s+-\s+)?(?:remaster(?:ed)?|radio edit|single version|album version).*$/i, "")
    .replace(/\s*\((?:\d{4}\s+)?(?:remaster(?:ed)?|radio edit|single version|album version)[^)]*\)\s*$/i, "")
    .trim();
}

export function scoreYouTubeCandidate(
  candidate: { channelTitle?: string; title?: string },
  trackName: string,
  artistName: string,
) {
  const channel = normalizeYouTubeText(candidate.channelTitle ?? "");
  const title = normalizeYouTubeText(candidate.title ?? "");
  const artist = normalizeYouTubeText(artistName);
  const track = normalizeYouTubeText(trackName);
  const compactChannel = channel.replace(/\s+/g, "");
  const compactArtist = artist.replace(/\s+/g, "");
  let score = 0;

  if (channel === artist) score += 240;
  else if (compactChannel === `${compactArtist}vevo`) score += 220;
  else if (channel === `${artist} official` || channel === `official ${artist}`) score += 210;
  else if (channel === `${artist} topic`) score += 190;

  if (title.includes(artist)) score += 45;
  if (title.includes(track)) score += 65;
  if (/\bofficial\b/.test(title)) score += 38;
  if (/\b(audio|video)\b/.test(title)) score += 12;
  if (/\b(cover|karaoke|reaction|tutorial|lesson|tribute|remix|lyric|lyrics)\b/.test(title)) score -= 180;
  if (/\b(nightcore|slowed|reverb|sped up)\b/.test(title)) score -= 120;

  return score;
}

async function findPlayableSearchResult(query: string, apiKey: string, trackName: string, artistName: string) {
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoEmbeddable: "true",
    safeSearch: "moderate",
    maxResults: "15",
    q: query,
    key: apiKey,
  });
  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });
  if (!response.ok) return undefined;
  const data = await response.json() as SearchResponse;
  const candidateIds = [...(data.items ?? [])]
    .map((item) => ({
      item,
      score: scoreYouTubeCandidate(item.snippet ?? {}, trackName, artistName),
    }))
    .filter((candidate) => candidate.score >= 145)
    .sort((left, right) => right.score - left.score)
    .map(({ item }) => item)
    .map((item) => item.id?.videoId)
    .filter(isVideoId);
  if (candidateIds.length === 0) return null;
  const videoParams = new URLSearchParams({
    part: "status,contentDetails",
    id: candidateIds.join(","),
    key: apiKey,
  });
  const videoResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?${videoParams}`, {
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });
  if (!videoResponse.ok) return undefined;
  const videoData = await videoResponse.json() as VideosResponse;
  const byId = new Map((videoData.items ?? []).filter((item) => isVideoId(item.id)).map((item) => [item.id!, item]));
  for (const candidateId of candidateIds) {
    const candidate = byId.get(candidateId);
    if (candidate?.status?.embeddable !== true
      || candidate.status?.privacyStatus !== "public"
      || candidate.contentDetails?.regionRestriction?.blocked?.includes("TR")) continue;
    return candidateId;
  }
  return null;
}

async function searchTrackVideo(trackName: string, artistName: string) {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) return null;
  const searchTrackName = getYouTubeSearchTrackName(trackName);
  for (const query of [
    `"${artistName}" "${searchTrackName}" official`,
    `${artistName} ${searchTrackName} official audio`,
    `${artistName} ${searchTrackName} official video`,
    `${artistName} ${searchTrackName}`,
  ]) {
    const result = await findPlayableSearchResult(query, apiKey, searchTrackName, artistName);
    if (result === undefined) return undefined;
    if (result) return result;
  }
  return null;
}

async function getTrustedCachedVideos(
  cachedRows: Array<{ trackId: string; youtubeVideoId: string | null }>,
  tracks: Array<{ trackId: string; trackName: string; artistName: string }>,
) {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  const uniqueIds = [...new Set(cachedRows.map((entry) => entry.youtubeVideoId).filter(isVideoId))];
  if (!apiKey || uniqueIds.length === 0) return new Map<string, string>();
  const videoItems: NonNullable<VideosResponse["items"]> = [];
  for (let offset = 0; offset < uniqueIds.length; offset += 50) {
    const params = new URLSearchParams({
      part: "snippet,status,contentDetails",
      id: uniqueIds.slice(offset, offset + 50).join(","),
      key: apiKey,
    });
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`, {
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!response.ok) continue;
    const data = await response.json() as VideosResponse;
    videoItems.push(...(data.items ?? []));
  }
  const candidatesById = new Map(videoItems.filter((item) => (
    isVideoId(item.id)
    && item.status?.embeddable === true
    && item.status?.privacyStatus === "public"
    && !item.contentDetails?.regionRestriction?.blocked?.includes("TR")
  )).map((item) => [item.id!, item]));
  const playableIds = new Set(candidatesById.keys());
  const trackMetadata = new Map(tracks.map((track) => [track.trackId, track]));
  const trusted = new Map<string, { videoId: string; score: number }>();

  for (const row of cachedRows) {
    if (!isVideoId(row.youtubeVideoId) || !playableIds.has(row.youtubeVideoId)) continue;
    const video = candidatesById.get(row.youtubeVideoId);
    const track = trackMetadata.get(row.trackId);
    if (!video || !track) continue;
    const score = scoreYouTubeCandidate(
      video.snippet ?? {},
      getYouTubeSearchTrackName(track.trackName),
      track.artistName,
    );
    if (score < 145 || score <= (trusted.get(row.trackId)?.score ?? -Infinity)) continue;
    trusted.set(row.trackId, { videoId: row.youtubeVideoId, score });
  }

  return new Map([...trusted].map(([trackId, candidate]) => [trackId, candidate.videoId]));
}

export async function resolveGameEntryVideos(prisma: PrismaClient, entryIds: string[], options?: { force?: boolean }) {
  if (!process.env.YOUTUBE_API_KEY || entryIds.length === 0) return;
  const entries = await prisma.gameEntry.findMany({
    where: { id: { in: entryIds }, ...(options?.force ? {} : { youtubeVideoId: null }) },
    select: { id: true, trackId: true, trackName: true, artistName: true, youtubeVideoId: true },
  });
  if (entries.length === 0) return;
  const cachedRows = await prisma.gameEntry.findMany({
    where: { trackId: { in: entries.map((entry) => entry.trackId) }, youtubeVideoId: { not: null } },
    select: { trackId: true, youtubeVideoId: true },
  });
  const cached = await getTrustedCachedVideos(cachedRows, entries);
  const uniqueTracks = [...new Map(entries.map((entry) => [entry.trackId, entry])).values()];
  const resolvedTracks = await Promise.all(uniqueTracks.map(async (entry) => {
    const cachedVideo = cached.get(entry.trackId);
    if (cachedVideo) return { trackId: entry.trackId, videoId: cachedVideo };
    const searchedVideo = await searchTrackVideo(entry.trackName, entry.artistName).catch(() => undefined);
    return {
      trackId: entry.trackId,
      videoId: searchedVideo === undefined ? entry.youtubeVideoId : searchedVideo,
    };
  }));
  const videosByTrack = new Map(resolvedTracks.map((entry) => [entry.trackId, entry.videoId]));
  await Promise.all(entries.map((entry) => (
    prisma.gameEntry.update({
      where: { id: entry.id },
      data: { youtubeVideoId: videosByTrack.get(entry.trackId) ?? null },
    })
  )));
}

export function getYouTubeSearchUrl(trackName: string, artistName: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artistName} ${trackName}`)}`;
}
