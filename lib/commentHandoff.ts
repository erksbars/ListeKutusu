export const COMMENT_HANDOFF_KEY = "listekutusu:comment-login:v1";
export const COMMENT_HANDOFF_TTL = 15 * 60_000;
export type CommentHandoff = {
  viewerId: string; postId: string; body: string; createdAt: number;
  reply: { id: string; ownerName: string } | null;
};

/** One explicit, account-bound login handoff; not a general draft archive. */
export function parseCommentHandoff(raw: string | null, viewerId: string, postId: string, now = Date.now()): CommentHandoff | null {
  if (!raw || raw.length > 12000) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || value.viewerId !== viewerId || value.postId !== postId
      || typeof value.body !== "string" || !value.body.length || value.body.length > 800
      || typeof value.createdAt !== "number" || !Number.isFinite(value.createdAt)
      || value.createdAt > now || now - value.createdAt > COMMENT_HANDOFF_TTL) return null;
    if (value.reply !== null && (!value.reply || typeof value.reply.id !== "string" || !value.reply.id.length
      || value.reply.id.length > 160 || typeof value.reply.ownerName !== "string"
      || !value.reply.ownerName.length || value.reply.ownerName.length > 200)) return null;
    return { viewerId, postId, body: value.body, createdAt: value.createdAt,
      reply: value.reply ? { id: value.reply.id, ownerName: value.reply.ownerName } : null };
  } catch { return null; }
}
