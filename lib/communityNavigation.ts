import { readPostFilters, type PostTypeFilter, type ReviewKindFilter } from "./communityPostFilters.ts";
export type CommunityNavigation = {
  section: "posts" | "events"; postId: string | null; eventId: string | null;
  page: number; commentPage: number; eventPage: number; eventFilter: "upcoming" | "past" | "cancelled";
  postType: PostTypeFilter; reviewKind: ReviewKindFilter;
  savedOnly: boolean;
};
const identifier = (value: string | null) => value && /^[a-zA-Z0-9_-]{1,100}$/.test(value) ? value : null;
const pageNumber = (value: string | null) => value && /^[1-9]\d{0,2}$/.test(value) && Number(value) <= 100 ? Number(value) : 1;
export function communityNavigationFromParams(params: URLSearchParams): CommunityNavigation {
  const eventId = identifier(params.get("event"));
  const section = eventId || params.get("section") === "events" ? "events" : "posts";
  const filter = params.get("filter");
  return { section, eventId, postId: section === "posts" ? identifier(params.get("post")) : null,
    page: pageNumber(params.get("page")), commentPage: pageNumber(params.get("commentsPage")), eventPage: pageNumber(params.get("eventPage")),
    eventFilter: filter === "past" || filter === "cancelled" ? filter : "upcoming", ...readPostFilters(params.get("postType"), params.get("reviewKind")), savedOnly: params.get("saved") === "1" };
}
export function communityNavigationParams(current: URLSearchParams, patch: Partial<CommunityNavigation>) {
  const value = { ...communityNavigationFromParams(current), ...patch };
  if (value.section === "posts") value.eventId = null; else value.postId = null;
  const params = new URLSearchParams(current);
  for (const key of ["section", "post", "event", "page", "commentsPage", "eventPage", "filter", "postType", "reviewKind", "saved"]) params.delete(key);
  if (value.section === "events") params.set("section", "events");
  if (value.postId) params.set("post", value.postId);
  if (value.eventId) params.set("event", value.eventId);
  if (value.page > 1) params.set("page", String(value.page));
  if (value.commentPage > 1 && value.postId) params.set("commentsPage", String(value.commentPage));
  if (value.eventPage > 1) params.set("eventPage", String(value.eventPage));
  if (value.eventFilter !== "upcoming") params.set("filter", value.eventFilter);
  const postFilters = readPostFilters(value.postType, value.reviewKind);
  if (postFilters.postType !== "all") params.set("postType", postFilters.postType);
  if (postFilters.reviewKind !== "all") params.set("reviewKind", postFilters.reviewKind);
  if (value.savedOnly) params.set("saved", "1");
  // Re-parse to enforce bounds even for malformed in-memory patches.
  const normalized = communityNavigationFromParams(params);
  for (const [key, page] of [["page", normalized.page], ["commentsPage", normalized.commentPage], ["eventPage", normalized.eventPage]] as const) if (page === 1) params.delete(key);
  if (!normalized.postId) params.delete("post"); if (!normalized.eventId) params.delete("event");
  if (normalized.eventFilter === "upcoming") params.delete("filter");
  return params;
}
