import type { PrismaClient } from "@prisma/client";

export type GameTrackCandidate = {
  trackId: string;
  trackName: string;
  artistName: string;
  externalUrl: string | null;
  source: "list" | "feed";
};

export async function getPersonalGameCandidates(prisma: PrismaClient, userId: string) {
  const [suggestions, posts] = await Promise.all([
    prisma.suggestion.findMany({
      where: { listId: userId, status: "approved" },
      orderBy: [{ decidedAt: "desc" }, { createdAt: "desc" }],
      take: 100,
      select: { trackId: true, trackName: true, artistName: true },
    }),
    prisma.feedPost.findMany({
      where: { authorId: userId, status: "published" },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { trackId: true, trackName: true, artistName: true, externalUrl: true },
    }),
  ]);

  const unique = new Map<string, GameTrackCandidate>();
  for (const track of suggestions) {
    unique.set(track.trackId, {
      ...track,
      externalUrl: `https://open.spotify.com/track/${track.trackId}`,
      source: "list",
    });
  }
  for (const track of posts) {
    if (!unique.has(track.trackId)) unique.set(track.trackId, { ...track, source: "feed" });
  }
  return [...unique.values()];
}
