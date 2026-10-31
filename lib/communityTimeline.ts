import type { Prisma, PrismaClient } from "@prisma/client";
import { activeUser, community, visibleAuthor } from "./communities.ts";
import { CommunityError } from "./communityError.ts";
import type { GeneralCommunityItem } from "./communityGeneralFeed.ts";
import { validPostFilters } from "./communityPostFilters.ts";
import { communityBatchReactionMetrics } from "./communityPostReactions.ts";
import { parseTimelineCursor, timelineBefore, timelineCursor } from "./feedTimeline.ts";
import { compareTimelineItems } from "./feedTimelineOrder.ts";

export type CommunityTimelineOptions = {
  kind?: string;
  reviewKind?: string;
  eventFilter?: string;
  savedOnly?: boolean;
  cursor?: string | null;
};

const pageSize = 10;
const authorSelect = { id: true, slug: true, ownerName: true } as const;

/** One community's public reading scope, including community-only distribution. */
export async function communityTimeline(db: PrismaClient, slug: string, viewerId: string | null, options: CommunityTimelineOptions = {}, now = new Date()) {
  const { kind = "all", reviewKind = "all", eventFilter = "upcoming", savedOnly = false, cursor: rawCursor = null } = options;
  if (!["all", "discussion", "review", "event"].includes(kind) || !validPostFilters(kind === "event" ? "all" : kind, reviewKind)) throw new CommunityError("Geçersiz içerik filtresi.");
  if (!["upcoming", "past", "cancelled"].includes(eventFilter) || typeof savedOnly !== "boolean") throw new CommunityError("Geçersiz akış filtresi.");
  const cursor = parseTimelineCursor(rawCursor);
  if (cursor?.kind === "music") throw new CommunityError("Geçersiz topluluk akış konumu.");
  if (savedOnly && !viewerId) throw new CommunityError("Kaydettiklerini görmek için giriş yap.", 401);

  return db.$transaction(async tx => {
    if (savedOnly) await activeUser(tx, viewerId!);
    const source = await community(tx, slug);
    const author = visibleAuthor(viewerId);
    const eventWhere: Prisma.CommunityEventWhereInput = kind === "all"
      ? { status: { in: ["scheduled", "cancelled"] }, startsAt: { gt: now } }
      : { status: eventFilter === "cancelled" ? "cancelled" : "scheduled", ...(eventFilter === "cancelled" ? {} : { startsAt: eventFilter === "past" ? { lte: now } : { gt: now } }) };

    const [posts, events] = await Promise.all([
      kind === "event" ? [] : tx.communityPost.findMany({
        where: { communityId: source.id, status: "published", author, ...(kind === "all" ? {} : { type: kind }), ...(reviewKind === "all" ? {} : { reviewKind }), ...(savedOnly ? { saves: { some: { userId: viewerId! } } } : {}), ...timelineBefore(cursor, "post") },
        select: { id: true, title: true, body: true, type: true, reviewKind: true, subjectTitle: true, rating: true, spoiler: true, referenceProvider: true, createdAt: true, author: { select: authorSelect },
          _count: { select: { comments: { where: { status: "published", author: visibleAuthor(viewerId) } } } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: pageSize + 1,
      }),
      savedOnly || (kind !== "all" && kind !== "event") ? [] : tx.communityEvent.findMany({
        where: { communityId: source.id, organizer: author, ...eventWhere, ...timelineBefore(cursor, "event") },
        select: { id: true, title: true, description: true, city: true, venue: true, startsAt: true, timeZone: true, capacity: true, status: true, createdAt: true, organizer: { select: authorSelect } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: pageSize + 1,
      }),
    ]);
    const metrics = await communityBatchReactionMetrics(tx, posts.map(post => ({ ...post, community: source })), viewerId);
    const communityIdentity = { slug: source.slug, name: source.name };
    const items: GeneralCommunityItem[] = [
      ...posts.map(({ body, createdAt, author: postAuthor, _count, ...post }, index) => ({ ...post, ...metrics[index], commentCount: _count.comments, kind: "post" as const, community: communityIdentity, author: { slug: postAuthor.slug, ownerName: postAuthor.ownerName }, createdAt: createdAt.toISOString(), content: post.spoiler ? "" : body, excerpt: post.spoiler ? "" : body.slice(0, 240) })),
      ...events.map(({ description, createdAt, startsAt, organizer, ...event }) => ({ ...event, kind: "event" as const, community: communityIdentity, author: { slug: organizer.slug, ownerName: organizer.ownerName }, createdAt: createdAt.toISOString(), startsAt: startsAt.toISOString(), content: description, excerpt: description.slice(0, 240) })),
    ].sort(compareTimelineItems);
    const page = items.slice(0, pageSize), last = page.at(-1);
    return { items: page, nextCursor: items.length > pageSize && last ? timelineCursor(last) : null };
  });
}

export type CommunityTimelinePage = Awaited<ReturnType<typeof communityTimeline>>;
