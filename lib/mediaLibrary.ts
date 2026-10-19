import type { PrismaClient, MediaLibraryEntry } from "@prisma/client";
import type { CatalogItem, MediaKind } from "./mediaCatalog.ts";

export const MEDIA_STATUSES = {
  movie: { to_watch: "İzlenecek", watching: "İzleniyor", watched: "İzlendi" },
  tv: { to_watch: "İzlenecek", watching: "İzleniyor", watched: "İzlendi" },
  book: { to_read: "Okunacak", reading: "Okunuyor", read: "Okundu" },
} as const;

export class LibraryError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}

export function parseMediaKind(value: unknown): MediaKind {
  if (value !== "movie" && value !== "tv" && value !== "book") throw new LibraryError("Geçersiz içerik türü.");
  return value;
}
export function parseMediaStatus(kind: MediaKind, value: unknown): string {
  if (typeof value !== "string" || !Object.hasOwn(MEDIA_STATUSES[kind], value)) {
    throw new LibraryError("Bu içerik türü için geçersiz durum.");
  }
  return value;
}
export function parseLibraryId(value: unknown): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(value)) throw new LibraryError("Geçersiz kayıt.");
  return value;
}
function present(row: MediaLibraryEntry) {
  // Explicit DTO: new database columns must not silently become API response fields.
  return { id: row.id, catalogId: row.catalogId, kind: row.kind, provider: row.provider,
    externalId: row.externalId, title: row.title, creators: JSON.parse(row.creators) as string[],
    year: row.year, sourceUrl: row.sourceUrl, status: row.status, showcasedAt: row.showcasedAt,
    createdAt: row.createdAt, updatedAt: row.updatedAt };
}

// The caller must supply the authenticated user ID, never an ID from request data.
export function createMediaLibrary(db: Pick<PrismaClient, "mediaLibraryEntry">) {
  return {
    async list(userId: string, kind?: MediaKind, after?: string) {
      let boundary: MediaLibraryEntry | null = null;
      if (after) {
        boundary = await db.mediaLibraryEntry.findFirst({ where: { id: parseLibraryId(after), userId, ...(kind ? { kind } : {}) } });
        if (!boundary) throw new LibraryError("Sayfalama kaydı bulunamadı.", 400);
      }
      const rows = await db.mediaLibraryEntry.findMany({
        where: { userId, ...(kind ? { kind } : {}), ...(boundary ? { OR: [
          { createdAt: { lt: boundary.createdAt } },
          { createdAt: boundary.createdAt, id: { lt: boundary.id } },
        ] } : {}) },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 31,
      });
      return { entries: rows.slice(0, 30).map(present), nextCursor: rows.length > 30 ? rows[29].id : null };
    },
    async add(userId: string, item: CatalogItem, status: unknown) {
      const validStatus = parseMediaStatus(item.kind, status);
      // Repeated saves are idempotent and do not silently reset an existing status.
      const row = await db.mediaLibraryEntry.upsert({
        where: { userId_catalogId: { userId, catalogId: item.id } }, update: {},
        create: { userId, catalogId: item.id, kind: item.kind, provider: item.provider,
          externalId: item.externalId, title: item.title, creators: JSON.stringify(item.creators),
          year: item.year, sourceUrl: item.sourceUrl, status: validStatus },
      });
      return present(row);
    },
    async update(userId: string, id: string, status: unknown) {
      const row = await db.mediaLibraryEntry.findFirst({ where: { id: parseLibraryId(id), userId } });
      if (!row) throw new LibraryError("Kayıt bulunamadı.", 404);
      const validStatus = parseMediaStatus(parseMediaKind(row.kind), status);
      const result = await db.mediaLibraryEntry.updateMany({ where: { id, userId }, data: { status: validStatus } });
      if (!result.count) throw new LibraryError("Kayıt bulunamadı.", 404);
      return { id, status: validStatus };
    },
    async showcase(userId: string, id: string, visible: unknown) {
      if (typeof visible !== "boolean") throw new LibraryError("Vitrin tercihi doğru veya yanlış olmalı.");
      const row = await db.mediaLibraryEntry.findFirst({ where: { id: parseLibraryId(id), userId } });
      if (!row) throw new LibraryError("Kayıt bulunamadı.", 404);
      const showcasedAt = visible ? row.showcasedAt ?? new Date() : null;
      const result = await db.mediaLibraryEntry.updateMany({ where: { id, userId }, data: { showcasedAt } });
      if (!result.count) throw new LibraryError("Kayıt bulunamadı.", 404);
      return { id, showcasedAt: showcasedAt?.toISOString() ?? null };
    },
    async remove(userId: string, id: string) {
      const result = await db.mediaLibraryEntry.deleteMany({ where: { id: parseLibraryId(id), userId } });
      if (!result.count) throw new LibraryError("Kayıt bulunamadı.", 404);
    },
  };
}
