import type { Prisma, PrismaClient } from "@prisma/client";
import { membership, visibleAuthor } from "./communities.ts";
import { CommunityError } from "./communityError.ts";

export async function setCommunityPostReaction(tx: Prisma.TransactionClient, source: { id: string }, userId: string, body: Record<string, unknown>) {
  if (!["set-like", "set-save"].includes(String(body.action)) || typeof body.active !== "boolean" || typeof body.postId !== "string" || !body.postId || body.postId.length > 100) throw new CommunityError("Geçerli paylaşım ve açık tercih gerekli.");
  if (body.surface !== undefined && body.surface !== "feed" && body.surface !== "saved" && body.surface !== "community") throw new CommunityError("Geçersiz etkileşim görünümü.");
  const like = body.action === "set-like";
  if (!body.active) {
    // A missing, blocked or removed target must not become an existence oracle.
    const own = { userId, postId: body.postId, post: { communityId: source.id } };
    if (like) await tx.communityPostLike.deleteMany({ where: own }); else await tx.communityPostSave.deleteMany({ where: own });
    return reactionResult(tx, source, userId, body);
  }
  await membership(tx, source.id, userId);
  const post = await tx.communityPost.findFirst({ where: { id: body.postId, communityId: source.id, status: "published", author: visibleAuthor(userId), ...(body.surface === "feed" ? { distribution: "general" } : {}) }, select: { id: true, authorId: true } });
  if (!post) throw new CommunityError("Paylaşım bulunamadı.", 404);
  if (like && post.authorId === userId) throw new CommunityError("Kendi paylaşımını beğenemezsin.", 403);
  const key = { userId, postId: post.id };
  if (like) {
    await tx.communityPostLike.upsert({ where: { userId_postId: key }, create: key, update: {} });
  } else {
    await tx.communityPostSave.upsert({ where: { userId_postId: key }, create: key, update: {} });
  }
  return reactionResult(tx, source, userId, body);
}

async function reactionResult(db: Prisma.TransactionClient, source: { id: string }, viewerId: string, body: Record<string, unknown>) {
  if (!body.surface) return { ok: true };
  const post = await db.communityPost.findFirst({ where: { id: body.postId as string, communityId: source.id, status: "published", author: visibleAuthor(viewerId), ...(body.surface === "feed" ? { distribution: "general", community: { status: "active" } } : {}) }, select: { id: true, author: { select: { id: true } }, community: { select: { id: true, status: true } } } });
  return { ok: true, reactionState: post ? (await communityBatchReactionMetrics(db, [post], viewerId))[0] : null };
}

type ReactionPost = { id: string; author: { id: string }; community: { id: string; status: string } };
export async function communityBatchReactionMetrics(db: Prisma.TransactionClient, posts: ReactionPost[], viewerId: string | null) {
  const ids = posts.map(post => post.id);
  if (!ids.length) return [];
  const sources = [...new Set(posts.map(post => post.community.id))];
  const viewer = viewerId ? await db.userList.findFirst({ where: { id: viewerId, status: "active" }, select: { communityMemberships: { where: { communityId: { in: sources }, status: "active" }, select: { communityId: true } } } }) : null;
  const actor = viewer ? viewerId : null;
  const [counts, likes, saves] = await Promise.all([
    db.communityPostLike.groupBy({ by: ["postId"], where: { user: visibleAuthor(viewerId), OR: sources.map(communityId => ({ postId: { in: posts.filter(post => post.community.id === communityId).map(post => post.id) }, user: { communityMemberships: { some: { communityId, status: "active" } } } })) }, _count: { _all: true } }),
    actor ? db.communityPostLike.findMany({ where: { postId: { in: ids }, userId: actor }, select: { postId: true } }) : [],
    actor ? db.communityPostSave.findMany({ where: { postId: { in: ids }, userId: actor }, select: { postId: true } }) : [],
  ]);
  return posts.map(post => {
    const canAdd = Boolean(viewer?.communityMemberships.some(member => member.communityId === post.community.id) && post.community.status === "active");
    return { likeCount: counts.find(item => item.postId === post.id)?._count._all ?? 0, viewerLiked: likes.some(item => item.postId === post.id), viewerSaved: saves.some(item => item.postId === post.id), canLike: canAdd && post.author.id !== actor, canSave: canAdd };
  });
}

export async function communityReactionMetrics(db: PrismaClient, source: { id: string; status: string }, posts: Array<{ id: string; author: { id: string } }>, viewerId: string | null) {
  return communityBatchReactionMetrics(db, posts.map(post => ({ ...post, community: source })), viewerId);
}
