import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { getTrack, getTracksMetadata } from "@/lib/spotify";
import type { Prisma } from "@prisma/client";
import {
  diversifyFeedRanking,
  rankPersonalizedFeed,
  type PersonalizationSignals,
} from "@/lib/feedRanking";
import { parseOffsetCursor } from "@/lib/pagination";
import { normalizeFeedNote } from "@/lib/feedContent";

export const dynamic = "force-dynamic";

function normalizeTags(value: unknown) {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return [
    ...new Set(
      raw
        .map((item) =>
          typeof item === "string"
            ? item.trim().toLocaleLowerCase("tr-TR").replace(/^#/, "")
            : ""
        )
        .filter((item) => item.length >= 2)
        .map((item) => item.slice(0, 24))
    ),
  ].slice(0, 4);
}

function parseTags(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

type FeedPostWithRelations = Prisma.FeedPostGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        ownerName: true;
        playlistName: true;
        slug: true;
        followers: { select: { id: true } };
      };
    };
    _count: { select: { likes: true; adds: true; comments: true } };
    likes: { select: { id: true } };
    adds: { select: { id: true } };
    saves: { select: { id: true } };
  };
}>;

function serializePost(
  post: FeedPostWithRelations & {
    viewerId: string | null;
    recommendationReason?: string | null;
  }
) {
  return {
    id: post.id,
    trackId: post.trackId,
    trackName: post.trackName,
    artistName: post.artistName,
    albumName: post.albumName,
    durationMs: post.durationMs,
    externalUrl: post.externalUrl,
    source: post.source,
    note: post.note,
    tags: parseTags(post.tags),
    createdAt: post.createdAt,
    likeCount: post._count?.likes ?? 0,
    addCount: post._count?.adds ?? 0,
    commentCount: post._count?.comments ?? 0,
    likedByMe: Boolean(post.likes?.length),
    addedByMe: Boolean(post.adds?.length),
    savedByMe: Boolean(post.saves?.length),
    followingAuthor: Boolean(post.author.followers?.length),
    isMine: post.author.id === post.viewerId,
    recommendationReason: post.recommendationReason ?? null,
    author: {
      id: post.author.id,
      ownerName: post.author.ownerName,
      playlistName: post.author.playlistName,
      slug: post.author.slug,
    },
  };
}

export async function GET(req: NextRequest) {
  const viewerId = await getAuthenticatedAccountListId();
  const safeViewerId = viewerId ?? "__anonymous__";
  const scope = req.nextUrl.searchParams.get("scope");
  const cursor = req.nextUrl.searchParams.get("cursor");
  const takeParam = Number(req.nextUrl.searchParams.get("take") ?? 20);
  const take = Math.min(40, Math.max(1, Number.isFinite(takeParam) ? takeParam : 20));
  const followingOnly = scope === "following" && Boolean(viewerId);
  const trending = scope === "trending";
  const genresOnly = scope === "genres" && Boolean(viewerId);
  const personalized = scope === "personalized" && Boolean(viewerId);
  const savedOnly = scope === "saved" && Boolean(viewerId);
  const specialScope = trending || genresOnly || personalized || savedOnly;
  const rankedOffset = specialScope ? parseOffsetCursor(cursor) : 0;

  if (
    (scope === "following" ||
      scope === "genres" ||
      scope === "personalized" ||
      scope === "saved") &&
    !viewerId
  ) {
    return NextResponse.json({ posts: [], nextCursor: null });
  }

  let personalizationSignals: PersonalizationSignals = {
    favoriteGenres: [],
    likedTags: [],
    addedTags: [],
    likedArtists: [],
    addedArtists: [],
    followingIds: [],
  };

  if (personalized) {
    const [profile, recentLikes, recentAdds, following] = await Promise.all([
      prisma.userList.findUnique({
        where: { id: viewerId! },
        select: { favoriteGenres: true },
      }),
      prisma.feedLike.findMany({
        where: { userId: viewerId! },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { post: { select: { artistName: true, tags: true } } },
      }),
      prisma.feedListAdd.findMany({
        where: { userId: viewerId! },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { post: { select: { artistName: true, tags: true } } },
      }),
      prisma.follow.findMany({
        where: { followerId: viewerId! },
        select: { followingId: true },
      }),
    ]);

    personalizationSignals = {
      favoriteGenres: parseTags(profile?.favoriteGenres ?? null),
      likedTags: recentLikes.flatMap((item) => parseTags(item.post.tags)),
      addedTags: recentAdds.flatMap((item) => parseTags(item.post.tags)),
      likedArtists: recentLikes.map((item) => item.post.artistName),
      addedArtists: recentAdds.map((item) => item.post.artistName),
      followingIds: following.map((item) => item.followingId),
    };
  }

  const preferredGenres = genresOnly
    ? parseTags(
        (
          await prisma.userList.findUnique({
            where: { id: viewerId! },
            select: { favoriteGenres: true },
          })
        )?.favoriteGenres ?? null
      ).map((genre) => genre.toLocaleLowerCase("tr-TR"))
    : [];

  const posts = await prisma.feedPost.findMany({
    where: {
      status: "published",
      ...(viewerId
        ? {
            AND: [
              { author: { blocksInitiated: { none: { blockedId: viewerId } } } },
              { author: { blocksReceived: { none: { blockerId: viewerId } } } },
              { hides: { none: { userId: viewerId } } },
            ],
          }
        : {}),
      ...(followingOnly
        ? {
            author: {
              followers: {
                some: { followerId: viewerId! },
              },
            },
          }
        : {}),
      ...(personalized ? { authorId: { not: viewerId! } } : {}),
      ...(savedOnly ? { saves: { some: { userId: viewerId! } } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: specialScope ? 100 : take + 1,
    ...(!specialScope && cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      author: {
        select: {
          id: true,
          ownerName: true,
          playlistName: true,
          slug: true,
          followers: {
            where: { followerId: safeViewerId },
            select: { id: true },
            take: 1,
          },
        },
      },
      _count: { select: { likes: true, adds: true, comments: { where: { status: "published" } } } },
      likes: {
        where: { userId: safeViewerId },
        select: { id: true },
        take: 1,
      },
      adds: {
        where: { userId: safeViewerId },
        select: { id: true },
        take: 1,
      },
      saves: {
        where: { userId: safeViewerId },
        select: { id: true },
        take: 1,
      },
    },
  });

  const filtered = genresOnly
    ? posts.filter((post) => {
        const tags = parseTags(post.tags).map((tag) => tag.toLocaleLowerCase("tr-TR"));
        return preferredGenres.some((genre) =>
          tags.some((tag) => tag.includes(genre) || genre.includes(tag))
        );
      })
    : posts;
  const personalizedRanking = personalized
    ? rankPersonalizedFeed(
        filtered.map((post) => ({
          post,
          id: post.id,
          authorId: post.authorId,
          artistName: post.artistName,
          tags: parseTags(post.tags),
          createdAt: post.createdAt,
          likeCount: post._count.likes,
          addCount: post._count.adds,
          addedByMe: Boolean(post.adds.length),
        })),
        personalizationSignals
      )
    : [];
  const recommendationReasons = new Map(
    personalizedRanking.map((item) => [item.post.id, item.reason])
  );
  const ranked = personalized
    ? personalizedRanking.map((item) => item.post.post)
    : trending
      ? diversifyFeedRanking(filtered.map((post) => {
        const ageHours = (Date.now() - post.createdAt.getTime()) / 3_600_000;
        return {
          post,
          score: post._count.adds * 4 + post._count.likes * 2 + Math.max(0, 48 - ageHours) / 12,
          reason: "Toplulukta yükseliyor",
        };
      })).map((item) => item.post)
      : filtered;
  const hasMore = specialScope
    ? ranked.length > rankedOffset + take
    : ranked.length > take;
  const page = specialScope
    ? ranked.slice(rankedOffset, rankedOffset + take)
    : ranked.slice(0, take);

  return NextResponse.json({
    posts: page.map((post) =>
      serializePost({
        ...post,
        viewerId,
        recommendationReason: recommendationReasons.get(post.id) ?? null,
      })
    ),
    nextCursor: hasMore
      ? specialScope
        ? `offset:${rankedOffset + take}`
        : page.at(-1)?.id ?? null
      : null,
    emptyReason:
      genresOnly && preferredGenres.length === 0
        ? "Türlerine özel akış için profilinden favori türlerini seç."
        : null,
  });
}

export async function POST(req: NextRequest) {
  const authorId = await getAuthenticatedAccountListId();
  if (!authorId) {
    return NextResponse.json(
      { error: "Akışa şarkı bırakmak için giriş yapmalısın." },
      { status: 401 }
    );
  }

  const limited = checkRateLimit(req, {
    name: "feed-post",
    limit: 10,
    windowMs: 60_000,
  });

  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok hızlı paylaşım yapıyorsun. Biraz sonra tekrar dene." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfter) },
      }
    );
  }

  const body = await req.json().catch(() => null);
  const trackId = typeof body?.trackId === "string" ? body.trackId.trim() : "";
  const tags = normalizeTags(body?.tags);
  const noteResult = normalizeFeedNote(body?.note);

  if (!trackId) {
    return NextResponse.json({ error: "Şarkı bilgisi eksik." }, { status: 400 });
  }
  if (!noteResult.ok) {
    return NextResponse.json({ error: noteResult.error }, { status: 400 });
  }

  const account = await prisma.userList.findUnique({
    where: { id: authorId },
    select: { id: true },
  });
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

  let track;
  try {
    track = await getTrack(trackId);
  } catch (err) {
    console.error("Feed track verification failed", err);
    return NextResponse.json(
      { error: "Şarkı şu anda Spotify tarafında doğrulanamadı. Biraz sonra tekrar dene." },
      { status: 502 }
    );
  }

  let enrichedTags = tags;
  try {
    const metadata = await getTracksMetadata([track.id]);
    enrichedTags = normalizeTags([
      ...tags,
      ...(metadata.get(track.id)?.genres ?? []).slice(0, 2),
    ]);
  } catch (err) {
    console.error("Feed genre enrichment failed", err);
  }

  const existing = await prisma.feedPost.findFirst({
    where: {
      authorId,
      trackId: track.id,
      status: "published",
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Bu şarkıyı akışta zaten paylaşmışsın." },
      { status: 409 }
    );
  }

  const post = await prisma.feedPost.create({
    data: {
      authorId,
      trackId: track.id,
      trackUri: track.uri,
      trackName: track.name,
      artistName: track.artist,
      albumName: track.album || null,
      durationMs: track.durationMs || null,
      externalUrl: track.externalUrl,
      source: "spotify",
      note: noteResult.note,
      tags: enrichedTags.length ? JSON.stringify(enrichedTags) : null,
    },
    include: {
      author: {
        select: {
          id: true,
          ownerName: true,
          playlistName: true,
          slug: true,
          followers: {
            where: { followerId: authorId },
            select: { id: true },
            take: 1,
          },
        },
      },
      _count: { select: { likes: true, adds: true, comments: { where: { status: "published" } } } },
      likes: {
        where: { userId: authorId },
        select: { id: true },
      },
      adds: {
        where: { userId: authorId },
        select: { id: true },
      },
      saves: {
        where: { userId: authorId },
        select: { id: true },
      },
    },
  });

  return NextResponse.json({ post: serializePost({ ...post, viewerId: authorId }) });
}

export async function DELETE(req: NextRequest) {
  const authorId = await getAuthenticatedAccountListId();
  if (!authorId) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const postId = req.nextUrl.searchParams.get("postId")?.trim();
  if (!postId) return NextResponse.json({ error: "Paylaşım bilgisi eksik." }, { status: 400 });

  const post = await prisma.feedPost.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) return NextResponse.json({ error: "Paylaşım bulunamadı." }, { status: 404 });
  if (post.authorId !== authorId) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  await prisma.feedPost.delete({ where: { id: postId } });
  return NextResponse.json({ deleted: true });
}

export async function PATCH(req: NextRequest) {
  const authorId = await getAuthenticatedAccountListId();
  if (!authorId) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const postId = typeof body?.postId === "string" ? body.postId.trim() : "";
  const tags = normalizeTags(body?.tags);
  const noteResult = normalizeFeedNote(body?.note);
  if (!postId) return NextResponse.json({ error: "Paylaşım bilgisi eksik." }, { status: 400 });
  if (!noteResult.ok) {
    return NextResponse.json({ error: noteResult.error }, { status: 400 });
  }

  const post = await prisma.feedPost.findUnique({
    where: { id: postId },
    select: { authorId: true, status: true },
  });
  if (!post || post.status !== "published") {
    return NextResponse.json({ error: "Paylaşım bulunamadı." }, { status: 404 });
  }
  if (post.authorId !== authorId) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const updated = await prisma.feedPost.update({
    where: { id: postId },
    data: {
      note: noteResult.note,
      tags: tags.length ? JSON.stringify(tags) : null,
    },
    select: { id: true, note: true, tags: true, updatedAt: true },
  });

  return NextResponse.json({
    post: { ...updated, tags: parseTags(updated.tags) },
  });
}
