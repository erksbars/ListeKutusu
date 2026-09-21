import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { calculateAchievements } from "@/lib/achievements";

function hasFavoriteGenres(value: string | null) {
  if (!value) return false;
  try {
    const genres = JSON.parse(value);
    return Array.isArray(genres) && genres.some((genre) => typeof genre === "string" && genre.trim());
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const listId = await getAuthenticatedAccountListId();
  if (!listId) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const summaryOnly = req.nextUrl.searchParams.get("view") === "summary";
  const summary = summaryOnly
    ? await prisma.userList.findUnique({
        where: { id: listId },
        select: {
          id: true,
          slug: true,
          ownerName: true,
          playlistName: true,
          bio: true,
          profileStatus: true,
          pinnedFeedPostId: true,
          profileShowcase: true,
          favoriteGenres: true,
          profileTheme: true,
          profileDensity: true,
          profileBanner: true,
          featuredAchievementId: true,
          role: true,
          email: true,
          submitCode: true,
          spotifyPlaylistId: true,
          spotifyExternalUrl: true,
          lastExportedAt: true,
          _count: { select: { feedPosts: true, feedLikes: true, feedAdds: true, followers: true } },
        },
      })
    : null;

  if (summary) {
    return NextResponse.json(
      {
        list: {
          ...summary,
          onboarding: {
            profileComplete: Boolean(
              summary.bio?.trim() && hasFavoriteGenres(summary.favoriteGenres)
            ),
            feedPosts: summary._count.feedPosts,
            feedLikes: summary._count.feedLikes,
            feedAdds: summary._count.feedAdds,
          },
          _count: undefined,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const list = await prisma.userList.findUnique({
    where: { id: listId },
    include: {
      suggestions: {
        orderBy: { createdAt: "desc" },
        take: 500,
      },
      feedPosts: {
        where: { status: "published" },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { id: true, trackName: true, artistName: true },
      },
      _count: {
        select: {
          feedPosts: true,
          feedLikes: true,
          feedAdds: true,
          followers: true,
        },
      },
    },
  });

  if (!list) {
    const res = NextResponse.json(
      { error: "Hesap bulunamadı." },
      { status: 404 }
    );
    res.cookies.set("account_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    return res;
  }

  const [receivedLikes, externalAdds, completedGames] = await Promise.all([
    prisma.feedLike.count({ where: { post: { authorId: list.id, status: "published" } } }),
    prisma.feedListAdd.count({
      where: { post: { authorId: list.id, status: "published" }, NOT: { userId: list.id } },
    }),
    prisma.gameSession.count({ where: { ownerId: list.id, status: "completed" } }),
  ]);
  const profileAchievements = calculateAchievements({
    posts: list._count.feedPosts,
    likes: receivedLikes,
    adds: externalAdds,
    followers: list._count.followers,
    games: completedGames,
  }).unlocked;

  return NextResponse.json(
    {
      list: {
        id: list.id,
        slug: list.slug,
        ownerName: list.ownerName,
        playlistName: list.playlistName,
        bio: list.bio,
        profileStatus: list.profileStatus,
        pinnedFeedPostId: list.pinnedFeedPostId,
        profileShowcase: list.profileShowcase,
        favoriteGenres: list.favoriteGenres,
        profileTheme: list.profileTheme,
        profileDensity: list.profileDensity,
        profileBanner: list.profileBanner,
        featuredAchievementId: list.featuredAchievementId,
        profileAchievements,
        role: list.role,
        email: list.email,
        submitCode: list.submitCode,
        spotifyPlaylistId: list.spotifyPlaylistId,
        spotifyExternalUrl: list.spotifyExternalUrl,
        lastExportedAt: list.lastExportedAt,
        suggestions: list.suggestions,
        profilePosts: list.feedPosts,
        onboarding: {
          profileComplete: Boolean(
            list.bio?.trim() && hasFavoriteGenres(list.favoriteGenres)
          ),
          feedPosts: list._count.feedPosts,
          feedLikes: list._count.feedLikes,
          feedAdds: list._count.feedAdds,
        },
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
