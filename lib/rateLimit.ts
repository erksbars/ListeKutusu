import type { NextRequest } from "next/server";

type RateLimitOptions = {
  name: string;
  limit: number;
  windowMs: number;
  identifier?: string;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const CLEANUP_THRESHOLD = 1_000;
const MAX_BUCKETS = 10_000;
const TARGET_BUCKETS_AFTER_TRIM = 9_000;

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return (forwarded.split(",")[0]?.trim() || "unknown").slice(0, 64);
  return (req.headers.get("x-real-ip") || "unknown").slice(0, 64);
}

function maintainBuckets(now: number) {
  if (buckets.size < CLEANUP_THRESHOLD) return;
  for (const [bucketKey, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(bucketKey);
  }

  if (buckets.size < MAX_BUCKETS) return;
  const removeCount = buckets.size - TARGET_BUCKETS_AFTER_TRIM;
  let removed = 0;
  for (const bucketKey of buckets.keys()) {
    buckets.delete(bucketKey);
    removed += 1;
    if (removed >= removeCount) break;
  }
}

export function checkRateLimit(req: NextRequest, options: RateLimitOptions) {
  const now = Date.now();
  maintainBuckets(now);

  const identity =
    options.identifier?.trim().toLocaleLowerCase("tr-TR").slice(0, 128) ||
    "global";
  const key = `${options.name}:${getClientIp(req)}:${identity}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (current.count >= options.limit) {
    return {
      ok: false,
      retryAfter: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  return { ok: true, retryAfter: 0 };
}
