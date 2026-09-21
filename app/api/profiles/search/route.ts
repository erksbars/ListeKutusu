import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";

export const dynamic = "force-dynamic";

function parseGenres(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").slice(0, 4)
      : [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (query.length < 2) return NextResponse.json({ users: [] });

  const viewerId = await getAuthenticatedAccountListId();
  const users = await prisma.userList.findMany({
    where: {
      status: "active",
      OR: [
        { ownerName: { contains: query } },
        { slug: { contains: query } },
        { favoriteGenres: { contains: query.replace(/^#/, "") } },
      ],
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
    take: 8,
    select: {
      id: true,
      ownerName: true,
      slug: true,
      bio: true,
      profileTheme: true,
      favoriteGenres: true,
      _count: { select: { followers: true, feedPosts: true } },
    },
  });

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id,
      ownerName: user.ownerName,
      slug: user.slug,
      bio: user.bio,
      profileTheme: user.profileTheme,
      favoriteGenres: parseGenres(user.favoriteGenres),
      followerCount: user._count.followers,
      postCount: user._count.feedPosts,
    })),
  });
}
