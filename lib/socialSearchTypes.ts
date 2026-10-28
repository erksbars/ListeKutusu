export const SEARCH_SCOPES = { all: "Tümü", posts: "Paylaşımlar", communities: "Topluluklar", people: "Kullanıcılar" } as const;
export type SearchScope = keyof typeof SEARCH_SCOPES;
export function searchQuery(value: string | null) { return (value ?? "").normalize("NFC").trim().replace(/\s+/gu, " ").slice(0, 100); }
export function searchScope(value: string | null): SearchScope { return value && Object.hasOwn(SEARCH_SCOPES, value) ? value as SearchScope : "all"; }
export function searchPath(query: string, scope: SearchScope = "all", page = 1) {
  const params = new URLSearchParams(), q = searchQuery(query);
  if (q) params.set("q", q);
  if (scope !== "all") params.set("type", scope);
  if (Number.isInteger(page) && page > 1 && page <= 50) params.set("page", String(page));
  return `/search${params.size ? `?${params}` : ""}`;
}
export type SearchIdentity = { id: string; title: string; href: string; description: string; meta: string };
export type SearchPost = { id: string; kind: "music" | "discussion" | "review" | "event"; title: string; excerpt: string; href: string; author: string; authorHref: string; community: string | null; createdAt: string; spoiler: boolean };
export type SocialSearchResult = { query: string; scope: SearchScope; page: number; people: SearchIdentity[]; communities: SearchIdentity[]; posts: SearchPost[]; hasMore: boolean };
