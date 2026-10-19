import type { PrismaClient } from "@prisma/client";

// Caller has already resolved an active profile and both directions of blocking.
// No private reading/watching status, owner ID, selection token or timestamps leave this boundary.
export async function getMediaShowcase(db: Pick<PrismaClient, "mediaLibraryEntry">, userId: string, enabled: boolean, interactionBlocked: boolean) {
  if (!enabled || interactionBlocked) return [];
  const rows = await db.mediaLibraryEntry.findMany({
    where: { userId, showcasedAt: { not: null } },
    orderBy: [{ showcasedAt: "desc" }, { id: "desc" }], take: 6,
    select: { catalogId: true, kind: true, title: true, creators: true, year: true, provider: true, sourceUrl: true },
  });
  return rows.map(({ creators, ...row }) => ({ ...row, creators: JSON.parse(creators) as string[] }));
}

export type MediaShowcaseItem = Awaited<ReturnType<typeof getMediaShowcase>>[number];
