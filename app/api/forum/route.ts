import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { getAuthenticatedAccountListId } from "@/lib/session";
import {
  createForumSlug,
  FORUM_CATEGORIES,
  FORUM_CATEGORY_GROUPS,
  forumCategoryIdsForFilter,
  validateForumThread,
} from "@/lib/forum";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category")?.trim() || "";
  const query = req.nextUrl.searchParams.get("q")?.trim().slice(0, 80) || "";
  const sort = req.nextUrl.searchParams.get("sort") || "latest";
  const state = req.nextUrl.searchParams.get("state") || "all";
  const mine = req.nextUrl.searchParams.get("mine") === "1";
  const viewerId = mine ? await getAuthenticatedAccountListId() : null;
  if (mine && !viewerId) {
    return NextResponse.json(
      { error: "Kendi konularını görmek için giriş yapmalısın." },
      { status: 401 }
    );
  }
  const categoryIds = category ? forumCategoryIdsForFilter(category) : [];
  const requestedPage = Number.parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), 100) : 1;
  const pageSize = 20;
  const where: Prisma.ForumThreadWhereInput = {
    ...(mine
      ? { authorId: viewerId!, status: { in: ["published", "pending", "rejected"] } }
      : { status: "published" }),
    ...(categoryIds.length ? { category: { in: categoryIds } } : {}),
    ...(query
      ? { OR: [{ title: { contains: query } }, { body: { contains: query } }] }
      : {}),
    ...(state === "solved"
      ? { acceptedReplyId: { not: null } }
      : state === "open"
        ? { acceptedReplyId: null }
        : {}),
    ...(sort === "unanswered" ? { replies: { none: { status: "published" } } } : {}),
  };

  const [threads, total, directoryThreads] = await Promise.all([
    prisma.forumThread.findMany({
      where,
      orderBy:
        sort === "popular"
          ? [{ views: "desc" }, { lastActivityAt: "desc" }]
          : { lastActivityAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        author: { select: { ownerName: true, slug: true, profileTheme: true } },
        _count: { select: { replies: { where: { status: "published" } } } },
        replies: {
          where: { status: "published" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, author: { select: { ownerName: true } } },
        },
      },
    }),
    prisma.forumThread.count({ where }),
    prisma.forumThread.findMany({
      where: { status: "published" },
      orderBy: { lastActivityAt: "desc" },
      take: 1000,
      select: {
        id: true,
        slug: true,
        category: true,
        title: true,
        lastActivityAt: true,
        acceptedReplyId: true,
        author: { select: { ownerName: true } },
        _count: { select: { replies: { where: { status: "published" } } } },
      },
    }),
  ]);

  const mapped = threads.map((thread) => ({
    id: thread.id,
    slug: thread.slug,
    category: thread.category,
    title: thread.title,
    excerpt: thread.body.replace(/\s+/g, " ").slice(0, 180),
    views: thread.views,
    createdAt: thread.createdAt,
    lastActivityAt: thread.lastActivityAt,
    locked: Boolean(thread.lockedAt),
    solved: Boolean(thread.acceptedReplyId),
    status: thread.status,
    author: thread.author,
    replyCount: thread._count.replies,
    latestReply: thread.replies[0] ?? null,
  }));

  const directory = FORUM_CATEGORY_GROUPS.map((group) => ({
    ...group,
    categories: group.categories.map((item) => {
      const categoryThreads = directoryThreads.filter((thread) => thread.category === item.id);
      const latest = categoryThreads[0] ?? null;
      return {
        ...item,
        threadCount: categoryThreads.length,
        replyCount: categoryThreads.reduce((total, thread) => total + thread._count.replies, 0),
        latestThread: latest
          ? {
              slug: latest.slug,
              title: latest.title,
              lastActivityAt: latest.lastActivityAt,
              authorName: latest.author.ownerName,
              solved: Boolean(latest.acceptedReplyId),
            }
          : null,
      };
    }),
  }));

  const summary = {
    threadCount: directoryThreads.length,
    replyCount: directoryThreads.reduce((totalReplies, thread) => totalReplies + thread._count.replies, 0),
    solvedCount: directoryThreads.filter((thread) => Boolean(thread.acceptedReplyId)).length,
  };
  const recentThreads = directoryThreads.slice(0, 5).map((thread) => ({
    id: thread.id,
    slug: thread.slug,
    category: thread.category,
    title: thread.title,
    lastActivityAt: thread.lastActivityAt,
    replyCount: thread._count.replies,
    solved: Boolean(thread.acceptedReplyId),
  }));

  return NextResponse.json(
    {
      threads: mapped,
      categories: FORUM_CATEGORIES,
      directory,
      recentThreads,
      summary,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    },
    {
      headers: {
        "Cache-Control": mine
          ? "private, no-store"
          : "public, max-age=15, stale-while-revalidate=45",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const authorId = await getAuthenticatedAccountListId();
  if (!authorId) return NextResponse.json({ error: "Konu açmak için giriş yapmalısın." }, { status: 401 });

  const limited = checkRateLimit(req, {
    name: "forum-thread-create",
    identifier: authorId,
    limit: 3,
    windowMs: 60 * 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Bir saat içinde en fazla 3 konu gönderebilirsin." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  const input = {
    category: typeof body?.category === "string" ? body.category.trim() : "",
    title: typeof body?.title === "string" ? body.title.trim() : "",
    body: typeof body?.body === "string" ? body.body.trim() : "",
  };
  const validationError = validateForumThread(input);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const slug = createForumSlug(input.title, crypto.randomBytes(4).toString("hex"));
  const thread = await prisma.forumThread.create({
    data: { ...input, slug, authorId },
    select: { id: true, slug: true, status: true, createdAt: true },
  });

  return NextResponse.json({ thread, message: "Konu moderatör onayına gönderildi." });
}
