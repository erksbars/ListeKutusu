import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { validateForumReply } from "@/lib/forum";

export async function POST(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const authorId = await getAuthenticatedAccountListId();
  if (!authorId) return NextResponse.json({ error: "Yanıt vermek için giriş yapmalısın." }, { status: 401 });

  const limited = checkRateLimit(req, {
    name: "forum-reply-create",
    identifier: authorId,
    limit: 20,
    windowMs: 10 * 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok hızlı yanıt gönderiyorsun. Biraz sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const { slug } = await context.params;
  const body = await req.json().catch(() => null);
  const replyBody = typeof body?.body === "string" ? body.body.trim() : "";
  const validationError = validateForumReply(replyBody);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const thread = await prisma.forumThread.findFirst({
    where: { slug, status: "published" },
    select: { id: true, authorId: true, lockedAt: true },
  });
  if (!thread) return NextResponse.json({ error: "Konu bulunamadı." }, { status: 404 });
  if (thread.lockedAt) return NextResponse.json({ error: "Bu konu yeni yanıtlara kapatıldı." }, { status: 423 });

  const now = new Date();
  const reply = await prisma.$transaction(async (tx) => {
    const created = await tx.forumReply.create({
      data: { threadId: thread.id, authorId, body: replyBody },
      include: { author: { select: { id: true, ownerName: true, slug: true, profileTheme: true, createdAt: true } } },
    });
    await tx.forumThread.update({ where: { id: thread.id }, data: { lastActivityAt: now } });
    if (thread.authorId !== authorId) {
      await tx.notification.create({
        data: { userId: thread.authorId, actorId: authorId, forumThreadId: thread.id, type: "forum_reply" },
      });
    }
    return created;
  });

  return NextResponse.json({ reply });
}
