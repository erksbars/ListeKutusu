import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { addSuggestionToSpotifyList } from "@/lib/lists";
import { getAuthenticatedAccountListId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedAccountListId();
  if (!userId) {
    return NextResponse.json(
      { error: "Listene eklemek için giriş yapmalısın." },
      { status: 401 }
    );
  }

  const limited = checkRateLimit(req, {
    name: "feed-add",
    limit: 20,
    windowMs: 60_000,
  });

  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok hızlı ekleme yapıyorsun. Biraz sonra tekrar dene." },
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

  const [account, post] = await Promise.all([
    prisma.userList.findUnique({
      where: { id: userId },
      select: { id: true, ownerName: true },
    }),
    prisma.feedPost.findFirst({
      where: { id: postId, status: "published" },
      include: {
        author: {
          select: {
            id: true,
            ownerName: true,
            notifyAdds: true,
          },
        },
      },
    }),
  ]);

  if (!account) {
    const res = NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });
    res.cookies.set("account_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    return res;
  }

  if (!post) {
    return NextResponse.json({ error: "Gönderi bulunamadı." }, { status: 404 });
  }

  const existingApproved = await prisma.suggestion.findFirst({
    where: {
      listId: userId,
      trackId: post.trackId,
      status: { in: ["pending", "approved"] },
    },
    select: { id: true, status: true },
  });

  if (existingApproved) {
    await prisma.feedListAdd.upsert({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
      update: { suggestionId: existingApproved.id },
      create: {
        postId,
        userId,
        suggestionId: existingApproved.id,
      },
    });

    return NextResponse.json(
      {
        added: false,
        alreadyExists: true,
        suggestionId: existingApproved.id,
        message:
          existingApproved.status === "approved"
            ? "Bu şarkı zaten listende."
            : "Bu şarkı zaten onay bekliyor.",
      },
      { status: 409 }
    );
  }

  const suggestion = await prisma.suggestion.create({
    data: {
      listId: userId,
      trackId: post.trackId,
      trackUri: post.trackUri || `spotify:track:${post.trackId}`,
      trackName: post.trackName,
      artistName: post.artistName,
      durationMs: post.durationMs ?? 0,
      suggestedBy:
        post.authorId === userId
          ? "Keşif akışı"
          : `${post.author.ownerName} paylaşımı`,
      status: "approved",
      decidedAt: new Date(),
    },
  });

  const add = await prisma.feedListAdd.upsert({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
    update: { suggestionId: suggestion.id },
    create: {
      postId,
      userId,
      suggestionId: suggestion.id,
    },
  });

  if (post.authorId !== userId && post.author.notifyAdds) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        actorId: userId,
        postId,
        type: "feed_add",
      },
    });
  }

  let warning: string | null = null;
  try {
    await addSuggestionToSpotifyList(suggestion.id);
  } catch (err) {
    console.error("Feed add Spotify sync failed", err);
    warning =
      "Şarkı yerel listene eklendi. Spotify senkronu için liste panelinden yenile.";
  }

  return NextResponse.json({
    added: true,
    addId: add.id,
    suggestion,
    warning,
  });
}
