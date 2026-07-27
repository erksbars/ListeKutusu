import { NextResponse } from "next/server";
import { buildDiscoverData } from "@/lib/discover";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";

export const dynamic = "force-dynamic";

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

export async function GET() {
  const viewerId = await getAuthenticatedAccountListId();
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [posts, accountLists] = await Promise.all([
    prisma.feedPost.findMany({
      where: {
        status: "published",
        createdAt: { gte: since },
        ...(viewerId
          ? {
              AND: [
                { author: { blocksInitiated: { none: { blockedId: viewerId } } } },
                { author: { blocksReceived: { none: { blockerId: viewerId } } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 250,
      include: {
        author: {
          select: {
            id: true,
            ownerName: true,
            slug: true,
            profileTheme: true,
          },
        },
        _count: { select: { likes: true, adds: true } },
        likes: {
          where: { userId: viewerId ?? "__anonymous__" },
          select: { id: true },
        },
        adds: {
          where: { userId: viewerId ?? "__anonymous__" },
          select: { id: true },
        },
      },
    }),
    prisma.userList.findMany({
      where: {
        status: "active",
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
      take: 100,
      select: {
        id: true,
        ownerName: true,
        playlistName: true,
        slug: true,
        profileTheme: true,
        _count: {
          select: { followers: true, feedPosts: true, suggestions: true },
        },
      },
    }),
  ]);

  const data = buildDiscoverData(
    posts.map((post) => ({
      id: post.id,
      trackId: post.trackId,
      trackName: post.trackName,
      artistName: post.artistName,
      externalUrl: post.externalUrl,
      tags: parseTags(post.tags),
      createdAt: post.createdAt,
      likeCount: post._count.likes,
      addCount: post._count.adds,
      likedByMe: post.likes.length > 0,
      addedByMe: post.adds.length > 0,
      author: post.author,
    }))
  );

  const lists = accountLists
    .filter((list) => Boolean(list.playlistName?.trim()))
    .map((list) => ({
      id: list.id,
      name: list.playlistName!.trim(),
      ownerName: list.ownerName,
      slug: list.slug,
      profileTheme: list.profileTheme,
      followers: list._count.followers,
      posts: list._count.feedPosts,
      tracks: list._count.suggestions,
      score: list._count.followers * 4 + list._count.feedPosts * 2 + list._count.suggestions,
    }))
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name, "tr"))
    .slice(0, 40);
  const people = accountLists
    .map((list) => ({
      id: list.id,
      ownerName: list.ownerName,
      slug: list.slug,
      profileTheme: list.profileTheme,
      posts: list._count.feedPosts,
      followers: list._count.followers,
    }))
    .sort((left, right) => right.followers - left.followers || right.posts - left.posts || left.ownerName.localeCompare(right.ownerName, "tr"))
    .slice(0, 100);

  return NextResponse.json({
    ...data,
    people,
    lists,
    totals: { ...data.totals, lists: lists.length },
  }, {
    headers: { "Cache-Control": viewerId ? "private, no-store" : "public, max-age=30" },
  });
}
