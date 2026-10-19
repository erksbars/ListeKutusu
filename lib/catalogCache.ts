import { CatalogError, type CatalogItem, type MediaKind } from "./mediaCatalog.ts";

// Process-local, bounded public metadata only. Sign selections AFTER retrieving results.
// Multi-instance deployment requires a shared cache/rate limiter.
export function createCatalogCache(now: () => number = Date.now) {
  const cache = new Map<string, { expires: number; items: CatalogItem[] }>();
  const pending = new Map<string, Promise<CatalogItem[]>>();
  const active = new Set<MediaKind>();
  const next = new Map<MediaKind, number>();
  return async (kind: MediaKind, query: string, load: () => Promise<CatalogItem[]>): Promise<CatalogItem[]> => {
    const key = JSON.stringify([kind, query]);
    const found = cache.get(key);
    if (found && found.expires > now()) return structuredClone(found.items);
    if (found) cache.delete(key);
    const inFlight = pending.get(key);
    if (inFlight) return structuredClone(await inFlight);
    if (active.has(kind) || (next.get(kind) ?? 0) > now()) throw new CatalogError("rate_limited");
    active.add(kind);
    next.set(kind, now() + (kind === "tv" ? 600 : 1_000));
    const task = Promise.resolve().then(load).then(items => {
      if (cache.size >= 100) cache.delete(cache.keys().next().value!);
      cache.set(key, { expires: now() + 300_000, items: structuredClone(items) });
      return items;
    }).catch(error => {
      if (error instanceof CatalogError && error.code === "rate_limited") next.set(kind, now() + 60_000);
      throw error;
    }).finally(() => { active.delete(kind); pending.delete(key); });
    pending.set(key, task);
    return structuredClone(await task);
  };
}
