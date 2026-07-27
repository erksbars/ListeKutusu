import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";

function hasFavoriteGenres(value: string | null) {
  if (!value) return false;
  try {
    const genres = JSON.parse(value);
    return Array.isArray(genres) && genres.some((genre) => typeof genre === "string" && genre.trim());
  } catch {
    return false;
  }
}

export async function GET() {
  const listId = await getAuthenticatedAccountListId();
  if (!listId) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const list = await prisma.userList.findUnique({
    where: { id: listId },
    include: {
      suggestions: {
        orderBy: { createdAt: "desc" },
        take: 500,
      },
      _count: {
        select: {
          feedPosts: true,
          feedLikes: true,
          feedAdds: true,
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

  return NextResponse.json(
    {
      list: {
        id: list.id,
        slug: list.slug,
        ownerName: list.ownerName,
        playlistName: list.playlistName,
        bio: list.bio,
        favoriteGenres: list.favoriteGenres,
        profileTheme: list.profileTheme,
        role: list.role,
        email: list.email,
        submitCode: list.submitCode,
        spotifyPlaylistId: list.spotifyPlaylistId,
        spotifyExternalUrl: list.spotifyExternalUrl,
        lastExportedAt: list.lastExportedAt,
        suggestions: list.suggestions,
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
