import type { Prisma } from "@prisma/client";
import { visibleAuthor } from "./communities.ts";

export const EVENT_NOTIFICATION_TYPES = ["community_event_updated", "community_event_cancelled", "community_event_removed"];
export function notificationVisibility(userId: string): Prisma.NotificationWhereInput {
  return { userId, OR: [
    { type: { notIn: EVENT_NOTIFICATION_TYPES } },
    { type: { in: EVENT_NOTIFICATION_TYPES }, actor: visibleAuthor(userId), communityEvent: { organizer: visibleAuthor(userId), community: { members: { some: { userId, status: "active" } } } } },
  ] };
}
export async function notifyEventResponders(tx: Prisma.TransactionClient, event: { id: string; communityId: string; organizerId: string }, actorId: string, version: number, type: string) {
  if (!EVENT_NOTIFICATION_TYPES.includes(type)) throw new Error("Unsupported event notification type");
  const id = `event:${event.id}:${version}:${type}`;
  if (await tx.communityEventNotificationJob.findUnique({ where: { id }, select: { id: true } })) return;
  await tx.communityEventNotificationJob.create({ data: { id, eventId: event.id, actorId, version, type } });
  // SQLite-specific snapshot in one statement: never load an unbounded audience into the request.
  // Capture before cancellation/removal withdraws the RSVP rows. Values remain parameterized.
  await tx.$executeRaw`
    INSERT INTO "CommunityEventNotificationRecipient" ("jobId", "userId")
    SELECT ${id}, u."id" FROM "UserList" u
    JOIN "CommunityMember" m ON m."userId" = u."id" AND m."communityId" = ${event.communityId} AND m."status" = 'active'
    WHERE u."status" = 'active' AND u."id" <> ${actorId}
      AND (u."id" = ${event.organizerId} OR EXISTS (
        SELECT 1 FROM "CommunityEventRsvp" r WHERE r."eventId" = ${event.id} AND r."userId" = u."id" AND r."status" IN ('attending', 'interested')
      ))
      AND NOT EXISTS (SELECT 1 FROM "UserBlock" b WHERE
        (b."blockerId" = u."id" AND b."blockedId" IN (${actorId}, ${event.organizerId})) OR
        (b."blockedId" = u."id" AND b."blockerId" IN (${actorId}, ${event.organizerId})))
  `;
}

export async function enqueueArchiveNotifications(tx: Prisma.TransactionClient, communityId: string, actorId: string, now: Date) {
  // Archive can close many events. Keep snapshot fan-out set-based, not one request loop per event/user.
  await tx.$executeRaw`
    INSERT OR IGNORE INTO "CommunityEventNotificationJob" ("id", "eventId", "actorId", "version", "type", "createdAt", "availableAt")
    SELECT 'event:' || e.id || ':' || (e.contentVersion + 1) || ':community_event_cancelled', e.id, ${actorId}, e.contentVersion + 1, 'community_event_cancelled', ${now}, ${now}
    FROM CommunityEvent e WHERE e.communityId = ${communityId} AND e.status = 'scheduled' AND e.startsAt > ${now}
  `;
  await tx.$executeRaw`
    INSERT OR IGNORE INTO "CommunityEventNotificationRecipient" ("jobId", "userId")
    SELECT j.id, u.id FROM CommunityEvent e
    JOIN CommunityEventNotificationJob j ON j.eventId = e.id AND j.version = e.contentVersion + 1 AND j.type = 'community_event_cancelled' AND j.actorId = ${actorId}
    JOIN CommunityMember m ON m.communityId = e.communityId AND m.status = 'active'
    JOIN UserList u ON u.id = m.userId AND u.status = 'active'
    WHERE e.communityId = ${communityId} AND e.status = 'scheduled' AND e.startsAt > ${now} AND u.id <> ${actorId}
      AND (u.id = e.organizerId OR EXISTS (SELECT 1 FROM CommunityEventRsvp r WHERE r.eventId = e.id AND r.userId = u.id AND r.status IN ('attending', 'interested')))
      AND NOT EXISTS (SELECT 1 FROM UserBlock b WHERE
        (b.blockerId = u.id AND b.blockedId IN (${actorId}, e.organizerId)) OR
        (b.blockedId = u.id AND b.blockerId IN (${actorId}, e.organizerId)))
  `;
}
