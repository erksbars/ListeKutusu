import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forumCategoryGroup, forumCategoryLabel } from "@/lib/forum";
import { getAuthenticatedAccountListId, isOwnerAuthenticated } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const [viewerId, ownerAuthenticated] = await Promise.all([
    getAuthenticatedAccountListId(),
    isOwnerAuthenticated(),
  ]);

  const thread = await prisma.forumThread.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, ownerName: true, slug: true, profileTheme: true, createdAt: true } },
      replies: {
        where: { status: "published" },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, ownerName: true, slug: true, profileTheme: true, createdAt: true } } },
      },
    },
  });

  if (!thread || (thread.status !== "published" && thread.authorId !== viewerId && !ownerAuthenticated)) {
    return NextResponse.json({ error: "Konu bulunamadı." }, { status: 404 });
  }

  const viewedThreadIds = (req.cookies.get("forum_viewed")?.value || "")
    .split(".")
    .filter(Boolean)
    .slice(-29);
  const shouldCountView = thread.status === "published" && !viewedThreadIds.includes(thread.id);

  if (shouldCountView) {
    await prisma.forumThread.update({ where: { id: thread.id }, data: { views: { increment: 1 } } });
  }

  const response = NextResponse.json({
    thread: {
      ...thread,
      views: thread.views + (shouldCountView ? 1 : 0),
      categoryLabel: forumCategoryLabel(thread.category),
      categoryGroupLabel: forumCategoryGroup(thread.category).label,
      locked: Boolean(thread.lockedAt),
      isAuthor: thread.authorId === viewerId,
      canReply: Boolean(viewerId && thread.status === "published" && !thread.lockedAt),
    },
    authenticated: Boolean(viewerId),
    viewerId,
  });
  if (shouldCountView) {
    response.cookies.set("forum_viewed", [...viewedThreadIds, thread.id].join("."), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 12 * 60 * 60,
      path: "/",
    });
  }
  return response;
}
