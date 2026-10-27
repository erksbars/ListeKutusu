export const FEED_RETURN_PAGE_BUDGET = 3;

export function readFeedAnchor(hash: string) {
  return /^#post-[a-zA-Z0-9_-]{1,160}$/u.test(hash) ? hash : null;
}

export type FeedReturnPhase = "idle" | "searching" | "found" | "paused" | "missing" | "stalled" | "error";

/** Pure decision policy: no cursor, post content or account data is persisted. */
export function feedReturnPhase({ target, ready, found, loading, error, cursor, requests, seen }: {
  target: string | null; ready: boolean; found: boolean; loading: boolean;
  error: string | null; cursor: string | null; requests: number; seen: readonly string[];
}): FeedReturnPhase {
  if (!target || !readFeedAnchor(target) || !ready) return "idle";
  if (found) return "found";
  if (loading) return "searching";
  if (error) return "error";
  if (!cursor) return "missing";
  if (seen.includes(cursor)) return "stalled";
  if (requests >= FEED_RETURN_PAGE_BUDGET) return "paused";
  return "searching";
}
