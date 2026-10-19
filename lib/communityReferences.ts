import type { Prisma } from "@prisma/client";
import { CommunityError } from "./communityError.ts";
import type { LibraryReviewReference } from "./communityTypes.ts";
import { verifyCatalogSelection } from "./catalogSelection.ts";

function kind(value: unknown) {
  if (value !== "music" && value !== "tv" && value !== "movie" && value !== "book") throw new CommunityError("Bu tür için kitaplık seçimi desteklenmiyor.");
  return value;
}
function source(provider: string, externalId: string, reviewKind: string): string | null {
  if (provider === "spotify" && reviewKind === "music" && /^[a-zA-Z0-9]{22}$/.test(externalId)) return `https://open.spotify.com/track/${externalId}`;
  if (provider === "openlibrary" && reviewKind === "book" && /^OL\d+W$/.test(externalId)) return `https://openlibrary.org/works/${externalId}`;
  if (provider === "wikidata" && reviewKind === "movie" && /^Q[1-9]\d*$/.test(externalId)) return `https://www.wikidata.org/wiki/${externalId}`;
  if (provider === "tvmaze" && reviewKind === "tv" && /^[1-9]\d*$/.test(externalId)) return `https://www.tvmaze.com/shows/${externalId}`;
  if (provider === "tmdb" && (reviewKind === "tv" || reviewKind === "movie") && /^[1-9]\d*$/.test(externalId)) return `https://www.themoviedb.org/${reviewKind}/${externalId}`;
  return null;
}
function present(id: string, title: string, reviewKind: string, provider: string, externalId: string): LibraryReviewReference | null {
  const sourceUrl = source(provider, externalId, reviewKind);
  return sourceUrl && title.trim() ? { id, title: title.trim().slice(0, 160), reviewKind, provider, sourceUrl } : null;
}
export async function listReviewReferences(db: Prisma.TransactionClient, userId: string | null, requestedKind: unknown, query: string) {
  if (!userId || !await db.userList.findFirst({ where: { id: userId, status: "active" }, select: { id: true } })) throw new CommunityError("Önce giriş yapmalısın.", 401);
  const reviewKind = kind(requestedKind);
  if (query.length > 100) throw new CommunityError("Arama en fazla 100 karakter olabilir.");
  const rows = reviewKind === "music" ? (await db.suggestion.findMany({
    where: { listId: userId, status: "approved", ...(query ? { OR: [{ trackName: { contains: query } }, { artistName: { contains: query } }] } : {}) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 20,
    select: { id: true, trackName: true, trackId: true },
  })).map(row => present(row.id, row.trackName, reviewKind, "spotify", row.trackId)) : (await db.mediaLibraryEntry.findMany({
    where: { userId, kind: reviewKind, ...(query ? { title: { contains: query } } : {}) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 20,
    select: { id: true, title: true, provider: true, externalId: true },
  })).map(row => present(row.id, row.title, reviewKind, row.provider, row.externalId));
  return { references: rows.filter((row): row is LibraryReviewReference => row !== null) };
}
export async function resolveReviewReference(db: Prisma.TransactionClient, userId: string, raw: unknown, requestedKind: unknown) {
  const reviewKind = kind(requestedKind);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new CommunityError("Geçersiz kitaplık seçimi.");
  const id = (raw as Record<string, unknown>).id;
  if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw new CommunityError("Geçersiz kitaplık seçimi.");
  let reference: LibraryReviewReference | null = null;
  if (reviewKind === "music") {
    const row = await db.suggestion.findFirst({ where: { id, listId: userId, status: "approved" }, select: { id: true, trackName: true, trackId: true } });
    if (row) reference = present(row.id, row.trackName, reviewKind, "spotify", row.trackId);
  } else {
    const row = await db.mediaLibraryEntry.findFirst({ where: { id, userId, kind: reviewKind }, select: { id: true, title: true, provider: true, externalId: true } });
    if (row) reference = present(row.id, row.title, reviewKind, row.provider, row.externalId);
  }
  if (!reference) throw new CommunityError("Kitaplık kaydı bulunamadı veya artık seçilemiyor.", 404);
  return reference;
}

// Publishing uses the signed server result, never client-supplied title/provider/URL.
// This creates no private library entry and performs no provider request in a write transaction.
export function resolveCatalogReviewReference(userId: string, token: unknown, requestedKind: unknown) {
  if (process.env.MEDIA_CATALOG_ENABLED !== "true") throw new CommunityError("Katalog henüz kullanıma açık değil. Kitaplık veya elle girişi kullanabilirsin.", 503);
  if (requestedKind !== "movie" && requestedKind !== "tv" && requestedKind !== "book") throw new CommunityError("Bu tür için katalog seçimi desteklenmiyor.");
  const item = verifyCatalogSelection(token, userId);
  if (!item) throw new CommunityError("Katalog seçiminin süresi dolmuş veya seçim geçersiz. İnceleme metnini koruyup eseri yeniden ara ve seç.", 409);
  const provider = requestedKind === "movie" ? "wikidata" : requestedKind === "tv" ? "tvmaze" : "openlibrary";
  if (item.kind !== requestedKind || item.provider !== provider || typeof item.externalId !== "string" || typeof item.title !== "string" || item.id !== `${provider}:${requestedKind}:${item.externalId}`) throw new CommunityError("Katalog seçimi inceleme türüyle eşleşmiyor.");
  const reference = present(item.id, item.title, item.kind, item.provider, item.externalId);
  if (!reference) throw new CommunityError("Katalog eseri seçilemiyor. Yeniden ara ve seç.");
  return reference;
}
