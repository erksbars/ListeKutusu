import type { PrismaClient } from "@prisma/client";
import { archiveCommunity, lockActiveAccount } from "./communityLifecycle.ts";
import { CommunityError } from "./communityError.ts";

// Only call after password verification, with the server-read hash, never request data.
export async function deleteAccountData(db: PrismaClient, userId: string, verifiedHash: string, archiveOwned: boolean, now = new Date()) {
  return db.$transaction(async tx => {
    await lockActiveAccount(tx, userId);
    const account = await tx.userList.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true, spotifyPlaylistId: true } });
    if (account.passwordHash !== verifiedHash) throw new CommunityError("Hesap bilgileri değişti. Şifreni yeniden doğrula.", 409);
    const owned = await tx.community.count({ where: { ownerId: userId, status: "active" } });
    if (owned && !archiveOwned) throw new CommunityError(`Sahibi olduğun ${owned} aktif topluluk var. Önce sahipliği devret veya topluluklarını arşivleyerek silme seçeneğini açıkça onayla.`, 409);
    for (;;) {
      const rows = await tx.community.findMany({ where: { ownerId: userId, status: "active" }, take: 20, select: { id: true } });
      if (!rows.length) break;
      for (const row of rows) await archiveCommunity(tx, row.id, userId, now, false);
    }
    await tx.communityOwnershipOffer.deleteMany({ where: { OR: [{ fromUserId: userId }, { toUserId: userId }] } });
    await tx.$executeRaw`
      INSERT INTO CommunityModerationLog (id, communityId, actorId, action, targetType, targetId, note, createdAt)
      SELECT 'account-close:' || e.id || ':' || (e.contentVersion + 1), e.communityId, ${userId}, 'cancel-event', 'event', e.id, 'Hesap kapatılması nedeniyle iptal', ${now}
      FROM CommunityEvent e WHERE e.organizerId = ${userId} AND e.status = 'scheduled' AND e.startsAt > ${now}
    `;
    await tx.communityEventRsvp.updateMany({ where: { OR: [{ userId }, { event: { organizerId: userId, status: "scheduled", startsAt: { gt: now } } }], status: { in: ["attending", "interested"] } }, data: { status: "withdrawn" } });
    await tx.communityEvent.updateMany({ where: { organizerId: userId, status: "scheduled", startsAt: { gt: now } }, data: { status: "cancelled", contentVersion: { increment: 1 }, revision: { increment: 1 } } });
    await tx.accountSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } });
    await tx.notification.deleteMany({ where: { OR: [{ userId }, { actorId: userId }] } });
    await tx.communityEventNotificationRecipient.deleteMany({ where: { userId } });
    await tx.communityEventNotificationJob.deleteMany({ where: { OR: [{ actorId: userId }, { event: { organizerId: userId } }] } });
    await tx.communityReport.deleteMany({ where: { reporterId: userId } });
    await tx.communityPostLike.deleteMany({ where: { userId } });
    await tx.communityPostSave.deleteMany({ where: { userId } });
    await tx.platformCommunityCase.deleteMany({ where: { applicantId: userId } });
    await tx.postReport.deleteMany({ where: { reporterId: userId } });
    await tx.commentReport.deleteMany({ where: { reporterId: userId } });
    await tx.userBlock.deleteMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } });
    await tx.follow.deleteMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } });
    await tx.feedLike.deleteMany({ where: { userId } });
    await tx.feedListAdd.deleteMany({ where: { userId } });
    await tx.feedSave.deleteMany({ where: { userId } });
    await tx.feedHide.deleteMany({ where: { userId } });
    await tx.feedComment.deleteMany({ where: { authorId: userId } });
    await tx.feedPost.deleteMany({ where: { authorId: userId } });
    await tx.suggestion.deleteMany({ where: { listId: userId } });
    await tx.userList.update({ where: { id: userId }, data: {
      ownerName: "Silinmiş hesap", playlistName: null, bio: null, profileStatus: null, universityName: null, universityPublic: false,
      pinnedFeedPostId: null, profileShowcase: null, favoriteGenres: null, profileTheme: "aurora", profileDensity: "comfortable",
      profileBanner: "line", featuredAchievementId: null, email: null, passwordHash: null, slug: `silinmis-${userId}`, submitCode: null, status: "deleted",
    } });
    return { spotifyPlaylistId: account.spotifyPlaylistId };
  }, { maxWait: 5000, timeout: 30_000 });
}
