import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { getAuthenticatedAccountListId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedAccountListId();
  if (!userId) {
    return NextResponse.json(
      { error: "Beğenmek için giriş yapmalısın." },
      { status: 401 }
    );
  }

  const limited = checkRateLimit(req, {
    name: "feed-like",
    limit: 40,
    windowMs: 60_000,
  });

  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok hızlı işlem yapıyorsun. Biraz sonra tekrar dene." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfter) },
      }
    );
  }

  const body = await req.json().catch(() => null);
  const postId = typeof body?.postId === "string" ? body.postId.trim() : "";
  if (!postId) {
    return NextResponse.json({ error: "Gönderi bilgisi eksik." }, { status: 400 });
  }

  const post = await prisma.feedPost.findFirst({
    where: { id: postId, status: "published" },
    select: { id: true, authorId: true, author: { select: { notifyLikes: true } } },
  });
  if (!post) {
    return NextResponse.json({ error: "Gönderi bulunamadı." }, { status: 404 });
  }
  if (post.authorId === userId) {
    return NextResponse.json(
      { error: "Kendi paylaşımını beğenemezsin." },
      { status: 400 }
    );
  }

  const existing = await prisma.feedLike.findUnique({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
  });

  const liked = !existing;
  if (existing) {
    await prisma.$transaction([
      prisma.feedLike.delete({ where: { id: existing.id } }),
      prisma.notification.deleteMany({
        where: {
          userId: post.authorId,
          actorId: userId,
          postId,
          type: "feed_like",
        },
      }),
    ]);
  } else {
    const likeOperation = prisma.feedLike.create({ data: { postId, userId } });
    if (post.author.notifyLikes) {
      await prisma.$transaction([
        likeOperation,
        prisma.notification.create({
        data: {
          userId: post.authorId,
          actorId: userId,
          postId,
          type: "feed_like",
        },
        }),
      ]);
    } else {
      await likeOperation;
    }
  }

  const likeCount = await prisma.feedLike.count({ where: { postId } });
  return NextResponse.json({ liked, likeCount });
}
