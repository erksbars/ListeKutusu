import { readPostFilters, type PostTypeFilter, type ReviewKindFilter } from "./communityPostFilters.ts";
type CommunityTimelineKind = "all" | "discussion" | "review" | "event";
export type CommunityNavigation = {
  section: "posts" | "events"; postId: string | null; eventId: string | null;
  page: number; commentPage: number; eventPage: number; eventFilter: "upcoming" | "past" | "cancelled";
  postType: PostTypeFilter; reviewKind: ReviewKindFilter;
  savedOnly: boolean; cursor: string | null; kind: CommunityTimelineKind;
};
const identifier = (value: string | null) => value && /^[a-zA-Z0-9_-]{1,100}$/.test(value) ? value : null;
const pageNumber = (value: string | null) => value && /^[1-9]\d{0,2}$/.test(value) && Number(value) <= 100 ? Number(value) : 1;
// The server validates the decoded position; navigation only bounds its URL representation.
const cursorPosition = (value: unknown) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,400}$/.test(value) ? value : null;
const timelineKind = (value: unknown): CommunityTimelineKind | null => value === "all" || value === "discussion" || value === "review" || value === "event" ? value : null;
const legacyTimelineKind = (section: CommunityNavigation["section"], postType: PostTypeFilter): CommunityTimelineKind => section === "events" ? "event" : postType;
export function communityNavigationFromParams(params: URLSearchParams): CommunityNavigation {
  const eventId = identifier(params.get("event"));
  const section = eventId || params.get("section") === "events" ? "events" : "posts";
  const filter = params.get("filter");
  const postFilters = readPostFilters(params.get("postType"), params.get("reviewKind"));
  return { section, eventId, postId: section === "posts" ? identifier(params.get("post")) : null,
    page: pageNumber(params.get("page")), commentPage: pageNumber(params.get("commentsPage")), eventPage: pageNumber(params.get("eventPage")),
    eventFilter: filter === "past" || filter === "cancelled" ? filter : "upcoming", ...postFilters, savedOnly: params.get("saved") === "1", cursor: cursorPosition(params.get("cursor")), kind: timelineKind(params.get("kind")) ?? legacyTimelineKind(section, postFilters.postType) };
}
export function communityNavigationParams(current: URLSearchParams, patch: Partial<CommunityNavigation>) {
  const previous = communityNavigationFromParams(current);
  const value = { ...previous, ...patch };
  const postFilters = readPostFilters(value.postType, value.reviewKind);
  const eventFilter = value.eventFilter === "past" || value.eventFilter === "cancelled" ? value.eventFilter : "upcoming";
  const section = value.section === "events" ? "events" : "posts";
  const legacyKind = legacyTimelineKind(section, postFilters.postType);
  const detailPatch = Object.hasOwn(patch, "postId") || Object.hasOwn(patch, "eventId");
  // Canonical detail selection may use another legacy section without changing the source list.
  const legacyListPatch = !Object.hasOwn(patch, "kind") && !detailPatch && (Object.hasOwn(patch, "section") || Object.hasOwn(patch, "postType"));
  const kind = legacyListPatch ? legacyKind : timelineKind(value.kind) ?? legacyKind;
  const filtersChanged = kind !== previous.kind || postFilters.postType !== previous.postType || postFilters.reviewKind !== previous.reviewKind || value.savedOnly !== previous.savedOnly || eventFilter !== previous.eventFilter;
  if (filtersChanged) {
    value.cursor = null;
    if (kind === "event") value.eventPage = 1; else value.page = 1;
  }
  value.section = section;
  value.eventFilter = eventFilter;
  if (value.section === "posts") value.eventId = null; else value.postId = null;
  const params = new URLSearchParams(current);
  for (const key of ["section", "post", "event", "page", "commentsPage", "eventPage", "filter", "postType", "reviewKind", "saved", "cursor", "kind"]) params.delete(key);
  if (value.section === "events") params.set("section", "events");
  if (value.postId) params.set("post", value.postId);
  if (value.eventId) params.set("event", value.eventId);
  if (value.page > 1) params.set("page", String(value.page));
  if (value.commentPage > 1 && value.postId) params.set("commentsPage", String(value.commentPage));
  if (value.eventPage > 1) params.set("eventPage", String(value.eventPage));
  if (value.eventFilter !== "upcoming") params.set("filter", value.eventFilter);
  if (postFilters.postType !== "all") params.set("postType", postFilters.postType);
  if (postFilters.reviewKind !== "all") params.set("reviewKind", postFilters.reviewKind);
  if (value.savedOnly) params.set("saved", "1");
  if (kind !== legacyKind) params.set("kind", kind);
  const cursor = cursorPosition(value.cursor);
  if (cursor) params.set("cursor", cursor);
  // Re-parse to enforce bounds even for malformed in-memory patches.
  const normalized = communityNavigationFromParams(params);
  for (const [key, page] of [["page", normalized.page], ["commentsPage", normalized.commentPage], ["eventPage", normalized.eventPage]] as const) if (page === 1) params.delete(key);
  if (!normalized.postId) params.delete("post"); if (!normalized.eventId) params.delete("event");
  if (normalized.eventFilter === "upcoming") params.delete("filter");
  return params;
}
