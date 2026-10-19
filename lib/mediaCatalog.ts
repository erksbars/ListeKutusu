// Provider-neutral catalog contract. This module performs no database writes.
export type MediaKind = "movie" | "tv" | "book";
export type CatalogItem = {
  id: string;
  kind: MediaKind;
  provider: "tmdb" | "wikidata" | "tvmaze" | "openlibrary";
  externalId: string;
  title: string;
  creators: string[];
  year: number | null;
  sourceUrl: string;
};

export class CatalogError extends Error {
  code: "invalid_query" | "not_configured" | "unavailable" | "rate_limited";
  constructor(code: CatalogError["code"]) {
    super(code);
    this.code = code;
  }
}

export function parseCatalogQuery(kind: unknown, query: unknown): { kind: MediaKind; query: string } {
  if (kind !== "movie" && kind !== "tv" && kind !== "book") throw new CatalogError("invalid_query");
  if (typeof query !== "string") throw new CatalogError("invalid_query");
  const normalized = query.trim().replace(/\s+/g, " ");
  if (normalized.length < 2 || normalized.length > 120) throw new CatalogError("invalid_query");
  return { kind, query: normalized };
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}
function title(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 300) : "";
}
function year(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? Number(value.slice(0, 4)) : NaN;
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 9999 ? parsed : null;
}

export function normalizeCatalogResults(kind: "tv" | "book", payload: unknown): CatalogItem[] {
  const body = record(payload);
  const rows = kind === "tv" ? payload : body.docs;
  if (!Array.isArray(rows)) throw new CatalogError("unavailable");
  const items = new Map<string, CatalogItem>();
  for (const raw of rows.slice(0, 100)) {
    const row = record(raw);
    if (kind === "tv") {
      const show = record(row.show);
      const name = title(show.name);
      if (!Number.isSafeInteger(show.id) || (show.id as number) <= 0 || !name) continue;
      const externalId = String(show.id);
      const id = `tvmaze:tv:${externalId}`;
      items.set(id, { id, kind, provider: "tvmaze", externalId, title: name, creators: [],
        year: year(show.premiered), sourceUrl: `https://www.tvmaze.com/shows/${externalId}` });
    } else if (kind === "book") {
      const match = typeof row.key === "string" ? /^\/?works\/(OL\d+W)$/.exec(row.key) : null;
      const name = title(row.title);
      if (!match || !name) continue;
      const externalId = match[1];
      const id = `openlibrary:book:${externalId}`;
      items.set(id, { id, kind, provider: "openlibrary", externalId, title: name,
        creators: Array.isArray(row.author_name) ? row.author_name.map(title).filter(Boolean).slice(0, 10) : [],
        year: year(row.first_publish_year), sourceUrl: `https://openlibrary.org/works/${externalId}` });
    }
    if (items.size >= 20) break;
  }
  return [...items.values()];
}

type CatalogOptions = {
  openLibraryContact?: string;
  fetcher?: typeof fetch;
};

// Called by server routes only; credentials are never returned in catalog results.
export async function searchMediaCatalog(kind: MediaKind, query: string, options: CatalogOptions = {}) {
  const input = parseCatalogQuery(kind, query);
  if (kind === "movie") {
    try { return await searchWikidata(input.query, options.fetcher ?? fetch); }
    catch (error) {
      if (error instanceof CatalogError) throw error;
      throw new CatalogError("unavailable");
    }
  }
  const headers: Record<string, string> = { Accept: "application/json" };
  let url: URL;
  if (kind === "book") {
    const contact = options.openLibraryContact?.trim();
    if (!contact || /[\r\n]/.test(contact)) throw new CatalogError("not_configured");
    url = new URL("https://openlibrary.org/search.json");
    url.searchParams.set("q", input.query);
    url.searchParams.set("fields", "key,title,author_name,first_publish_year");
    url.searchParams.set("limit", "20");
    url.searchParams.set("lang", "tr");
    headers["User-Agent"] = `ListeKutusu/0.1 (${contact})`;
  } else {
    url = new URL("https://api.tvmaze.com/search/shows");
    url.searchParams.set("q", input.query);
    headers["User-Agent"] = "ListeKutusu/0.1";
  }
  try {
    const response = await (options.fetcher ?? fetch)(url, {
      headers, signal: AbortSignal.timeout(8_000), cache: "no-store", redirect: "error",
    });
    if (response.status === 429) throw new CatalogError("rate_limited");
    if (!response.ok) throw new CatalogError("unavailable");
    return normalizeCatalogResults(kind, await response.json());
  } catch (error) {
    if (error instanceof CatalogError) throw error;
    // Do not expose upstream bodies, URLs or authorization headers to clients/logs.
    throw new CatalogError("unavailable");
  }
}

const entityId = (value: unknown): value is string => typeof value === "string" && /^Q[1-9]\d*$/.test(value);
function claims(entity: unknown, property: string): Record<string, unknown>[] {
  const values = record(record(entity).claims)[property];
  return Array.isArray(values) ? values.filter(value => record(value).rank !== "deprecated")
    .map(value => record(record(record(record(value).mainsnak).datavalue).value)) : [];
}
function links(entity: unknown, property: string): string[] {
  return claims(entity, property).map(value => value.id).filter(entityId);
}

// Bounded label search + taxonomy validation. Never classify from free-text descriptions.
// Deep/unclassified film subtypes can be omitted; this is not an exhaustive film database.
async function searchWikidata(query: string, fetcher: typeof fetch): Promise<CatalogItem[]> {
  const signal = AbortSignal.timeout(12_000); // Whole operation, not a fresh timeout per request.
  async function request(params: Record<string, string>) {
    const url = new URL("https://www.wikidata.org/w/api.php");
    // Interactive searches may omit maxlag per MediaWiki's documented etiquette.
    // HTTP/API rate limits still fail closed; no automatic retry loop.
    url.search = new URLSearchParams({ format: "json", ...params }).toString();
    const response = await fetcher(url, { headers: { Accept: "application/json", "User-Agent": "ListeKutusu/0.1" }, signal, cache: "no-store", redirect: "error" });
    if (response.status === 429) throw new CatalogError("rate_limited");
    if (!response.ok) throw new CatalogError("unavailable");
    const body = record(await response.json());
    if (body.error) throw new CatalogError(["maxlag", "ratelimited"].includes(String(record(body.error).code)) ? "rate_limited" : "unavailable");
    return body;
  }
  const ids = new Set<string>();
  for (const language of ["tr", "en"]) {
    const body = await request({ action: "wbsearchentities", search: query, language, type: "item", limit: "15" });
    if (!Array.isArray(body.search)) throw new CatalogError("unavailable");
    for (const row of body.search.slice(0, 15)) if (entityId(record(row).id)) ids.add(record(row).id as string);
  }
  if (!ids.size) return [];
  async function entities(requested: string[]) {
    const body = await request({ action: "wbgetentities", ids: requested.join("|"), props: "labels|claims", languages: "tr|en" });
    if (!body.entities || Array.isArray(body.entities) || typeof body.entities !== "object") throw new CatalogError("unavailable");
    return record(body.entities);
  }
  const candidates = await entities([...ids]);
  const parents = new Map<string, string[]>();
  let frontier = [...new Set([...ids].flatMap(id => links(candidates[id], "P31")))];
  // At most three taxonomy batches of 50; cycles and fan-out cannot grow unbounded.
  for (let depth = 0; depth < 3; depth++) {
    const batch = frontier.filter(id => id !== "Q11424" && !parents.has(id)).slice(0, 50);
    if (!batch.length) break;
    const types = await entities(batch);
    for (const id of batch) parents.set(id, links(types[id], "P279"));
    frontier = [...new Set(batch.flatMap(id => parents.get(id) ?? []))];
  }
  function isFilm(id: string, seen = new Set<string>()): boolean {
    if (id === "Q11424") return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return (parents.get(id) ?? []).some(parent => isFilm(parent, seen));
  }
  const results: CatalogItem[] = [];
  for (const externalId of ids) {
    const entity = record(candidates[externalId]);
    if (!links(entity, "P31").some(id => isFilm(id))) continue;
    const labels = record(entity.labels);
    const name = title(record(labels.tr).value) || title(record(labels.en).value);
    if (!name) continue;
    const years = claims(entity, "P577").flatMap(value => {
      const match = typeof value.time === "string" ? /^\+(\d{4})-/.exec(value.time) : null;
      const parsed = match ? year(Number(match[1])) : null;
      return parsed && typeof value.precision === "number" && value.precision >= 9 ? [parsed] : [];
    });
    results.push({ id: `wikidata:movie:${externalId}`, kind: "movie", provider: "wikidata", externalId,
      title: name, creators: [], year: years.length ? Math.min(...years) : null, sourceUrl: `https://www.wikidata.org/wiki/${externalId}` });
    if (results.length === 20) break;
  }
  return results;
}
