export type FeedCommentItem = {
  id: string; authorId: string; body: string; createdAt: string; postId: string; parentId: string | null;
  author: { id: string; ownerName: string; slug: string; profileTheme: string };
  replies: FeedCommentItem[];
};

const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0;

/** Validate fields consumed by rendering before replacing a draft or the visible list. */
export function isFeedComment(value: unknown, reply = false): value is FeedCommentItem {
  if (!record(value) || !text(value.id) || !text(value.authorId) || !text(value.body)
    || !text(value.postId) || !(value.parentId === null || text(value.parentId))
    || !text(value.createdAt) || !Number.isFinite(Date.parse(value.createdAt))
    || !record(value.author) || value.author.id !== value.authorId
    || !text(value.author.ownerName) || !text(value.author.slug) || typeof value.author.profileTheme !== "string"
    || !Array.isArray(value.replies)) return false;
  return reply ? value.replies.length === 0 : value.replies.every(item => isFeedComment(item, true));
}

export function parseFeedCommentList(value: unknown, postId: string): { comments: FeedCommentItem[]; total: number } | null {
  if (!record(value) || !Array.isArray(value.comments) || !Number.isInteger(value.total)) return null;
  // GET includes one reply level; leaf records have no nested Prisma relation.
  const comments: unknown[] = value.comments.map(item => record(item) && Array.isArray(item.replies)
    ? { ...item, replies: item.replies.map(reply => record(reply) ? { ...reply, replies: reply.replies ?? [] } : reply) } : item);
  if (!comments.every(item => isFeedComment(item))) return null;
  if (comments.some(item => item.postId !== postId || item.parentId !== null
    || item.replies.some(reply => reply.postId !== postId || reply.parentId !== item.id))) return null;
  const ids = comments.flatMap(item => [item.id, ...item.replies.map(reply => reply.id)]);
  return (value.total as number) >= ids.length && new Set(ids).size === ids.length
    ? { comments, total: value.total as number } : null;
}
