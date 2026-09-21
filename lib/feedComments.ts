export const FEED_COMMENT_MIN_LENGTH = 2;
export const FEED_COMMENT_MAX_LENGTH = 800;

export function normalizeFeedComment(value: unknown) {
  if (typeof value !== "string") {
    return { ok: false as const, error: "Yorum metni gerekli." };
  }
  const body = value.replace(/\r\n?/g, "\n").trim();
  if (body.length < FEED_COMMENT_MIN_LENGTH) {
    return { ok: false as const, error: "Yorum en az 2 karakter olmalı." };
  }
  if (body.length > FEED_COMMENT_MAX_LENGTH) {
    return { ok: false as const, error: `Yorum en fazla ${FEED_COMMENT_MAX_LENGTH} karakter olabilir.` };
  }
  return { ok: true as const, body };
}
