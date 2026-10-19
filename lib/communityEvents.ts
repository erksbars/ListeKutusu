import type { Prisma, PrismaClient } from "@prisma/client";
import { CommunityError } from "./communityError.ts";
import { activeUser, community, membership, visibleAuthor } from "./communities.ts";
import { respondToCommunityEvent, withdrawIneligibleEventResponses } from "./communityAttendance.ts";
import { notifyEventResponders } from "./communityEventNotifications.ts";
import { communityDistribution } from "./communityDistribution.ts";
import { discoveryKey } from "./communityDiscovery.ts";
import { moderationNote, recordCommunityAction, reviewCommunityReports } from "./communityAudit.ts";

export const EVENT_TIME_ZONE = "Europe/Istanbul";
function field(raw: unknown, name: string, min: number, max: number) {
  if (typeof raw !== "string") throw new CommunityError(`${name} gerekli.`);
  const value = raw.trim().replace(/\r\n?/g, "\n");
  if (value.length < min || value.length > max) throw new CommunityError(`${name} ${min}–${max} karakter olmalı.`);
  return value;
}
export function communityEventInput(body: Record<string, unknown>, now = new Date()) {
  if (body.publicLocationConfirmed !== true) throw new CommunityError("Etkinlik ve mekân bilgilerinin herkese açık olacağını onayla.");
  const localStart = field(body.localStart, "Başlangıç", 16, 16);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localStart) || (body.timeZone !== undefined && body.timeZone !== EVENT_TIME_ZONE)) throw new CommunityError("Geçerli Türkiye tarihi ve saati seç.");
  const startsAt = new Date(`${localStart}+03:00`);
  if (!Number.isFinite(startsAt.getTime())) throw new CommunityError("Geçersiz başlangıç tarihi.");
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: EVENT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(startsAt);
  const part = (name: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === name)?.value;
  if (`${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}` !== localStart) throw new CommunityError("Geçersiz takvim tarihi veya saat.");
  if (startsAt <= now || startsAt.getTime() > now.getTime() + 366 * 86_400_000) throw new CommunityError("Etkinlik gelecekte ve en fazla bir yıl içinde başlamalı.");
  const capacity = body.capacity === undefined || body.capacity === null ? null : body.capacity;
  const city = field(body.city, "Şehir", 2, 80);
  if (capacity !== null && (typeof capacity !== "number" || !Number.isInteger(capacity) || capacity < 2 || capacity > 200)) throw new CommunityError("Kapasite 2–200 arasında tam sayı olmalı veya boş bırakılmalı.");
  return { title: field(body.title, "Başlık", 3, 120), description: field(body.description, "Açıklama", 20, 5000), startsAt, timeZone: EVENT_TIME_ZONE,
    city, cityKey: discoveryKey(city), venue: field(body.venue, "Mekân", 3, 160), capacity: capacity as number | null };
}
const select = { id: true, title: true, description: true, startsAt: true, timeZone: true, city: true, venue: true, capacity: true, status: true, contentVersion: true, distribution: true,
  organizer: { select: { id: true, ownerName: true, slug: true } } } as const;
const canManage = (organizerId: string, viewerId: string | null, member: { role: string; status: string } | null) => Boolean(member?.status === "active" && (organizerId === viewerId || member.role === "owner" || member.role === "moderator"));
const eligibleResponseUser = (communityId: string, viewerId: string | null = null): Prisma.UserListWhereInput => ({ ...visibleAuthor(viewerId), communityMemberships: { some: { communityId, status: "active" } } });

export function createCommunityEvents(db: PrismaClient, clock = () => new Date()) {
  return {
    respond(slug: string, eventId: string, userId: string, status: unknown) { return respondToCommunityEvent(db, slug, eventId, userId, status, clock); },
    async report(slug: string, eventId: string, userId: string, reason: unknown) {
      const parsed = field(reason, "Bildirim nedeni", 3, 300);
      return db.$transaction(async tx => {
        // Serialize with event removal: a report cannot land after removal closes the queue.
        const locked = await tx.communityEvent.updateMany({ where: { id: eventId, community: { slug } }, data: { revision: { increment: 1 } } });
        if (!locked.count) throw new CommunityError("Etkinlik bulunamadı.", 404);
        await activeUser(tx, userId);
        const row = await community(tx, slug);
        await membership(tx, row.id, userId);
        const event = await tx.communityEvent.findFirst({ where: { id: eventId, communityId: row.id, status: { in: ["scheduled", "cancelled"] }, organizer: visibleAuthor(userId) }, select: { organizerId: true } });
        if (!event) throw new CommunityError("Etkinlik bulunamadı.", 404);
        if (event.organizerId === userId) throw new CommunityError("Kendi etkinliğini bildiremezsin.");
        const target = { reporterId: userId, targetType: "event", targetId: eventId };
        // One report per account/target; retries do not reopen a reviewed report.
        await tx.communityReport.upsert({ where: { reporterId_targetType_targetId: target }, update: {}, create: { ...target, communityId: row.id, reason: parsed } });
        return { ok: true };
      });
    },
    async create(slug: string, userId: string, body: Record<string, unknown>) {
      const input = communityEventInput(body, clock());
      return db.$transaction(async tx => {
        await activeUser(tx, userId);
        const row = await community(tx, slug);
        await membership(tx, row.id, userId);
        return { event: await tx.communityEvent.create({ data: { ...input, distribution: communityDistribution(body.distribution), communityId: row.id, organizerId: userId }, select: { id: true } }) };
      });
    },
    async list(slug: string, viewerId: string | null, page: number, filter: string) {
      if (filter !== "upcoming" && filter !== "past" && filter !== "cancelled") throw new CommunityError("Geçersiz etkinlik filtresi.");
      const row = await community(db, slug);
      const now = clock();
      const where: Prisma.CommunityEventWhereInput = { communityId: row.id, organizer: visibleAuthor(viewerId), status: filter === "cancelled" ? "cancelled" : "scheduled",
        ...(filter === "cancelled" ? {} : { startsAt: filter === "past" ? { lte: now } : { gt: now } }) };
      const [events, count] = await Promise.all([
        db.communityEvent.findMany({ where, select: { ...select, description: false }, skip: (page - 1) * 20, take: 20, orderBy: [{ startsAt: filter === "upcoming" ? "asc" : "desc" }, { id: "asc" }] }),
        db.communityEvent.count({ where }),
      ]);
      const ids = events.map(event => event.id);
      const [counts, responses] = await Promise.all([
        db.communityEventRsvp.groupBy({ by: ["eventId", "status"], where: { eventId: { in: ids }, status: { in: ["attending", "interested"] }, user: eligibleResponseUser(row.id) }, _count: { _all: true } }),
        viewerId ? db.communityEventRsvp.findMany({ where: { eventId: { in: ids }, userId: viewerId }, select: { eventId: true, status: true } }) : [],
      ]);
      return { events: events.map(event => ({ ...event, attendingCount: counts.find(item => item.eventId === event.id && item.status === "attending")?._count._all ?? 0,
        interestedCount: counts.find(item => item.eventId === event.id && item.status === "interested")?._count._all ?? 0, viewerStatus: responses.find(item => item.eventId === event.id)?.status ?? null })), page, hasMore: count > page * 20 };
    },
    async detail(slug: string, eventId: string, viewerId: string | null) {
      const row = await community(db, slug);
      const event = await db.communityEvent.findFirst({ where: { id: eventId, communityId: row.id, status: { in: ["scheduled", "cancelled"] }, organizer: visibleAuthor(viewerId) }, select });
      if (!event) throw new CommunityError("Etkinlik bulunamadı.", 404);
      const member = viewerId ? await db.communityMember.findUnique({ where: { communityId_userId: { communityId: row.id, userId: viewerId } } }) : null;
      const manage = row.status === "active" && canManage(event.organizer.id, viewerId, member);
      const [attendingCount, interestedCount, own, participants, report] = await Promise.all([
        db.communityEventRsvp.count({ where: { eventId, status: "attending", user: eligibleResponseUser(row.id) } }), db.communityEventRsvp.count({ where: { eventId, status: "interested", user: eligibleResponseUser(row.id) } }),
        viewerId ? db.communityEventRsvp.findUnique({ where: { eventId_userId: { eventId, userId: viewerId } }, select: { status: true } }) : null,
        manage ? db.communityEventRsvp.findMany({ where: { eventId, status: "attending", user: eligibleResponseUser(row.id, viewerId) }, take: 200, orderBy: [{ createdAt: "asc" }, { userId: "asc" }], select: { user: { select: { id: true, ownerName: true, slug: true } } } }) : [],
        viewerId ? db.communityReport.findUnique({ where: { reporterId_targetType_targetId: { reporterId: viewerId, targetType: "event", targetId: eventId } }, select: { status: true } }) : null,
      ]);
      return { event: { ...event, attendingCount, interestedCount, viewerStatus: own?.status ?? null }, canManage: manage,
        canReport: Boolean(row.status === "active" && member?.status === "active" && viewerId !== event.organizer.id && !report), reportStatus: report?.status ?? null,
        canRespond: row.status === "active" && member?.status === "active" && event.status === "scheduled" && event.startsAt > clock(), canWithdraw: Boolean(own && own.status !== "withdrawn"), participants: participants.map(item => item.user) };
    },
    async manage(slug: string, eventId: string, userId: string, action: unknown, rawNote?: unknown) {
      if (action !== "cancel" && action !== "remove") throw new CommunityError("Geçersiz etkinlik işlemi.");
      const note = moderationNote(rawNote);
      return db.$transaction(async tx => {
        const locked = await tx.communityEvent.updateMany({ where: { id: eventId, community: { slug } }, data: { revision: { increment: 1 } } });
        if (!locked.count) throw new CommunityError("Etkinlik bulunamadı.", 404);
        await activeUser(tx, userId);
        const row = await community(tx, slug);
        const actor = await membership(tx, row.id, userId);
        const event = await tx.communityEvent.findFirst({ where: { id: eventId, communityId: row.id, status: { in: ["scheduled", "cancelled"] }, organizer: visibleAuthor(userId) } });
        if (!event) throw new CommunityError("Etkinlik bulunamadı.", 404);
        if (!canManage(event.organizerId, userId, actor)) throw new CommunityError("Bu etkinliği yönetemezsin.", 403);
        if (action === "cancel" && event.status === "cancelled") return { ok: true };
        if (action === "cancel" && event.startsAt <= clock()) throw new CommunityError("Başlangıcı geçmiş etkinlik iptal edilemez.", 409);
        await notifyEventResponders(tx, event, userId, event.contentVersion + 1, action === "cancel" ? "community_event_cancelled" : "community_event_removed");
        await tx.communityEvent.update({ where: { id: eventId }, data: { status: action === "cancel" ? "cancelled" : "removed", contentVersion: { increment: 1 } } });
        await tx.communityEventRsvp.updateMany({ where: { eventId, status: { in: ["attending", "interested"] } }, data: { status: "withdrawn" } });
        if (action === "remove") await reviewCommunityReports(tx, { communityId: row.id, targetType: "event", targetId: eventId }, userId);
        await recordCommunityAction(tx, row.id, userId, `${action}-event`, "event", eventId, note);
        return { ok: true };
      });
    },
    async update(slug: string, eventId: string, userId: string, body: Record<string, unknown>) {
      const input = communityEventInput(body, clock());
      const note = moderationNote(body.moderationNote);
      if (typeof body.expectedVersion !== "number" || !Number.isInteger(body.expectedVersion) || body.expectedVersion < 0) throw new CommunityError("Geçerli düzenleme sürümü gerekli.");
      return db.$transaction(async tx => {
        const locked = await tx.communityEvent.updateMany({ where: { id: eventId, community: { slug } }, data: { revision: { increment: 1 } } });
        if (!locked.count) throw new CommunityError("Etkinlik bulunamadı.", 404);
        await activeUser(tx, userId);
        const row = await community(tx, slug), actor = await membership(tx, row.id, userId);
        const event = await tx.communityEvent.findFirst({ where: { id: eventId, communityId: row.id, organizer: visibleAuthor(userId), status: { not: "removed" } } });
        if (!event) throw new CommunityError("Etkinlik bulunamadı.", 404);
        if (!canManage(event.organizerId, userId, actor)) throw new CommunityError("Bu etkinliği düzenleyemezsin.", 403);
        if (event.status !== "scheduled" || event.startsAt <= clock()) throw new CommunityError("İptal edilen veya başlangıcı geçmiş etkinlik düzenlenemez.", 409);
        if (event.contentVersion !== body.expectedVersion) throw new CommunityError("Etkinlik değişti. Yeniden yükleyip düzenlemeyi tekrar aç.", 409);
        await withdrawIneligibleEventResponses(tx, eventId, row.id);
        const occupied = await tx.communityEventRsvp.count({ where: { eventId, status: "attending" } });
        if (input.capacity !== null && input.capacity < occupied) throw new CommunityError(`Kapasite mevcut ${occupied} katılımın altına indirilemez.`, 409);
        const distribution = communityDistribution(body.distribution, event.distribution);
        const changed = input.title !== event.title || input.description !== event.description || input.startsAt.getTime() !== event.startsAt.getTime() || input.city !== event.city || input.venue !== event.venue || input.capacity !== event.capacity;
        if (!changed && distribution !== event.distribution) {
          await tx.communityEvent.update({ where: { id: eventId }, data: { distribution, contentVersion: { increment: 1 } } });
          if (userId !== event.organizerId) await recordCommunityAction(tx, row.id, userId, "update-event", "event", eventId, note);
          return { ok: true, changed: true };
        }
        if (!changed) return { ok: true, changed: false };
        await tx.communityEvent.update({ where: { id: eventId }, data: { ...input, distribution, contentVersion: { increment: 1 } } });
        await notifyEventResponders(tx, event, userId, event.contentVersion + 1, "community_event_updated");
        if (userId !== event.organizerId) await recordCommunityAction(tx, row.id, userId, "update-event", "event", eventId, note);
        return { ok: true, changed: true };
      });
    },
  };
}
