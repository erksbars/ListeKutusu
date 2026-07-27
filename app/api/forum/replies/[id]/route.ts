import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const authorId = await getAuthenticatedAccountListId();
  if (!authorId) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  const { id } = await context.params;

  const reply = await prisma.forumReply.findFirst({
    where: { id, authorId, status: "published" },
    select: { id: true, threadId: true, thread: { select: { acceptedReplyId: true } } },
  });
  if (!reply) return NextResponse.json({ error: "Yanıt bulunamadı veya yetkin yok." }, { status: 404 });

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
  return NextResponse.json({ removed: true });
}
