import type { Prisma, PrismaClient } from "@prisma/client";
import { activeUser, communityPage, visibleAuthor } from "./communities.ts";
import { CommunityError } from "./communityError.ts";
import { AGENDA_ROLES, AGENDA_VIEWS } from "./communityAgendaFilters.ts";

export async function communityAgenda(db: PrismaClient, viewerId: string | null, page = 1, view = "upcoming", role = "all", now = new Date()) {
  if (!viewerId) throw new CommunityError("Etkinliklerini görmek için giriş yap.", 401);
  communityPage(String(page));
  if (!Object.hasOwn(AGENDA_VIEWS, view) || !Object.hasOwn(AGENDA_ROLES, role)) throw new CommunityError("Geçersiz etkinlik görünümü.");
  return db.$transaction(async tx => {
    await activeUser(tx, viewerId);
    const ownResponse: Prisma.CommunityEventWhereInput = { responses: { some: { userId: viewerId, status: { in: view === "upcoming" ? ["attending", "interested"] : ["attending", "interested", "withdrawn"] } } } };
    const owner = { organizerId: viewerId };
    const where: Prisma.CommunityEventWhereInput = {
      organizer: visibleAuthor(viewerId), status: view === "cancelled" ? "cancelled" : "scheduled",
      ...(view === "upcoming" ? { startsAt: { gt: now }, community: { status: "active" } } : view === "past" ? { startsAt: { lte: now } } : {}),
      ...(role === "responded" ? ownResponse : role === "organizing" ? owner : { OR: [ownResponse, owner] }),
    };
    const total = await tx.communityEvent.count({ where });
    const rows = await tx.communityEvent.findMany({ where, take: 20, skip: (page - 1) * 20, orderBy: [{ startsAt: view === "upcoming" ? "asc" : "desc" }, { id: "asc" }],
      select: { id: true, title: true, startsAt: true, timeZone: true, city: true, venue: true, capacity: true, status: true, organizerId: true, community: { select: { slug: true, name: true, status: true } }, organizer: { select: { slug: true, ownerName: true } }, responses: { where: { userId: viewerId }, take: 1, select: { status: true } } } });
    return { items: rows.map(({ organizerId, responses, startsAt, ...event }) => ({ ...event, startsAt: startsAt.toISOString(), isOrganizer: organizerId === viewerId, viewerStatus: responses[0]?.status ?? null, canWithdraw: responses[0]?.status === "attending" || responses[0]?.status === "interested" })), page, hasMore: page < 100 && page * 20 < total };
  });
}
export type CommunityAgendaPage = Awaited<ReturnType<typeof communityAgenda>>;
