import type { CommunityTimelinePage } from "./communityTimeline.ts";

const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const identifier = (value: unknown) => typeof value === "string" && /^[\w-]{1,100}$/.test(value);
const count = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0;
const date = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value));

// Validate the fields used by the card before replacing a readable snapshot.
export function validCommunityTimelinePage(value: unknown, slug: string): value is CommunityTimelinePage {
  if (!object(value) || !Array.isArray(value.items) || value.items.length > 10 || !(value.nextCursor === null || (typeof value.nextCursor === "string" && /^[\w-]{1,400}$/.test(value.nextCursor)))) return false;
  const seen = new Set<string>();
  return value.items.every(item => {
    if (!object(item) || !["post", "event"].includes(String(item.kind)) || !identifier(item.id) || !text(item.title) || !date(item.createdAt) || typeof item.content !== "string" || typeof item.excerpt !== "string") return false;
    if (!object(item.community) || item.community.slug !== slug || !text(item.community.name) || !object(item.author) || !identifier(item.author.slug) || !text(item.author.ownerName)) return false;
    const key = `${item.kind}:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    if (item.kind === "event") return date(item.startsAt) && item.timeZone === "Europe/Istanbul" && text(item.city) && text(item.venue) && ["scheduled", "cancelled"].includes(String(item.status)) && (item.capacity === null || (Number.isSafeInteger(item.capacity) && Number(item.capacity) >= 2 && Number(item.capacity) <= 200));
    if (!["discussion", "review"].includes(String(item.type)) || typeof item.spoiler !== "boolean" || (item.spoiler && (item.content || item.excerpt))) return false;
    if (!count(item.likeCount) || ![item.canLike, item.canSave, item.viewerLiked, item.viewerSaved].every(field => typeof field === "boolean") || (item.commentCount !== undefined && !count(item.commentCount))) return false;
    return item.type !== "review" || (text(item.subjectTitle) && Number.isInteger(item.rating) && Number(item.rating) >= 1 && Number(item.rating) <= 10);
  });
}
