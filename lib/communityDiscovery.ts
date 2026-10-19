import type { Prisma, PrismaClient } from "@prisma/client";
import { CommunityError } from "./communityError.ts";
import { COMMUNITY_CATEGORIES } from "./communityTypes.ts";
import { COMMUNITY_INTERESTS } from "./communityDiscoveryTypes.ts";

// Turkish/ASCII folding; public labels only. This is not institution verification.
export function discoveryKey(value: string) {
  return value.normalize("NFC").replace(/[Çç]/g, "c").replace(/[Ğğ]/g, "g").replace(/[İı]/g, "i").replace(/[Öö]/g, "o").replace(/[Şş]/g, "s").replace(/[Üü]/g, "u").toLowerCase().replace(/\s/gu, "");
}
function label(raw: unknown, name: string, max: number): string | null {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string" || /\p{Cc}/u.test(raw)) throw new CommunityError(`${name} tek satır metin olmalı.`);
  const value = raw.normalize("NFC").trim().replace(/\s+/gu, " ");
  if (!value) return null;
  if (value.length < 2 || value.length > max) throw new CommunityError(`${name} 2–${max} karakter olmalı veya boş bırakılmalı.`);
  return value;
}
export function communityDiscoveryInput(body: Record<string, unknown>) {
  const universityName = label(body.universityName, "Üniversite", 120), city = label(body.city, "Şehir", 80);
  const interest = body.interest === undefined || body.interest === null || body.interest === "" ? null : body.interest;
  if (interest !== null && (typeof interest !== "string" || !Object.hasOwn(COMMUNITY_INTERESTS, interest))) throw new CommunityError("Geçerli bir ilgi alanı seç.");
  return { universityName, universityKey: universityName ? discoveryKey(universityName) : null, city, cityKey: city ? discoveryKey(city) : null, interest: interest as string | null };
}
export function discoveryWhere(raw: Record<string, unknown>): Prisma.CommunityWhereInput {
  const university = label(raw.university, "Üniversite filtresi", 120), city = label(raw.city, "Şehir filtresi", 80);
  const interest = communityDiscoveryInput({ interest: raw.interest }).interest;
  return { ...(university ? { universityKey: { contains: discoveryKey(university) } } : {}), ...(city ? { cityKey: { contains: discoveryKey(city) } } : {}), ...(interest ? { interest } : {}) };
}
export async function discoverCommunityEvents(db: PrismaClient, viewerId: string | null, raw: Record<string, unknown>, page: number, now = new Date()) {
  const q = typeof raw.q === "string" ? raw.q.trim() : "";
  if (q.length > 100) throw new CommunityError("Arama en fazla 100 karakter olabilir.");
  const category = raw.category ?? "";
  if (typeof category !== "string" || (category && !Object.hasOwn(COMMUNITY_CATEGORIES, category))) throw new CommunityError("Geçersiz kategori.");
  if (raw.mine && !viewerId) throw new CommunityError("Önce giriş yapmalısın.", 401);
  const communityLabels = discoveryWhere({ ...raw, city: undefined }), city = label(raw.city, "Şehir filtresi", 80);
  const where: Prisma.CommunityEventWhereInput = {
    distribution: "general", status: "scheduled", startsAt: { gt: now },
    organizer: { status: "active", ...(viewerId ? { blocksInitiated: { none: { blockedId: viewerId } }, blocksReceived: { none: { blockerId: viewerId } } } : {}) },
    ...(city ? { cityKey: { contains: discoveryKey(city) } } : {}),
    community: { status: "active", ...communityLabels, ...(category ? { category } : {}), ...(raw.mine ? { members: { some: { userId: viewerId!, status: "active" } } } : {}) },
    ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }, { community: { name: { contains: q } } }] } : {}),
  };
  const [events, total] = await Promise.all([
    db.communityEvent.findMany({ where, orderBy: [{ startsAt: "asc" }, { id: "asc" }], take: 20, skip: (page - 1) * 20,
      select: { id: true, title: true, startsAt: true, timeZone: true, city: true, venue: true, capacity: true,
        community: { select: { slug: true, name: true, category: true, universityName: true, interest: true } }, organizer: { select: { ownerName: true, slug: true } } } }),
    db.communityEvent.count({ where }),
  ]);
  return { events, total, page, hasMore: total > page * 20, authenticated: Boolean(viewerId) };
}
