import type { PrismaClient } from "@prisma/client";
import { communityGeneralFeed } from "./communityGeneralFeed.ts";
import { visibleAuthor } from "./communities.ts";
import { CommunityError } from "./communityError.ts";
import { musicFeedInclude, serializeMusicFeedPost } from "./musicFeedPresentation.ts";
import { parseTimelineCursor, timelineBefore, timelineCursor } from "./feedTimeline.ts";
import { compareTimelineItems } from "./feedTimelineOrder.ts";

export async function mixedFeed(db: PrismaClient, viewerId: string | null, rawCursor: string | null = null, filter = "all", scope = "all", now = new Date()) {
  if (scope !== "all" && scope !== "following") throw new CommunityError("Bu akış kapsamı karma sıralamayı desteklemiyor.");
  if (!["all", "music", "discussion", "review", "event"].includes(filter)) throw new CommunityError("Geçersiz içerik türü.");
  if (scope === "following" && !viewerId) throw new CommunityError("Takip akışı için giriş yapmalısın.", 401);
  const cursor = parseTimelineCursor(rawCursor), followingOnly = scope === "following";
  const [music, communities] = await Promise.all([
    filter !== "all" && filter !== "music" ? [] : db.feedPost.findMany({
      where: { status: "published", author: { ...visibleAuthor(viewerId), ...(followingOnly ? { followers: { some: { followerId: viewerId! } } } : {}) },
        ...(viewerId ? { hides: { none: { userId: viewerId } } } : {}), ...timelineBefore(cursor, "music") },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 11, include: musicFeedInclude(viewerId),
    }),
    filter === "music" ? { items: [], nextCursor: null } : communityGeneralFeed(db, viewerId, rawCursor, filter, now, followingOnly),
  ]);
  const items = [
    ...music.map(row => ({ kind: "music" as const, id: row.id, createdAt: row.createdAt.toISOString(), post: serializeMusicFeedPost(row, viewerId) })),
    ...communities.items,
  ].sort(compareTimelineItems);
  const page = items.slice(0, 10), last = page.at(-1);
  return { posts: page.flatMap(item => item.kind === "music" ? [item.post] : []),
    communityItems: page.flatMap(item => item.kind === "music" ? [] : [item]),
    nextCursor: (items.length > 10 || communities.nextCursor !== null) && last ? timelineCursor(last) : null, emptyReason: null };
}
