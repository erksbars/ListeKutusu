import { Prisma, type PrismaClient } from "@prisma/client";
import { CommunityError } from "./communityError.ts";
import { activeUser, membership, visibleAuthor } from "./communities.ts";

export async function withdrawIneligibleEventResponses(tx: Prisma.TransactionClient, eventId: string, communityId: string) {
  await tx.communityEventRsvp.updateMany({ where: { eventId, status: { in: ["attending", "interested"] }, OR: [
    { user: { status: { not: "active" } } },
    { user: { communityMemberships: { none: { communityId, status: "active" } } } },
  ] }, data: { status: "withdrawn" } });
}

export async function respondToCommunityEvent(db: PrismaClient, slug: string, eventId: string, userId: string, status: unknown, now: () => Date) {
  if (status !== "attending" && status !== "interested" && status !== "withdrawn") throw new CommunityError("Geçersiz katılım durumu.");
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(async tx => {
        // First statement is a write: acquire SQLite's writer lock before checking the last seat.
        const locked = await tx.communityEvent.updateMany({ where: { id: eventId, community: { slug } }, data: { revision: { increment: 1 } } });
        if (!locked.count) throw new CommunityError("Etkinlik bulunamadı.", 404);
        await activeUser(tx, userId);
        const event = await tx.communityEvent.findUniqueOrThrow({ where: { id: eventId } });
        const key = { eventId, userId };
        if (status === "withdrawn") {
          await tx.communityEventRsvp.updateMany({ where: key, data: { status } });
          return { ok: true };
        }
        await membership(tx, event.communityId, userId);
        if (!await tx.userList.findFirst({ where: { id: event.organizerId, ...visibleAuthor(userId) }, select: { id: true } })) throw new CommunityError("Etkinlik bulunamadı.", 404);
        if (event.status !== "scheduled" || event.startsAt <= now()) throw new CommunityError("Bu etkinliğe yeni katılım kapalı.", 409);
        // Permanently withdraw stale intentions, so account reactivation/rejoining cannot revive an old seat.
        await withdrawIneligibleEventResponses(tx, eventId, event.communityId);
        const existing = await tx.communityEventRsvp.findUnique({ where: { eventId_userId: key } });
        if (status === "attending" && existing?.status !== "attending" && event.capacity !== null) {
          const occupied = await tx.communityEventRsvp.count({ where: { eventId, status: "attending" } });
          if (occupied >= event.capacity) throw new CommunityError("Etkinlik dolu. İlgileniyorum seçebilir veya daha sonra tekrar deneyebilirsin.", 409);
        }
        await tx.communityEventRsvp.upsert({ where: { eventId_userId: key }, create: { ...key, status }, update: { status } });
        return { ok: true };
      }, { maxWait: 5000, timeout: 10_000 });
    } catch (error) {
      const busy = error instanceof Prisma.PrismaClientKnownRequestError && ["P1008", "P2028", "P2034"].includes(error.code);
      if (!busy || attempt >= 2) throw error;
      await new Promise(resolve => setTimeout(resolve, 25 * (attempt + 1)));
    }
  }
}
