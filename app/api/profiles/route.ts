import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";
import type { Prisma } from "@prisma/client";
import { calculateAchievements } from "@/lib/achievements";

export const dynamic = "force-dynamic";

function parseTags(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

type ProfileFeedPost = Prisma.FeedPostGetPayload<{
  include: { _count: { select: { likes: true; adds: true } } };
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
    createdAt: post.createdAt,
    likeCount: post._count?.likes ?? 0,
    addCount: post._count?.adds ?? 0,
  };
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Profil bilgisi eksik." }, { status: 400 });
  }

  const viewerId = await getAuthenticatedAccountListId();
  const profile = await prisma.userList.findFirst({
    where: { slug, status: "active" },
    select: {
      id: true,
      ownerName: true,
      playlistName: true,
      bio: true,
      favoriteGenres: true,
      profileTheme: true,
      slug: true,
      createdAt: true,
      _count: {
        select: {
          followers: true,
          following: true,
          feedPosts: true,
        },
      },
      followers: viewerId
        ? {
            where: { followerId: viewerId },
            select: { id: true },
            take: 1,
          }
        : false,
      blocksReceived: viewerId
        ? { where: { blockerId: viewerId }, select: { id: true }, take: 1 }
        : false,
      blocksInitiated: viewerId
        ? { where: { blockedId: viewerId }, select: { id: true }, take: 1 }
        : false,
      feedPosts: {
        where: { status: "published" },
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          _count: { select: { likes: true, adds: true } },
        },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
  }

  const [totalLikes, totalAdds, externalAdds] = await Promise.all([
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
  ]);
  const blockedByMe = Boolean(profile.blocksReceived?.length);
  const hasBlockedMe = Boolean(profile.blocksInitiated?.length);
  const interactionBlocked = blockedByMe || hasBlockedMe;
  const achievements = calculateAchievements({
    posts: profile._count.feedPosts,
    likes: totalLikes,
    adds: externalAdds,
    followers: profile._count.followers,
  });

  return NextResponse.json({
    profile: {
      id: profile.id,
      ownerName: profile.ownerName,
      playlistName: profile.playlistName,
      bio: profile.bio,
      favoriteGenres: parseTags(profile.favoriteGenres),
      profileTheme: profile.profileTheme,
      slug: profile.slug,
      createdAt: profile.createdAt,
      isMe: viewerId === profile.id,
      following: interactionBlocked ? false : Boolean(profile.followers?.length),
      blockedByMe,
      hasBlockedMe,
      followerCount: profile._count.followers,
      followingCount: profile._count.following,
      postCount: interactionBlocked ? 0 : profile._count.feedPosts,
      totalLikes: interactionBlocked ? 0 : totalLikes,
      totalAdds: interactionBlocked ? 0 : totalAdds,
      achievements: interactionBlocked ? [] : achievements.unlocked,
      nextAchievement:
        !interactionBlocked && viewerId === profile.id ? achievements.next : null,
      posts: interactionBlocked ? [] : profile.feedPosts.map(serializePost),
    },
  });
}
