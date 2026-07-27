import { NextResponse } from "next/server";
import { buildDailyGoals, calculateActivityStreak, istanbulDayStart } from "@/lib/dailyGoals";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getAuthenticatedAccountListId();
  if (!userId) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const now = new Date();
  const dayStart = istanbulDayStart(now);
  const historyStart = new Date(dayStart.getTime() - 60 * 86_400_000);
  const [shares, likes, adds, follows, postDates, likeDates, addDates, followDates] =
    await Promise.all([
      prisma.feedPost.count({
        where: { authorId: userId, status: "published", createdAt: { gte: dayStart } },
      }),
      prisma.feedLike.count({ where: { userId, createdAt: { gte: dayStart } } }),
      prisma.feedListAdd.count({ where: { userId, createdAt: { gte: dayStart } } }),
      prisma.follow.count({ where: { followerId: userId, createdAt: { gte: dayStart } } }),
      prisma.feedPost.findMany({
        where: { authorId: userId, status: "published", createdAt: { gte: historyStart } },
        select: { createdAt: true },
      }),
      prisma.feedLike.findMany({
        where: { userId, createdAt: { gte: historyStart } },
        select: { createdAt: true },
      }),
      prisma.feedListAdd.findMany({
        where: { userId, createdAt: { gte: historyStart } },
        select: { createdAt: true },
      }),
      prisma.follow.findMany({
        where: { followerId: userId, createdAt: { gte: historyStart } },
        select: { createdAt: true },
      }),
    ]);

  const counts = { shares, likes, adds, follows };
  const activityDates = [...postDates, ...likeDates, ...addDates, ...followDates].map(
    (item) => item.createdAt
  );

  return NextResponse.json({
    counts,
    streak: calculateActivityStreak(activityDates, now),
    dayStartsAt: dayStart,
    ...buildDailyGoals(counts),
  });
}
