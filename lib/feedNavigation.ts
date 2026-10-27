import { communityNavigationFromParams } from "./communityNavigation.ts";

const scopes = ["all", "trending", "following", "personalized", "saved"] as const;
const kinds = ["all", "music", "discussion", "review", "event"] as const;
export type FeedLocation = { scope: typeof scopes[number]; kind: typeof kinds[number]; topic: string | null };

export function parseFeedLocation(params: URLSearchParams): FeedLocation {
  const scope = scopes.find(value => value === params.get("scope")) ?? "all";
  const mixed = scope === "all" || scope === "following";
  const kind = mixed ? kinds.find(value => value === params.get("kind")) ?? "all" : "all";
  const raw = params.get("topic")?.trim().toLocaleLowerCase("tr-TR") ?? "";
  const topic = (!mixed || kind === "music") && raw.length <= 64 && !/[\u0000-\u001f\u007f]/u.test(raw) ? raw || null : null;
  return { scope, kind, topic };
}

export function feedLocationPath(value: FeedLocation) {
  const params = new URLSearchParams();
  if (value.scope !== "all") params.set("scope", value.scope);
  if (value.kind !== "all") params.set("kind", value.kind);
  if (value.topic) params.set("topic", value.topic);
  const normalized = parseFeedLocation(params);
  const result = new URLSearchParams();
  if (normalized.scope !== "all") result.set("scope", normalized.scope);
  if (normalized.kind !== "all") result.set("kind", normalized.kind);
  if (normalized.topic) result.set("topic", normalized.topic);
  return result.size ? `/?${result}` : "/";
}

/** A detail return is only a known root feed filter and an optional public card anchor. */
export function feedReturnPath(value: string | null | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/u.test(value)) return "/";
  try {
    const url = new URL(value, "https://feed.invalid");
    if (url.origin !== "https://feed.invalid" || url.pathname !== "/") return "/";
    return feedLocationPath(parseFeedLocation(url.searchParams)) + (/^#post-[a-zA-Z0-9_-]{1,160}$/u.test(url.hash) ? url.hash : "");
  } catch { return "/"; }
}

export function feedPostPath(id: string, returnTo: string, comments = false) {
  const anchor = /^[a-zA-Z0-9_-]{1,160}$/u.test(id) ? `#post-${id}` : "";
  const from = feedReturnPath(returnTo).split("#")[0] + anchor;
  return `/p/${encodeURIComponent(id)}?from=${encodeURIComponent(from)}${comments ? "#comments" : ""}`;
}

export function communityFeedAnchor(kind: "post" | "event", id: string) {
  return /^[a-zA-Z0-9_-]{1,100}$/u.test(id) ? `#post-community-${kind}-${id}` : "";
}

export function communityFeedPath(slug: string, kind: "post" | "event", id: string, returnTo: string) {
  const params = new URLSearchParams(kind === "event" ? { section: "events", event: id } : { post: id });
  const anchor = communityFeedAnchor(kind, id);
  if (anchor) params.set("from", feedReturnPath(returnTo).split("#")[0] + anchor);
  return `/communities/${encodeURIComponent(slug)}?${params}`;
}

/** A feed source belongs only to the selected detail, never another post or tab. */
export function communityFeedReturn(params: URLSearchParams) {
  const raw = params.get("from");
  if (!raw) return null;
  const navigation = communityNavigationFromParams(params);
  const kind = navigation.section === "events" ? "event" : "post";
  const id = kind === "event" ? navigation.eventId : navigation.postId;
  if (!id) return null;
  const source = feedReturnPath(raw);
  return source.endsWith(communityFeedAnchor(kind, id)) ? source : null;
}
