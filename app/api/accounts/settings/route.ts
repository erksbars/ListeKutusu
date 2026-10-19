import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createCode, playlistDescriptionFor } from "@/lib/lists";
import { hashPassword, passwordValidationError, verifyPassword } from "@/lib/password";
import {
  clearAccountSessionCookieOnResponse,
  getAuthenticatedAccountListId,
} from "@/lib/session";
import { updateOwnerPlaylistDetails } from "@/lib/spotify";
import { checkRateLimit } from "@/lib/rateLimit";
import { normalizeProfileShowcase } from "@/lib/profileShowcase";
import { normalizeProfileBanner, normalizeProfileDensity } from "@/lib/profileAppearance";
import { calculateAchievements } from "@/lib/achievements";
import { completedProfileGames } from "@/lib/profileGames";
import { parseUniversityUpdate } from "@/lib/profileUniversity";

function accountPayload(list: {
  id: string;
  ownerName: string;
  playlistName: string | null;
  email: string | null;
  submitCode: string | null;
  spotifyExternalUrl: string | null;
  bio: string | null;
  profileStatus: string | null;
  universityName: string | null;
  universityPublic: boolean;
  pinnedFeedPostId: string | null;
  profileShowcase: string | null;
  favoriteGenres: string | null;
  profileTheme: string;
  profileDensity: string;
  profileBanner: string;
  featuredAchievementId: string | null;
}) {
  return {
    id: list.id,
    ownerName: list.ownerName,
    playlistName: list.playlistName,
    email: list.email,
    submitCode: list.submitCode,
    spotifyExternalUrl: list.spotifyExternalUrl,
    bio: list.bio,
    profileStatus: list.profileStatus,
    universityName: list.universityName,
    universityPublic: list.universityPublic,
    pinnedFeedPostId: list.pinnedFeedPostId,
    profileShowcase: list.profileShowcase,
    favoriteGenres: list.favoriteGenres,
    profileTheme: list.profileTheme,
    profileDensity: list.profileDensity,
    profileBanner: list.profileBanner,
    featuredAchievementId: list.featuredAchievementId,
  };
}

function accountResponse(list: Parameters<typeof accountPayload>[0]) {
  return NextResponse.json(
    { list: accountPayload(list) },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(req: NextRequest) {
  const listId = await getAuthenticatedAccountListId();
  if (!listId) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "update";

  const limited = checkRateLimit(req, {
    name: `account-settings-${action}`,
    limit: action === "change-password" ? 8 : 40,
    windowMs: action === "change-password" ? 15 * 60_000 : 60_000,
    identifier: listId,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok fazla işlem yapıldı. Biraz sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  if (action === "rotate-code") {
    const list = await prisma.userList.update({
      where: { id: listId },
      data: { submitCode: createCode("EKLE") },
    });
    return accountResponse(list);
  }

  if (action === "change-password") {
    const currentPassword =
      typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword =
      typeof body?.newPassword === "string" ? body.newPassword : "";

    if (currentPassword.length > 128) {
      return NextResponse.json({ error: "Mevcut şifre hatalı." }, { status: 403 });
    }

    const passwordError = passwordValidationError(newPassword);
    if (passwordError) {
      return NextResponse.json(
        { error: passwordError },
        { status: 400 }
      );
    }

    const account = await prisma.userList.findUnique({
      where: { id: listId },
      select: { passwordHash: true },
    });

    if (!account?.passwordHash) {
      return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });
    }

    if (!(await verifyPassword(currentPassword, account.passwordHash))) {
      return NextResponse.json(
        { error: "Mevcut şifre hatalı." },
        { status: 403 }
      );
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.userList.update({
        where: { id: listId },
        data: { passwordHash },
      }),
      prisma.accountSession.updateMany({
        where: { userId: listId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    const res = NextResponse.json(
      { changed: true, signedOut: true },
      { headers: { "Cache-Control": "no-store" } }
    );
    clearAccountSessionCookieOnResponse(res);
    return res;
  }

  if (action === "update-profile") {
    const university = parseUniversityUpdate(body?.university);
    if (!university.ok) return NextResponse.json({ error: university.error }, { status: 400, headers: { "Cache-Control": "no-store" } });
    const bio = typeof body?.bio === "string" ? body.bio.trim() : "";
    const profileStatus = typeof body?.profileStatus === "string" ? body.profileStatus.trim() : "";
    const requestedPinnedPostId = typeof body?.pinnedFeedPostId === "string" ? body.pinnedFeedPostId.trim() : "";
    const profileShowcase = normalizeProfileShowcase(body?.profileShowcase);
    const genreCandidates = Array.isArray(body?.favoriteGenres)
      ? body.favoriteGenres
          .filter((item: unknown) => typeof item === "string")
          .map((item: string) => item.trim().slice(0, 24))
          .filter(Boolean)
      : [];
    const genres = [
      ...new Map(
        genreCandidates.map((genre: string) => [
          genre.toLocaleLowerCase("tr-TR"),
          genre,
        ])
      ).values(),
    ].slice(0, 6);
    const allowedThemes = new Set(["aurora", "violet", "emerald", "sunset"]);
    const profileTheme = allowedThemes.has(body?.profileTheme)
      ? body.profileTheme
      : "aurora";
    const profileDensity = normalizeProfileDensity(body?.profileDensity);
    const profileBanner = normalizeProfileBanner(body?.profileBanner);
    const requestedAchievementId = typeof body?.featuredAchievementId === "string"
      ? body.featuredAchievementId.trim()
      : "";

    if (bio.length > 240) {
      return NextResponse.json(
        { error: "Profil açıklaması en fazla 240 karakter olabilir." },
        { status: 400 }
      );
    }
    if (profileStatus.length > 80) {
      return NextResponse.json({ error: "Kısa durum en fazla 80 karakter olabilir." }, { status: 400 });
    }
    const pinnedPost = requestedPinnedPostId
      ? await prisma.feedPost.findFirst({
          where: { id: requestedPinnedPostId, authorId: listId, status: "published" },
          select: { id: true },
        })
      : null;
    if (requestedPinnedPostId && !pinnedPost) {
      return NextResponse.json({ error: "Sabitlenecek paylaşım bulunamadı." }, { status: 400 });
    }
    if (requestedAchievementId) {
      const [posts, likes, adds, followers, games] = await Promise.all([
        prisma.feedPost.count({ where: { authorId: listId, status: "published" } }),
        prisma.feedLike.count({ where: { post: { authorId: listId, status: "published" } } }),
        prisma.feedListAdd.count({
          where: { post: { authorId: listId, status: "published" }, NOT: { userId: listId } },
        }),
        prisma.follow.count({ where: { followingId: listId } }),
        prisma.gameSession.count({ where: { ...completedProfileGames(listId), gameCode: "song-elimination" } }),
      ]);
      const unlockedIds = new Set(calculateAchievements({ posts, likes, adds, followers, games }).unlocked.map((item) => item.id));
      if (!unlockedIds.has(requestedAchievementId)) {
        return NextResponse.json({ error: "Yalnızca kazandığın bir rozeti öne çıkarabilirsin." }, { status: 400 });
      }
    }

    const list = await prisma.userList.update({
      where: { id: listId },
      data: {
        bio: bio || null,
        ...university.data,
        profileStatus: profileStatus || null,
        pinnedFeedPostId: pinnedPost?.id || null,
        profileShowcase: JSON.stringify(profileShowcase),
        favoriteGenres: genres.length ? JSON.stringify(genres) : null,
        profileTheme,
        profileDensity,
        profileBanner,
        featuredAchievementId: requestedAchievementId || null,
      },
    });

    return accountResponse(list);
  }

  const playlistName =
    typeof body?.playlistName === "string" ? body.playlistName.trim() : "";
  if (!playlistName) {
    return NextResponse.json(
      { error: "Liste adı boş olamaz." },
      { status: 400 }
    );
  }
  if (playlistName.length > 80) {
    return NextResponse.json(
      { error: "Liste adı en fazla 80 karakter olabilir." },
      { status: 400 }
    );
  }

  const currentList = await prisma.userList.findUnique({
    where: { id: listId },
    select: {
      ownerName: true,
      spotifyPlaylistId: true,
    },
  });

  if (!currentList) {
    return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });
  }

  if (currentList.spotifyPlaylistId) {
    try {
      await updateOwnerPlaylistDetails(
        currentList.spotifyPlaylistId,
        playlistName,
        playlistDescriptionFor(currentList.ownerName)
      );
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Bilinmeyen hata";
      console.error("Spotify playlist name update failed", detail);
      return NextResponse.json(
        {
          error:
            "Spotify liste adı güncellenemedi. Spotify bağlantısını yenileyip tekrar dene.",
        },
        { status: 502 }
      );
    }
  }

  const list = await prisma.userList.update({
    where: { id: listId },
    data: { playlistName },
  });

  return accountResponse(list);
}
