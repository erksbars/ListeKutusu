import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  clearAccountSessionCookieOnResponse,
  getAuthenticatedAccountListId,
} from "@/lib/session";
import { clearPlaylistItems, updateOwnerPlaylistDetails } from "@/lib/spotify";

export async function DELETE(req: NextRequest) {
  const listId = await getAuthenticatedAccountListId();
  if (!listId) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const limited = checkRateLimit(req, {
    name: "account-delete",
    limit: 5,
    windowMs: 30 * 60_000,
    identifier: listId,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok fazla silme denemesi yapıldı. Daha sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  const confirmation =
    typeof body?.confirmation === "string" ? body.confirmation.trim() : "";

  if (confirmation !== "HESABIMI SİL") {
    return NextResponse.json(
      { error: "Onay metnini tam olarak yazmalısın." },
      { status: 400 }
    );
  }

  const account = await prisma.userList.findFirst({
    where: { id: listId, status: "active" },
    select: { passwordHash: true, spotifyPlaylistId: true },
  });
  if (
    !account?.passwordHash ||
    !(await verifyPassword(password, account.passwordHash))
  ) {
    return NextResponse.json({ error: "Şifre hatalı." }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.accountSession.updateMany({
      where: { userId: listId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await tx.notification.deleteMany({
      where: { OR: [{ userId: listId }, { actorId: listId }] },
    });
    await tx.postReport.deleteMany({ where: { reporterId: listId } });
    await tx.userBlock.deleteMany({
      where: { OR: [{ blockerId: listId }, { blockedId: listId }] },
    });
    await tx.follow.deleteMany({
      where: { OR: [{ followerId: listId }, { followingId: listId }] },
    });
    await tx.feedLike.deleteMany({ where: { userId: listId } });
    await tx.feedListAdd.deleteMany({ where: { userId: listId } });
    await tx.feedSave.deleteMany({ where: { userId: listId } });
    await tx.feedHide.deleteMany({ where: { userId: listId } });
    await tx.feedPost.deleteMany({ where: { authorId: listId } });
    await tx.suggestion.deleteMany({ where: { listId } });
    await tx.userList.update({
      where: { id: listId },
      data: {
        ownerName: "Silinmiş hesap",
        playlistName: null,
        bio: null,
        favoriteGenres: null,
        profileTheme: "aurora",
        email: null,
        passwordHash: null,
        slug: `silinmis-${listId}`,
        submitCode: null,
        status: "deleted",
      },
    });
  });

  if (account.spotifyPlaylistId) {
    try {
      await clearPlaylistItems(account.spotifyPlaylistId);
      await updateOwnerPlaylistDetails(
        account.spotifyPlaylistId,
        "ListeKutusu - Kullanıma hazır",
        "Yeni bir ListeKutusu listesi için ayrılmış boş playlist."
      );
    } catch (error) {
      console.error("Deleted account playlist cleanup failed", error);
    }
  }

  const res = NextResponse.json({ deleted: true });
  clearAccountSessionCookieOnResponse(res);
  return res;
}
