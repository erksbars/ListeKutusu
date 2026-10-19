import type { Prisma, PrismaClient } from "@prisma/client";
import { CommunityError } from "./communityError.ts";
import { activeUser, community, membership, visibleAuthor } from "./communities.ts";
import { recordCommunityAction } from "./communityAudit.ts";
import { enqueueArchiveNotifications } from "./communityEventNotifications.ts";

export async function lockActiveAccount(tx: Prisma.TransactionClient, userId: string) {
  // No timestamps/profile changes: acquire SQLite's writer lock before lifecycle checks.
  if (!await tx.$executeRaw`UPDATE "UserList" SET "id" = "id" WHERE "id" = ${userId} AND "status" = 'active'`) throw new CommunityError("Önce giriş yapmalısın.", 401);
}

export async function archiveCommunity(tx: Prisma.TransactionClient, communityId: string, actorId: string, now: Date, notify = true) {
  const row = await tx.community.findUniqueOrThrow({ where: { id: communityId } });
  if (row.status === "archived") return;
  if (notify) await enqueueArchiveNotifications(tx, communityId, actorId, now);
  await tx.communityEventRsvp.updateMany({ where: { event: { communityId, status: "scheduled", startsAt: { gt: now } }, status: { in: ["attending", "interested"] } }, data: { status: "withdrawn" } });
  await tx.communityEvent.updateMany({ where: { communityId, status: "scheduled", startsAt: { gt: now } }, data: { status: "cancelled", contentVersion: { increment: 1 }, revision: { increment: 1 } } });
  await tx.communityOwnershipOffer.deleteMany({ where: { communityId } });
  await tx.community.update({ where: { id: communityId }, data: { status: "archived", archivedAt: now, lifecycleRevision: { increment: 1 } } });
  await recordCommunityAction(tx, communityId, actorId, "archive-community", "community", communityId);
}

export function createCommunityLifecycle(db: PrismaClient, clock = () => new Date()) {
  return {
    async read(slug: string, userId: string | null) {
      if (!userId) throw new CommunityError("Önce giriş yapmalısın.", 401);
      await activeUser(db, userId);
      const row = await community(db, slug);
      const offer = await db.communityOwnershipOffer.findUnique({ where: { communityId: row.id }, select: { id: true, fromUserId: true, toUserId: true, expiresAt: true, toUser: { select: { ownerName: true, status: true } } } });
      const owner = row.ownerId === userId;
      const member = await db.communityMember.findUnique({ where: { communityId_userId: { communityId: row.id, userId } } });
      return { owner, status: row.status, offer: offer && row.status === "active" && offer.fromUserId === row.ownerId && offer.expiresAt > clock() && offer.toUser.status === "active" && (owner || (offer.toUserId === userId && member?.status === "active"))
        ? { id: offer.id, toName: offer.toUser.ownerName, expiresAt: offer.expiresAt, canAccept: offer.toUserId === userId } : null };
    },
    async incoming(userId: string | null) {
      if (!userId) throw new CommunityError("Önce giriş yapmalısın.", 401);
      await activeUser(db, userId);
      const offers = await db.communityOwnershipOffer.findMany({ where: { toUserId: userId, expiresAt: { gt: clock() }, fromUser: visibleAuthor(userId), community: { status: "active", members: { some: { userId, status: "active" } } } }, take: 21, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, expiresAt: true, fromUserId: true, community: { select: { slug: true, name: true, ownerId: true } } } });
      return { offers: offers.slice(0, 20).filter(offer => offer.fromUserId === offer.community.ownerId).map(offer => ({ id: offer.id, expiresAt: offer.expiresAt, community: { slug: offer.community.slug, name: offer.community.name } })), hasMore: offers.length > 20 };
    },
    async mutate(slug: string, userId: string, body: Record<string, unknown>) {
      if (!["offer", "accept", "decline", "cancel", "archive", "restore"].includes(String(body.action))) throw new CommunityError("Geçersiz sahiplik işlemi.");
      return db.$transaction(async tx => {
        await lockActiveAccount(tx, userId);
        const row = await community(tx, slug), now = clock();
        const member = await membership(tx, row.id, userId, true);
        const owner = row.ownerId === userId && member.role === "owner";
        if (body.action === "archive" || body.action === "restore") {
          if (!owner) throw new CommunityError("Bu işlem yalnız topluluk sahibine açık.", 403);
          if (body.confirmation !== (body.action === "archive" ? "TOPLULUĞU ARŞİVLE" : "TOPLULUĞU YENİDEN AÇ")) throw new CommunityError("Topluluk işlemini açıkça onayla.");
          if (body.action === "archive") await archiveCommunity(tx, row.id, userId, now);
          else if (row.status === "archived") {
            await tx.community.update({ where: { id: row.id }, data: { status: "active", archivedAt: null, lifecycleRevision: { increment: 1 } } });
            await recordCommunityAction(tx, row.id, userId, "restore-community", "community", row.id);
          }
          return { ok: true };
        }
        if (row.status !== "active") throw new CommunityError("Arşivde sahiplik devri yapılamaz.", 409);
        if (body.action === "offer") {
          if (!owner) throw new CommunityError("Sahiplik teklifini yalnız mevcut sahibi gönderebilir.", 403);
          if (body.confirmation !== "SAHİPLİĞİ DEVRET") throw new CommunityError("Sahiplik teklifini açıkça onayla.");
          if (body.toUserId === undefined && typeof body.toSlug === "string" && body.toSlug.length <= 100) {
            const target = await tx.userList.findFirst({ where: { slug: body.toSlug.trim(), ...visibleAuthor(userId) }, select: { id: true } });
            body = { ...body, toUserId: target?.id };
          }
          if (typeof body.toUserId !== "string" || !body.toUserId || body.toUserId.length > 100 || body.toUserId === userId) throw new CommunityError("Başka bir aktif topluluk üyesi seç.");
          const target = await membership(tx, row.id, body.toUserId);
          if (target.role === "owner" || !await tx.userList.findFirst({ where: { id: body.toUserId, ...visibleAuthor(userId) }, select: { id: true } })) throw new CommunityError("Uygun üye bulunamadı.", 404);
          const existing = await tx.communityOwnershipOffer.findUnique({ where: { communityId: row.id } });
          if (existing && existing.expiresAt > now) {
            if (existing.toUserId === body.toUserId && existing.fromUserId === userId) return { ok: true };
            throw new CommunityError("Önce mevcut sahiplik teklifini geri çek.", 409);
          }
          await tx.communityOwnershipOffer.deleteMany({ where: { communityId: row.id } });
          await tx.communityOwnershipOffer.create({ data: { communityId: row.id, fromUserId: userId, toUserId: body.toUserId, expiresAt: new Date(now.getTime() + 7 * 86_400_000) } });
          await recordCommunityAction(tx, row.id, userId, "offer-ownership", "member", body.toUserId);
          return { ok: true };
        }
        if (typeof body.offerId !== "string") throw new CommunityError("Teklif kimliği gerekli.");
        const offer = await tx.communityOwnershipOffer.findFirst({ where: { communityId: row.id, id: body.offerId, fromUserId: row.ownerId, expiresAt: { gt: now } } });
        if (!offer) throw new CommunityError("Teklif geçersiz, değişmiş veya süresi dolmuş.", 409);
        if (body.action === "cancel") {
          if (!owner) throw new CommunityError("Bu teklifi geri çekemezsin.", 403);
        } else if (offer.toUserId !== userId) throw new CommunityError("Teklif sana ait değil.", 403);
        if (body.action === "accept") {
          if (body.confirmation !== "SAHİPLİĞİ KABUL ET") throw new CommunityError("Sahiplik sorumluluğunu açıkça onayla.");
          await activeUser(tx, offer.fromUserId);
          if (!await tx.userList.findFirst({ where: { id: offer.fromUserId, ...visibleAuthor(userId) }, select: { id: true } })) throw new CommunityError("Teklif artık kullanılamıyor.", 409);
          const previous = await membership(tx, row.id, offer.fromUserId);
          if (previous.role !== "owner") throw new CommunityError("Topluluk sahibi değişmiş.", 409);
          await tx.communityMember.update({ where: { communityId_userId: { communityId: row.id, userId: offer.fromUserId } }, data: { role: "member" } });
          await tx.communityMember.update({ where: { communityId_userId: { communityId: row.id, userId } }, data: { role: "owner" } });
          await tx.community.update({ where: { id: row.id }, data: { ownerId: userId, lifecycleRevision: { increment: 1 } } });
        }
        await tx.communityOwnershipOffer.delete({ where: { communityId: row.id } });
        await recordCommunityAction(tx, row.id, userId, body.action === "accept" ? "accept-ownership" : body.action === "decline" ? "decline-ownership" : "cancel-ownership", "member", offer.toUserId);
        return { ok: true };
      }, { maxWait: 5000, timeout: 10_000 });
    },
  };
}
