import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forumCategoryLabel } from "@/lib/forum";

export const dynamic = "force-dynamic";

export async function GET() {
  const candidates = await prisma.forumThread.findMany({
    where: { status: "published" },
    orderBy: { lastActivityAt: "desc" },
    take: 12,
    select: {
      id: true,
      slug: true,
      category: true,
      title: true,
      views: true,
      lastActivityAt: true,
      acceptedReplyId: true,
      author: { select: { ownerName: true } },
      _count: { select: { replies: { where: { status: "published" } } } },
    },
  });

  const now = Date.now();
  const highlights = candidates
    .map((thread) => ({
      ...thread,
      score:
        thread._count.replies * 8 +
        Math.min(thread.views, 120) / 6 +
        Math.max(0, 96 - (now - thread.lastActivityAt.getTime()) / 3_600_000) / 16,
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map((thread) => ({
      id: thread.id,
      slug: thread.slug,
      title: thread.title,
      category: forumCategoryLabel(thread.category),
      replyCount: thread._count.replies,
      solved: Boolean(thread.acceptedReplyId),
      authorName: thread.author.ownerName,
      lastActivityAt: thread.lastActivityAt,
    }));

  return NextResponse.json(
    { highlights },
    { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } }
  );
}
