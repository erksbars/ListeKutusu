import { prisma } from "@/lib/db";

function parseTags(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export async function getFeedPostDetail(postId: string, viewerId: string | null) {
  const safeViewerId = viewerId ?? "__anonymous__";
  const post = await prisma.feedPost.findFirst({
    where: {
      id: postId,
      status: "published",
      author: {
        status: "active",
        ...(viewerId
          ? {
              blocksInitiated: { none: { blockedId: viewerId } },
              blocksReceived: { none: { blockerId: viewerId } },
            }
          : {}),
      },
      ...(viewerId ? { hides: { none: { userId: viewerId } } } : {}),
    },
    include: {
      author: {
        select: {
          id: true,
          ownerName: true,
          slug: true,
          bio: true,
          playlistName: true,
          profileTheme: true,
          followers: {
            where: { followerId: safeViewerId },
            select: { id: true },
            take: 1,
          },
          _count: { select: { followers: true, feedPosts: true } },
        },
      },
      _count: { select: { likes: true, adds: true } },
      likes: {
        where: { userId: safeViewerId },
        select: { id: true },
        take: 1,
      },
      adds: {
        where: { userId: safeViewerId },
        select: { id: true },
        take: 1,
      },
      saves: {
        where: { userId: safeViewerId },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!post) return null;

  return {
    id: post.id,
    trackName: post.trackName,
    artistName: post.artistName,
    albumName: post.albumName,
    externalUrl: post.externalUrl,
    note: post.note,
    tags: parseTags(post.tags),
    createdAt: post.createdAt.toISOString(),
    likeCount: post._count.likes,
    addCount: post._count.adds,
    likedByMe: Boolean(post.likes.length),
    addedByMe: Boolean(post.adds.length),
    savedByMe: Boolean(post.saves.length),
    followingAuthor: Boolean(post.author.followers.length),
    isMine: post.authorId === viewerId,
    author: {
      id: post.author.id,
      ownerName: post.author.ownerName,
      slug: post.author.slug,
      bio: post.author.bio,
      playlistName: post.author.playlistName,
      profileTheme: post.author.profileTheme,
      followerCount: post.author._count.followers,
      postCount: post.author._count.feedPosts,
    },
  };
}

export type FeedPostDetail = NonNullable<Awaited<ReturnType<typeof getFeedPostDetail>>>;
