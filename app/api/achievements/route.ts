import { NextResponse } from "next/server";
import { calculateAchievements } from "@/lib/achievements";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getAuthenticatedAccountListId();
  if (!userId) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const [posts, likes, adds, followers, games] = await Promise.all([
    prisma.feedPost.count({ where: { authorId: userId, status: "published" } }),
    prisma.feedLike.count({ where: { post: { authorId: userId, status: "published" } } }),
    prisma.feedListAdd.count({
      where: {
        post: { authorId: userId, status: "published" },
        NOT: { userId },
      },
    }),
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.gameSession.count({ where: { ownerId: userId, status: "completed" } }),
  ]);

  return NextResponse.json({
    userId,
    metrics: { posts, likes, adds, followers, games },
    ...calculateAchievements({ posts, likes, adds, followers, games }),
  });
}
