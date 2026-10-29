import type { PrismaClient } from "@prisma/client";
import { visibleAuthor } from "./communities.ts";
import { CommunityError } from "./communityError.ts";
import { parseTimelineCursor, timelineBefore, timelineCursor } from "./feedTimeline.ts";
import { compareTimelineItems } from "./feedTimelineOrder.ts";
import { communityBatchReactionMetrics } from "./communityPostReactions.ts";

const communitySelect = { slug: true, name: true } as const;
const authorSelect = { ownerName: true, slug: true } as const;

export async function communityGeneralFeed(db: PrismaClient, viewerId: string | null, rawCursor: string | null = null, filter = "all", now = new Date(), followingOnly = false) {
  if (!["all", "discussion", "review", "event"].includes(filter)) throw new CommunityError("Geçersiz akış filtresi.");
  const cursor = parseTimelineCursor(rawCursor);
  if (followingOnly && !viewerId) throw new CommunityError("Takip akışı için giriş yapmalısın.", 401);
  const author = { ...visibleAuthor(viewerId), ...(followingOnly ? { followers: { some: { followerId: viewerId! } } } : {}) };
  const [posts, events] = await Promise.all([
    filter === "event" ? [] : db.communityPost.findMany({
      where: { community: { status: "active" }, distribution: "general", status: "published", author, ...(filter === "all" ? {} : { type: filter }), ...timelineBefore(cursor, "post") },
      select: { id: true, title: true, body: true, type: true, reviewKind: true, subjectTitle: true, rating: true, spoiler: true, referenceProvider: true, createdAt: true, community: { select: { ...communitySelect, id: true, status: true } }, author: { select: { ...authorSelect, id: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 11,
    }),
    filter !== "all" && filter !== "event" ? [] : db.communityEvent.findMany({
      where: { community: { status: "active" }, distribution: "general", status: { in: ["scheduled", "cancelled"] }, startsAt: { gt: now }, organizer: author, ...timelineBefore(cursor, "event") },
      select: { id: true, title: true, description: true, city: true, venue: true, startsAt: true, timeZone: true, capacity: true, status: true, createdAt: true, community: { select: communitySelect }, organizer: { select: authorSelect } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 11,
    }),
  ]);
  const metrics = await communityBatchReactionMetrics(db, posts, viewerId);
  const items = [
    ...posts.map(({ body, createdAt, community, author, ...post }, index) => ({ ...post, ...metrics[index], community: { slug: community.slug, name: community.name }, author: { slug: author.slug, ownerName: author.ownerName }, kind: "post" as const, createdAt: createdAt.toISOString(), content: post.spoiler ? "" : body, excerpt: post.spoiler ? "" : body.slice(0, 240) })),
    ...events.map(({ description, createdAt, startsAt, organizer, ...event }) => ({ ...event, kind: "event" as const, author: organizer, createdAt: createdAt.toISOString(), startsAt: startsAt.toISOString(), content: description, excerpt: description.slice(0, 240) })),
  ].sort(compareTimelineItems);
  const page = items.slice(0, 10), last = page.at(-1);
  return { items: page, nextCursor: items.length > 10 && last ? timelineCursor(last) : null };
}

export type GeneralCommunityItem = Awaited<ReturnType<typeof communityGeneralFeed>>["items"][number];
