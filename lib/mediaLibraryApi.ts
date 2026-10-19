import { verifyCatalogSelection } from "./catalogSelection.ts";
import { createMediaLibrary, LibraryError, parseMediaKind, parseLibraryId } from "./mediaLibrary.ts";

const privateHeaders = { "Cache-Control": "private, no-store" };

type Dependencies = {
  library: ReturnType<typeof createMediaLibrary>;
  authenticate: () => Promise<string | null>;
  rateLimit: (req: Request, userId: string) => { ok: boolean; retryAfter: number };
  enabled: () => boolean;
  appUrl: () => string | undefined;
};

export function createLibraryHandler({ library, authenticate, rateLimit, enabled, appUrl }: Dependencies) {
return async function handle(req: Request) {
  try {
    if (!enabled()) throw new LibraryError("Kitaplık henüz kullanıma açık değil.", 503);
    if (req.method !== "GET") {
      const origin = req.headers.get("origin");
      const expected = new URL(appUrl() || req.url).origin;
      if (!origin || origin !== expected) throw new LibraryError("İstek kaynağı doğrulanamadı.", 403);
      if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new LibraryError("JSON içerik gerekli.", 415);
    }
    const userId = await authenticate();
    if (!userId) throw new LibraryError("Önce giriş yapmalısın.", 401);
    const limited = rateLimit(req, userId);
    if (!limited.ok) return Response.json({ error: "Biraz sonra tekrar dene." }, { status: 429, headers: { ...privateHeaders, "Retry-After": String(limited.retryAfter) } });
    if (req.method === "GET") {
      const params = new URL(req.url).searchParams;
      const rawKind = params.get("kind");
      const kind = rawKind === null ? undefined : parseMediaKind(rawKind);
      return Response.json(await library.list(userId, kind, params.get("after") ?? undefined), { headers: privateHeaders });
    }
    // Bound input before JSON parsing, including chunked requests without Content-Length.
    const reader = req.body?.getReader();
    if (!reader) throw new LibraryError("İstek gövdesi eksik.");
    let length = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 20_000) { await reader.cancel(); throw new LibraryError("İstek çok büyük.", 413); }
      chunks.push(value);
    }
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { throw new LibraryError("Geçersiz JSON."); }
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new LibraryError("Geçersiz istek.");
    if (req.method === "POST") {
      const item = verifyCatalogSelection(body.selectionToken, userId);
      if (!item) throw new LibraryError("Arama seçimi geçersiz veya süresi dolmuş. Yeniden ara.");
      return Response.json({ entry: await library.add(userId, item, body.status) }, { headers: privateHeaders });
    }
    const id = parseLibraryId(body.id);
    if (req.method === "PATCH") {
      if (Object.hasOwn(body, "showcase")) {
        if (Object.hasOwn(body, "status")) throw new LibraryError("Durum ve vitrin tercihini ayrı güncelle.");
        return Response.json(await library.showcase(userId, id, body.showcase), { headers: privateHeaders });
      }
      return Response.json(await library.update(userId, id, body.status), { headers: privateHeaders });
    }
    await library.remove(userId, id);
    return Response.json({ ok: true }, { headers: privateHeaders });
  } catch (error) {
    const known = error instanceof LibraryError;
    return Response.json({ error: known ? error.message : "Kitaplık işlemi tamamlanamadı." }, { status: known ? error.status : 500, headers: privateHeaders });
  }
};
}
