import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAdminAuditLog } from "@/lib/adminAudit";
import { getModerationActor } from "@/lib/moderatorAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await getModerationActor();
  if (!actor) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  const requestedStatus = req.nextUrl.searchParams.get("status") || "pending";
  const status = ["pending", "published", "rejected", "removed"].includes(requestedStatus)
    ? requestedStatus
    : "pending";

  const [threads, pending, published, rejected, removed] = await Promise.all([
    prisma.forumThread.findMany({
      where: { status },
      orderBy: status === "pending" ? { createdAt: "asc" } : { lastActivityAt: "desc" },
      take: 100,
      include: {
        author: { select: { ownerName: true, slug: true } },
        _count: { select: { replies: { where: { status: "published" } } } },
        replies: {
          where: { status: "published" },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { author: { select: { ownerName: true, slug: true } } },
        },
      },
    }),
    prisma.forumThread.count({ where: { status: "pending" } }),
    prisma.forumThread.count({ where: { status: "published" } }),
    prisma.forumThread.count({ where: { status: "rejected" } }),
    prisma.forumThread.count({ where: { status: "removed" } }),
  ]);

  return NextResponse.json({ threads, stats: { pending, published, rejected, removed }, actor });
}

export async function PATCH(req: NextRequest) {
  const actor = await getModerationActor();
  if (!actor) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const action = body?.action;
  if (!id || !["approve", "reject", "remove", "lock", "unlock", "remove-reply"].includes(action)) {
    return NextResponse.json({ error: "Geçersiz moderasyon isteği." }, { status: 400 });
  }

  const now = new Date();
  if (action === "remove-reply") {
    const reply = await prisma.forumReply.findFirst({
      where: { id, status: "published" },
      select: {
        id: true,
        threadId: true,
        author: { select: { ownerName: true } },
        thread: { select: { acceptedReplyId: true, title: true } },
      },
    });
    if (!reply) return NextResponse.json({ error: "Yanıt bulunamadı." }, { status: 404 });
    await prisma.$transaction([
      prisma.forumReply.update({ where: { id }, data: { status: "removed" } }),
      ...(reply.thread.acceptedReplyId === id
        ? [
            prisma.forumThread.update({
              where: { id: reply.threadId },
              data: { acceptedReplyId: null, acceptedAt: null },
            }),
            prisma.notification.deleteMany({
              where: { forumThreadId: reply.threadId, type: "forum_solution" },
            }),
          ]
        : []),
    ]);
    await writeAdminAuditLog({
      action: "forum.remove_reply",
      targetType: "forum_reply",
      targetId: reply.id,
      targetLabel: reply.thread.title,
      metadata: {
        threadId: reply.threadId,
        author: reply.author.ownerName,
        actorKind: actor.kind,
        actorId: actor.id,
        actorLabel: actor.label,
      },
    });
    return NextResponse.json({ ok: true });
  }

  const thread = await prisma.forumThread.findUnique({ where: { id }, select: { id: true, title: true } });
  if (!thread) return NextResponse.json({ error: "Konu bulunamadı." }, { status: 404 });

  const data =
    action === "approve"
      ? { status: "published", approvedAt: now, lastActivityAt: now }
      : action === "reject"
        ? { status: "rejected" }
        : action === "remove"
          ? { status: "removed" }
          : action === "lock"
            ? { lockedAt: now }
            : { lockedAt: null };

  await prisma.forumThread.update({ where: { id }, data });
  await writeAdminAuditLog({
    action: `forum.${action}`,
    targetType: "forum_thread",
    targetId: thread.id,
    targetLabel: thread.title,
    metadata: { actorKind: actor.kind, actorId: actor.id, actorLabel: actor.label },
  });
  return NextResponse.json({ ok: true });
}
