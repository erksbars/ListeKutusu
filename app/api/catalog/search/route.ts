import { NextRequest, NextResponse } from "next/server";
import { CatalogError, parseCatalogQuery, searchMediaCatalog } from "@/lib/mediaCatalog";
import { checkRateLimit } from "@/lib/rateLimit";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { signCatalogSelection } from "@/lib/catalogSelection";
import { createCatalogCache } from "@/lib/catalogCache";

export const dynamic = "force-dynamic";

const cachedCatalog = createCatalogCache();

export async function GET(req: NextRequest) {
  if (process.env.MEDIA_CATALOG_ENABLED !== "true") {
    return NextResponse.json({ error: "Katalog henüz kullanıma açık değil." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
  const userId = await getAuthenticatedAccountListId();
  if (!userId) return NextResponse.json({ error: "Önce giriş yapmalısın." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  const limited = checkRateLimit(req, { name: "media-catalog", identifier: userId, limit: 20, windowMs: 60_000 });
  if (!limited.ok) return NextResponse.json({ error: "Biraz sonra tekrar ara." }, {
    status: 429, headers: { "Retry-After": String(limited.retryAfter), "Cache-Control": "private, no-store" },
  });
  try {
    const { kind, query } = parseCatalogQuery(req.nextUrl.searchParams.get("kind"), req.nextUrl.searchParams.get("q"));
    const provider = kind === "book" ? "openlibrary" : kind === "tv" ? "tvmaze" : "wikidata";
    const results = await cachedCatalog(kind, query, () => searchMediaCatalog(kind, query, {
      openLibraryContact: process.env.OPEN_LIBRARY_CONTACT,
    }));
    return NextResponse.json({ results: results.map((item) => ({ ...item, selectionToken: signCatalogSelection(item, userId) })), provider }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const code = error instanceof CatalogError ? error.code : "unavailable";
    const status = { invalid_query: 400, not_configured: 503, unavailable: 502, rate_limited: 429 }[code];
    const message = { invalid_query: "Tür seçip 2–120 karakterlik bir arama yaz.", not_configured: "Bu katalog bağlantısı henüz hazır değil.", unavailable: "Katalog sağlayıcısına şu anda ulaşılamıyor.", rate_limited: "Katalog yoğun. Biraz sonra tekrar dene." }[code];
    return NextResponse.json({ error: message, code }, { status, headers: { "Cache-Control": "private, no-store", ...(status === 429 ? { "Retry-After": "60" } : {}) } });
  }
}
