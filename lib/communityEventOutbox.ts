import type { PrismaClient } from "@prisma/client";
import { visibleAuthor } from "./communities.ts";
import { EVENT_NOTIFICATION_TYPES } from "./communityEventNotifications.ts";

export const EVENT_OUTBOX_BATCH_SIZE = 50;
export const EVENT_OUTBOX_MAX_FAILURES = 5;
const due = (now: Date) => ({ completedAt: null, failedAt: null, availableAt: { lte: now } });
type BatchResult = { status: "idle" | "processed" | "retry" | "failed"; delivered: number; skipped: number };

export async function processEventNotificationBatch(db: PrismaClient, options: { now?: Date; batchSize?: number } = {}): Promise<BatchResult> {
  const now = options.now ?? new Date(), batchSize = options.batchSize ?? EVENT_OUTBOX_BATCH_SIZE;
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > EVENT_OUTBOX_BATCH_SIZE) throw new Error("Invalid event outbox batch size");
  const job = await db.communityEventNotificationJob.findFirst({ where: due(now), orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }, { id: "asc" }] });
  if (!job) return { status: "idle", delivered: 0, skipped: 0 };
  try {
    return await db.$transaction(async tx => {
      // First statement acquires SQLite's writer lock. Competing workers either lose this
      // revision check or observe the committed batch. A crash rolls the entire batch back.
      const locked = await tx.communityEventNotificationJob.updateMany({ where: { id: job.id, revision: job.revision, ...due(now) }, data: { revision: { increment: 1 } } });
      if (!locked.count) return { status: "idle", delivered: 0, skipped: 0 };
      if (!EVENT_NOTIFICATION_TYPES.includes(job.type)) throw new Error("Invalid event outbox type");
      const source = await tx.communityEvent.findUniqueOrThrow({ where: { id: job.eventId }, select: { organizerId: true, communityId: true, organizer: { select: { status: true } } } });
      const actor = await tx.userList.findUniqueOrThrow({ where: { id: job.actorId }, select: { status: true } });
      const recipients = await tx.communityEventNotificationRecipient.findMany({ where: { jobId: job.id }, take: batchSize, orderBy: { userId: "asc" }, select: { userId: true } });
      const ids = recipients.map(item => item.userId);
      // Do not re-read RSVP: cancellation has already withdrawn it. The audience is the
      // immutable mutation-time snapshot, narrowed again by current privacy/access rules.
      const eligible = actor.status === "active" && source.organizer.status === "active" ? await tx.userList.findMany({
        where: { id: { in: ids, not: job.actorId }, AND: [visibleAuthor(job.actorId), visibleAuthor(source.organizerId)],
          communityMemberships: { some: { communityId: source.communityId, status: "active" } } }, select: { id: true },
      }) : [];
      for (const user of eligible) {
        const id = `${job.id}:${user.id}`;
        await tx.notification.upsert({ where: { id }, update: {}, create: { id, userId: user.id, actorId: job.actorId, type: job.type, communityEventId: job.eventId, createdAt: job.createdAt } });
      }
      await tx.communityEventNotificationRecipient.deleteMany({ where: { jobId: job.id, userId: { in: ids } } });
      const remaining = await tx.communityEventNotificationRecipient.count({ where: { jobId: job.id } });
      await tx.communityEventNotificationJob.update({ where: { id: job.id }, data: {
        failures: 0, errorCode: null, availableAt: now, ...(remaining === 0 ? { completedAt: now } : {}),
      } });
      return { status: "processed", delivered: eligible.length, skipped: ids.length - eligible.length };
    }, { maxWait: 5000, timeout: 10_000 });
  } catch (error) {
    const failures = job.failures + 1, failed = failures >= EVENT_OUTBOX_MAX_FAILURES;
    const rawCode = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "WORKER_ERROR";
    const errorCode = /^[A-Z0-9_]{1,40}$/.test(rawCode) ? rawCode : "WORKER_ERROR";
    // Persist backoff separately after rollback; never log query text, user IDs or payloads.
    // CAS also prevents an older failed worker from overwriting another worker's progress.
    const recorded = await db.communityEventNotificationJob.updateMany({ where: { id: job.id, revision: job.revision, completedAt: null, failedAt: null }, data: {
      revision: { increment: 1 }, failures, errorCode, availableAt: new Date(now.getTime() + Math.min(300_000, 1000 * 2 ** (failures - 1))), ...(failed ? { failedAt: now } : {}),
    } });
    return { status: recorded.count ? failed ? "failed" : "retry" : "idle", delivered: 0, skipped: 0 };
  }
}

export async function eventOutboxStatus(db: PrismaClient, now = new Date()) {
  const [pending, ready, failed, oldest] = await Promise.all([
    db.communityEventNotificationJob.count({ where: { completedAt: null, failedAt: null } }),
    db.communityEventNotificationJob.count({ where: due(now) }),
    db.communityEventNotificationJob.count({ where: { failedAt: { not: null } } }),
    db.communityEventNotificationJob.findFirst({ where: { completedAt: null, failedAt: null }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
  ]);
  return { pending, ready, failed, oldestPendingAt: oldest?.createdAt.toISOString() ?? null };
}

export async function retryFailedEventNotifications(db: PrismaClient, now = new Date()) {
  return db.communityEventNotificationJob.updateMany({ where: { completedAt: null, failedAt: { not: null } }, data: {
    failedAt: null, failures: 0, errorCode: null, availableAt: now, revision: { increment: 1 },
  } });
}
