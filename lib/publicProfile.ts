import type { Prisma } from "@prisma/client";
import { getMediaShowcase } from "@/lib/mediaShowcase";
import { completedProfileGames } from "@/lib/profileGames";
import { calculateAchievements } from "@/lib/achievements";
import { prisma } from "@/lib/db";
import { normalizeProfileShowcase } from "@/lib/profileShowcase";
import { forumCategoryLabel } from "@/lib/forum";
import { normalizeProfileBanner, normalizeProfileDensity } from "@/lib/profileAppearance";
import { publicUniversity } from "@/lib/profileUniversity";

const PROFILE_POST_PAGE_SIZE = 12;

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

function sharedTags(source: string[], candidate: string[]) {
  const candidateKeys = new Set(candidate.map((item) => item.trim().toLocaleLowerCase("tr-TR")));
  return source.filter((item, index) => {
    const key = item.trim().toLocaleLowerCase("tr-TR");
    return key && candidateKeys.has(key) && source.findIndex(
      (sourceItem) => sourceItem.trim().toLocaleLowerCase("tr-TR") === key
    ) === index;
  });
}

type ProfileFeedPost = Prisma.FeedPostGetPayload<{
  include: { _count: { select: { likes: true; adds: true; comments: true } } };
}>;

function serializePost(post: ProfileFeedPost) {
  return {
    id: post.id,
    trackName: post.trackName,
    artistName: post.artistName,
    albumName: post.albumName,
    externalUrl: post.externalUrl,
    note: post.note,
    tags: parseTags(post.tags),
    createdAt: post.createdAt.toISOString(),
    likeCount: post._count?.likes ?? 0,
    addCount: post._count?.adds ?? 0,
    commentCount: post._count?.comments ?? 0,
  };
}

export async function getPublicProfile(slug: string, viewerId: string | null) {
  const profile = await prisma.userList.findFirst({
    where: { slug, status: "active" },
    select: {
      id: true,
      ownerName: true,
      playlistName: true,
      bio: true,
      profileStatus: true,
      universityName: true,
      universityPublic: true,
      pinnedFeedPostId: true,
      profileShowcase: true,
      favoriteGenres: true,
      profileTheme: true,
      profileDensity: true,
      profileBanner: true,
      featuredAchievementId: true,
      slug: true,
      createdAt: true,
      _count: {
        select: { followers: true, following: true, feedPosts: { where: { status: "published" } }, forumThreads: { where: { status: "published" } } },
      },
      followers: viewerId
        ? { where: { followerId: viewerId }, select: { id: true }, take: 1 }
        : false,
      blocksReceived: viewerId
        ? { where: { blockerId: viewerId }, select: { id: true }, take: 1 }
        : false,
      blocksInitiated: viewerId
        ? { where: { blockedId: viewerId }, select: { id: true }, take: 1 }
        : false,
      feedPosts: {
        where: { status: "published" },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: PROFILE_POST_PAGE_SIZE + 1,
        include: { _count: { select: { likes: true, adds: true, comments: { where: { status: "published" } } } } },
      },
    },
  });

  if (!profile) return null;

  const profileGenres = parseTags(profile.favoriteGenres);
  const [totalLikes, totalAdds, externalAdds, forumThreads, completedGameCount, recentGames, viewerProfile, discoveryCandidates, completedDuels] = await Promise.all([
    prisma.feedLike.count({
      where: { post: { authorId: profile.id, status: "published" } },
    }),
    prisma.feedListAdd.count({
      where: { post: { authorId: profile.id, status: "published" } },
    }),
    prisma.feedListAdd.count({
      where: {
        post: { authorId: profile.id, status: "published" },
        NOT: { userId: profile.id },
      },
    }),
    prisma.forumThread.findMany({
      where: { authorId: profile.id, status: "published" },
      orderBy: [{ lastActivityAt: "desc" }, { id: "desc" }],
      take: 3,
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        views: true,
        acceptedReplyId: true,
        createdAt: true,
        lastActivityAt: true,
        _count: { select: { replies: { where: { status: "published" } } } },
      },
    }),
    prisma.gameSession.count({
      where: completedProfileGames(profile.id, viewerId !== profile.id),
    }),
    prisma.gameSession.findMany({
      where: {
        ...completedProfileGames(profile.id, viewerId !== profile.id),
      },
      orderBy: [{ completedAt: "desc" }, { id: "desc" }],
      take: 6,
      select: {
        id: true,
        gameCode: true,
        winnerEntryId: true,
        completedAt: true,
        entries: {
          select: { id: true, trackName: true, artistName: true },
        },
      },
    }),
    viewerId && viewerId !== profile.id
      ? prisma.userList.findUnique({
          where: { id: viewerId },
          select: { favoriteGenres: true },
        })
      : null,
    profileGenres.length
      ? prisma.userList.findMany({
          where: {
            status: "active",
            id: { not: profile.id },
            favoriteGenres: { not: null },
            OR: profileGenres.map((genre) => ({
              favoriteGenres: { contains: JSON.stringify(genre) },
            })),
            ...(viewerId
              ? {
                  AND: [
                    { blocksInitiated: { none: { blockedId: viewerId } } },
                    { blocksReceived: { none: { blockerId: viewerId } } },
                  ],
                }
              : {}),
          },
          orderBy: { updatedAt: "desc" },
          take: 18,
          select: {
            id: true,
            ownerName: true,
            slug: true,
            bio: true,
            profileTheme: true,
            favoriteGenres: true,
            _count: { select: { followers: true, feedPosts: { where: { status: "published" } } } },
          },
        })
      : [],
    prisma.gameSession.count({ where: { ...completedProfileGames(profile.id), gameCode: "song-elimination" } }),
  ]);

  const blockedByMe = Boolean(profile.blocksReceived?.length);
  const hasBlockedMe = Boolean(profile.blocksInitiated?.length);
  const interactionBlocked = blockedByMe || hasBlockedMe;
  const mediaShowcaseEnabled = process.env.MEDIA_CATALOG_ENABLED === "true";
  const mediaShowcase = await getMediaShowcase(prisma, profile.id, mediaShowcaseEnabled, interactionBlocked);
  const recentVisiblePosts = interactionBlocked
    ? []
    : profile.feedPosts.slice(0, PROFILE_POST_PAGE_SIZE);
  const pinnedPost = !interactionBlocked && profile.pinnedFeedPostId && !recentVisiblePosts.some((post) => post.id === profile.pinnedFeedPostId)
    ? await prisma.feedPost.findFirst({
        where: { id: profile.pinnedFeedPostId, authorId: profile.id, status: "published" },
        include: { _count: { select: { likes: true, adds: true, comments: { where: { status: "published" } } } } },
      })
    : null;
  const visiblePosts = pinnedPost ? [pinnedPost, ...recentVisiblePosts] : recentVisiblePosts;
  const hasMorePosts = !interactionBlocked && profile.feedPosts.length > PROFILE_POST_PAGE_SIZE;
  const achievements = calculateAchievements({
    posts: profile._count.feedPosts,
    likes: totalLikes,
    adds: externalAdds,
    followers: profile._count.followers,
    games: completedDuels,
  });
  const viewerGenres = parseTags(viewerProfile?.favoriteGenres ?? null);
  const sharedGenres = interactionBlocked ? [] : sharedTags(profileGenres, viewerGenres);
  const relatedProfiles = interactionBlocked
    ? []
    : discoveryCandidates
        .map((candidate) => {
          const genres = sharedTags(profileGenres, parseTags(candidate.favoriteGenres));
          return {
            id: candidate.id,
            ownerName: candidate.ownerName,
            slug: candidate.slug,
            bio: candidate.bio,
            profileTheme: candidate.profileTheme,
            sharedGenres: genres,
            followerCount: candidate._count.followers,
            postCount: candidate._count.feedPosts,
          };
        })
        .filter((candidate) => candidate.sharedGenres.length > 0)
        .sort((left, right) =>
          right.sharedGenres.length - left.sharedGenres.length ||
          right.postCount - left.postCount ||
          right.followerCount - left.followerCount
        )
        .slice(0, 4);

  return {
    id: profile.id,
    ownerName: profile.ownerName,
    playlistName: profile.playlistName,
    bio: profile.bio,
    profileStatus: profile.profileStatus,
    universityName: publicUniversity(profile, interactionBlocked),
    pinnedFeedPostId: profile.pinnedFeedPostId,
    showcaseModules: normalizeProfileShowcase(profile.profileShowcase),
    mediaShowcaseEnabled,
    mediaShowcase,
    favoriteGenres: profileGenres,
    sharedGenres,
    relatedProfiles,
    profileTheme: profile.profileTheme,
    profileDensity: normalizeProfileDensity(profile.profileDensity),
    profileBanner: normalizeProfileBanner(profile.profileBanner),
    slug: profile.slug,
    createdAt: profile.createdAt.toISOString(),
    isMe: viewerId === profile.id,
    following: interactionBlocked ? false : Boolean(profile.followers?.length),
    blockedByMe,
    hasBlockedMe,
    followerCount: profile._count.followers,
    followingCount: profile._count.following,
    postCount: interactionBlocked ? 0 : profile._count.feedPosts,
    forumThreadCount: interactionBlocked ? 0 : profile._count.forumThreads,
    completedGameCount: interactionBlocked ? 0 : completedGameCount,
    totalLikes: interactionBlocked ? 0 : totalLikes,
    totalAdds: interactionBlocked ? 0 : totalAdds,
    achievements: interactionBlocked ? [] : achievements.unlocked,
    featuredAchievement: interactionBlocked
      ? null
      : achievements.unlocked.find((item) => item.id === profile.featuredAchievementId) ?? null,
    forumThreads: interactionBlocked
      ? []
      : forumThreads.map((thread) => ({
          id: thread.id,
          slug: thread.slug,
          title: thread.title,
          category: thread.category,
          categoryLabel: forumCategoryLabel(thread.category),
          views: thread.views,
          replyCount: thread._count.replies,
          solved: Boolean(thread.acceptedReplyId),
          lastActivityAt: thread.lastActivityAt.toISOString(),
          createdAt: thread.createdAt.toISOString(),
        })),
    games: interactionBlocked
      ? []
      : recentGames.map((game) => {
          const winner = game.entries.find((entry) => entry.id === game.winnerEntryId) ?? null;
          return {
            id: game.id,
            gameCode: game.gameCode,
            completedAt: game.completedAt?.toISOString() ?? profile.createdAt.toISOString(),
            winner,
          };
        }),
    nextAchievement:
      !interactionBlocked && viewerId === profile.id ? achievements.next : null,
    posts: visiblePosts.map(serializePost),
    nextPostCursor: hasMorePosts ? `offset:${PROFILE_POST_PAGE_SIZE}` : null,
  };
}

export async function getPublicProfilePosts(
  slug: string,
  viewerId: string | null,
  offset: number
) {
  const profile = await prisma.userList.findFirst({
    where: { slug, status: "active" },
    select: {
      id: true,
      blocksReceived: viewerId
        ? { where: { blockerId: viewerId }, select: { id: true }, take: 1 }
        : false,
      blocksInitiated: viewerId
        ? { where: { blockedId: viewerId }, select: { id: true }, take: 1 }
        : false,
    },
  });

  if (!profile) return null;

  const interactionBlocked = Boolean(
    profile.blocksReceived?.length || profile.blocksInitiated?.length
  );
  if (interactionBlocked) return { posts: [], nextCursor: null };

  const posts = await prisma.feedPost.findMany({
    where: { authorId: profile.id, status: "published" },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: offset,
    take: PROFILE_POST_PAGE_SIZE + 1,
    include: { _count: { select: { likes: true, adds: true, comments: { where: { status: "published" } } } } },
  });
  const hasMore = posts.length > PROFILE_POST_PAGE_SIZE;

  return {
    posts: posts.slice(0, PROFILE_POST_PAGE_SIZE).map(serializePost),
    nextCursor: hasMore ? `offset:${offset + PROFILE_POST_PAGE_SIZE}` : null,
  };
}
