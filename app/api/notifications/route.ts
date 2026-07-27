import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getAuthenticatedAccountListId();
  if (!userId) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const [notifications, unreadCount, account] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        actor: { select: { id: true, ownerName: true, slug: true, profileTheme: true } },
        post: { select: { id: true, trackName: true, artistName: true } },
        forumThread: { select: { slug: true, title: true } },
      },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
    prisma.userList.findUnique({
      where: { id: userId },
      select: { notifyFollows: true, notifyLikes: true, notifyAdds: true },
    }),
  ]);

  return NextResponse.json({
    notifications,
    unreadCount,
    preferences: {
      follows: account?.notifyFollows ?? true,
      likes: account?.notifyLikes ?? true,
      adds: account?.notifyAdds ?? true,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const userId = await getAuthenticatedAccountListId();
  if (!userId) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (body?.preferences && typeof body.preferences === "object") {
    const follows = body.preferences.follows;
    const likes = body.preferences.likes;
    const adds = body.preferences.adds;
    if ([follows, likes, adds].some((value) => typeof value !== "boolean")) {
      return NextResponse.json({ error: "Bildirim tercihleri geçersiz." }, { status: 400 });
    }
    await prisma.userList.update({
      where: { id: userId },
      data: { notifyFollows: follows, notifyLikes: likes, notifyAdds: adds },
    });
    return NextResponse.json({ preferences: { follows, likes, adds } });
  }
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const ids = Array.isArray(body?.ids)
    ? body.ids
        .filter((value: unknown): value is string => typeof value === "string")
        .map((value: string) => value.trim())
        .filter(Boolean)
        .slice(0, 30)
    : [];
  const where = ids.length
    ? { id: { in: ids }, userId, readAt: null }
    : id
      ? { id, userId, readAt: null }
      : { userId, readAt: null };
  const result = await prisma.notification.updateMany({
    where,
    data: { readAt: new Date() },
  });

  return NextResponse.json({ updated: result.count });
}
