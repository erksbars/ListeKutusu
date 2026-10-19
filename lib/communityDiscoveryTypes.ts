import { REVIEW_KINDS } from "./communityTypes.ts";

export const COMMUNITY_INTERESTS = { ...REVIEW_KINDS, other: "Diğer" } as const;
export type CommunityDiscoveryLabels = { universityName?: string | null; city?: string | null; interest?: string | null };
export type DiscoveredEvent = { id: string; title: string; startsAt: string; timeZone: string; city: string; venue: string; capacity: number | null; community: CommunityDiscoveryLabels & { name: string; slug: string; category: string }; organizer: { ownerName: string; slug: string } };
export type DiscoveryFilters = { q: string; category: string; university: string; city: string; interest: string; mine: boolean; page: number; view: "communities" | "events" };
export const EMPTY_DISCOVERY_FILTERS: DiscoveryFilters = { q: "", category: "", university: "", city: "", interest: "", mine: false, page: 1, view: "communities" };
export function discoveryFiltersFromParams(params: URLSearchParams): DiscoveryFilters {
  const page = params.get("page") ?? "1";
  return { q: params.get("q") ?? "", category: params.get("category") ?? "", university: params.get("university") ?? "", city: params.get("city") ?? "", interest: params.get("interest") ?? "", mine: params.get("mine") === "true", page: /^[1-9]\d{0,2}$/.test(page) && Number(page) <= 100 ? Number(page) : 1, view: params.get("view") === "events" ? "events" : "communities" };
}
export function discoveryParams(filters: DiscoveryFilters) {
  const params = new URLSearchParams();
  for (const key of ["q", "category", "university", "city", "interest"] as const) if (filters[key]) params.set(key, filters[key]);
  if (filters.mine) params.set("mine", "true");
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.view === "events") params.set("view", "events");
  return params;
}
