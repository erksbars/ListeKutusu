import type { Prisma } from "@prisma/client";

export function musicFeedInclude(viewerId: string | null) {
  const safeViewerId = viewerId ?? "__anonymous__";
  return {
    author: { select: { id: true, ownerName: true, playlistName: true, slug: true, followers: { where: { followerId: safeViewerId }, select: { id: true }, take: 1 } } },
    _count: { select: { likes: true, adds: true, comments: { where: { status: "published" } } } },
    likes: { where: { userId: safeViewerId }, select: { id: true }, take: 1 },
    adds: { where: { userId: safeViewerId }, select: { id: true }, take: 1 },
    saves: { where: { userId: safeViewerId }, select: { id: true }, take: 1 },
  } as const;
}
type MusicRow = Prisma.FeedPostGetPayload<{ include: ReturnType<typeof musicFeedInclude> }>;
export function serializeMusicFeedPost(post: MusicRow, viewerId: string | null, recommendationReason: string | null = null) {
  let tags: string[] = [];
  try { const parsed = JSON.parse(post.tags ?? "[]"); if (Array.isArray(parsed)) tags = parsed.filter((tag): tag is string => typeof tag === "string"); } catch { /* Legacy malformed tags are empty. */ }
  return {
    id: post.id, trackId: post.trackId, trackName: post.trackName, artistName: post.artistName, albumName: post.albumName, durationMs: post.durationMs,
    externalUrl: post.externalUrl, source: post.source, note: post.note, tags, createdAt: post.createdAt.toISOString(),
    likeCount: post._count.likes, addCount: post._count.adds, commentCount: post._count.comments,
    likedByMe: Boolean(post.likes.length), addedByMe: Boolean(post.adds.length), savedByMe: Boolean(post.saves.length), followingAuthor: Boolean(post.author.followers.length),
    isMine: post.author.id === viewerId, recommendationReason,
    author: { id: post.author.id, ownerName: post.author.ownerName, playlistName: post.author.playlistName, slug: post.author.slug },
  };
}
