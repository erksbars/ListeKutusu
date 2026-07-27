import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { getAuthenticatedAccountListId } from "@/lib/session";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedAccountListId();
  if (!userId) {
    return NextResponse.json(
      { error: "Çözüm işaretlemek için giriş yapmalısın." },
      { status: 401 }
    );
  }

  const limited = checkRateLimit(req, {
    name: "forum-accept-reply",
    identifier: userId,
    limit: 20,
    windowMs: 10 * 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok hızlı işlem yapıyorsun. Biraz sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const { id } = await context.params;
  const reply = await prisma.forumReply.findFirst({
    where: { id, status: "published" },
    select: {
      id: true,
      authorId: true,
      thread: {
        select: {
          id: true,
          authorId: true,
          status: true,
          acceptedReplyId: true,
        },
      },
    },
  });

  if (!reply || reply.thread.status !== "published") {
    return NextResponse.json({ error: "Yanıt bulunamadı." }, { status: 404 });
  }
  if (reply.thread.authorId !== userId) {
    return NextResponse.json(
      { error: "Yalnızca konu sahibi çözümü belirleyebilir." },
      { status: 403 }
    );
  }
  if (reply.authorId === userId) {
    return NextResponse.json(
      { error: "Kendi yanıtını çözüm olarak işaretleyemezsin." },
      { status: 400 }
    );
  }

  const accepted = reply.thread.acceptedReplyId !== reply.id;
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.forumThread.update({
      where: { id: reply.thread.id },
      data: {
        acceptedReplyId: accepted ? reply.id : null,
        acceptedAt: accepted ? now : null,
      },
    });
    await tx.notification.deleteMany({
      where: {
        forumThreadId: reply.thread.id,
        actorId: userId,
        type: "forum_solution",
      },
    });
    if (accepted) {
      await tx.notification.create({
        data: {
          userId: reply.authorId,
          actorId: userId,
          forumThreadId: reply.thread.id,
          type: "forum_solution",
        },
      });
    }
  });

  return NextResponse.json({
    accepted,
    acceptedReplyId: accepted ? reply.id : null,
    acceptedAt: accepted ? now : null,
  });
}
