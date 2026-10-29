import type { Prisma, PrismaClient } from "@prisma/client";
import { activeUser, communityPage, visibleAuthor } from "./communities.ts";
import { CommunityError } from "./communityError.ts";
import { validPostFilters } from "./communityPostFilters.ts";
import { communityBatchReactionMetrics } from "./communityPostReactions.ts";

export async function communitySavedPosts(db: PrismaClient, viewerId: string | null, page = 1, postType = "all", reviewKind = "all") {
  if (!viewerId) throw new CommunityError("Kaydettiklerini görmek için giriş yap.", 401);
  communityPage(String(page));
  if (!validPostFilters(postType, reviewKind)) throw new CommunityError("Geçersiz içerik filtresi.");
  return db.$transaction(async tx => {
    await activeUser(tx, viewerId);
    const where: Prisma.CommunityPostSaveWhereInput = { userId: viewerId, post: { status: "published", author: visibleAuthor(viewerId), ...(postType === "all" ? {} : { type: postType }), ...(reviewKind === "all" ? {} : { reviewKind }) } };
    const total = await tx.communityPostSave.count({ where });
    const rows = await tx.communityPostSave.findMany({ where, orderBy: [{ createdAt: "desc" }, { postId: "desc" }], take: 20, skip: (page - 1) * 20,
      select: { createdAt: true, post: { select: { id: true, title: true, body: true, type: true, reviewKind: true, subjectTitle: true, rating: true, spoiler: true, referenceProvider: true, createdAt: true, community: { select: { id: true, slug: true, name: true, status: true } }, author: { select: { id: true, slug: true, ownerName: true } } } } } });
    const metrics = await communityBatchReactionMetrics(tx, rows.map(row => row.post), viewerId);
    const items = rows.map(({ createdAt: savedAt, post: { body, community, author, createdAt, ...post } }, index) => ({ ...post, ...metrics[index], kind: "post" as const, savedAt: savedAt.toISOString(), createdAt: createdAt.toISOString(), content: post.spoiler ? "" : body, excerpt: post.spoiler ? "" : body.slice(0, 240), community: { slug: community.slug, name: community.name, status: community.status }, author: { slug: author.slug, ownerName: author.ownerName } }));
    return { items, page, hasMore: page * 20 < total && page < 100 };
  });
}
export type CommunitySavedPage = Awaited<ReturnType<typeof communitySavedPosts>>;
