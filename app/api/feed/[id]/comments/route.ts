import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeFeedComment } from "@/lib/feedComments";
import { checkRateLimit } from "@/lib/rateLimit";
import { getAuthenticatedAccountListId } from "@/lib/session";

const ROOT_COMMENT_LIMIT = 40;

const authorSelect = {
  id: true,
  ownerName: true,
  slug: true,
  profileTheme: true,
} as const;

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await context.params;
  const viewerId = await getAuthenticatedAccountListId();
  const post = await prisma.feedPost.findFirst({
    where: { id: postId, status: "published", author: { status: "active" } },
    select: { id: true },
  });
  if (!post) return NextResponse.json({ error: "Paylaşım bulunamadı." }, { status: 404 });

  const blockedAuthorFilter = viewerId
    ? {
        author: {
          status: "active",
          blocksInitiated: { none: { blockedId: viewerId } },
          blocksReceived: { none: { blockerId: viewerId } },
        },
      }
    : { author: { status: "active" } };

  const comments = await prisma.feedComment.findMany({
    where: {
      postId,
      parentId: null,
      status: "published",
      ...blockedAuthorFilter,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: ROOT_COMMENT_LIMIT,
    include: {
      author: { select: authorSelect },
      replies: {
        where: { status: "published", ...blockedAuthorFilter },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: { author: { select: authorSelect } },
      },
    },
  });

  const total = await prisma.feedComment.count({
    where: { postId, status: "published", ...blockedAuthorFilter },
  });
  return NextResponse.json({ comments, total, truncated: comments.length >= ROOT_COMMENT_LIMIT });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authorId = await getAuthenticatedAccountListId();
  if (!authorId) {
    return NextResponse.json({ error: "Yorum yapmak için giriş yapmalısın." }, { status: 401 });
  }
  const limited = checkRateLimit(req, {
    name: "feed-comment-create",
    identifier: authorId,
    limit: 20,
    windowMs: 10 * 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok hızlı yorum gönderiyorsun. Biraz sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const { id: postId } = await context.params;
  const input = await req.json().catch(() => null);
  const normalized = normalizeFeedComment(input?.body);
  if (!normalized.ok) return NextResponse.json({ error: normalized.error }, { status: 400 });
  const parentId = typeof input?.parentId === "string" ? input.parentId.trim() : null;

  const [post, parent] = await Promise.all([
    prisma.feedPost.findFirst({
      where: { id: postId, status: "published", author: { status: "active" } },
      select: { id: true, authorId: true },
    }),
    parentId
      ? prisma.feedComment.findFirst({
          where: { id: parentId, postId, parentId: null, status: "published" },
          select: { id: true, authorId: true },
        })
      : null,
  ]);
  if (!post) return NextResponse.json({ error: "Paylaşım bulunamadı." }, { status: 404 });
  if (parentId && !parent) return NextResponse.json({ error: "Yanıtlanan yorum bulunamadı." }, { status: 404 });

  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.feedComment.create({
      data: { postId, authorId, parentId: parent?.id ?? null, body: normalized.body },
      include: { author: { select: authorSelect } },
    });
    const recipients = new Set([post.authorId, parent?.authorId].filter(Boolean));
    recipients.delete(authorId);
    if (recipients.size) {
      await tx.notification.createMany({
        data: Array.from(recipients).map((userId) => ({
          userId: userId!,
          actorId: authorId,
          postId,
          type: parent ? "feed_comment_reply" : "feed_comment",
        })),
      });
    }
    return created;
  });

  return NextResponse.json({ comment: { ...comment, replies: [] } }, { status: 201 });
}
