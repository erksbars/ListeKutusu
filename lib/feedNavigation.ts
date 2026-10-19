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
