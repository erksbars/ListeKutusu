import type { PrismaClient, Prisma } from "@prisma/client";
import { searchQuery, type SearchScope, type SocialSearchResult, type SearchPost } from "./socialSearchTypes.ts";

export async function socialSearch(db: PrismaClient, viewerId: string | null, rawQuery: string, scope: SearchScope = "all", page = 1, preview = false): Promise<SocialSearchResult> {
  const q = searchQuery(rawQuery);
  const empty: SocialSearchResult = { query: q, scope, page, people: [], communities: [], posts: [], hasMore: false };
  if (q.length < 2) return empty;
  const limit = preview ? 3 : scope === "all" ? 5 : 10;
  const range = { take: limit + 1, skip: (page - 1) * limit };
  const author: Prisma.UserListWhereInput = { status: "active", ...(viewerId ? {
    blocksInitiated: { none: { blockedId: viewerId } }, blocksReceived: { none: { blockerId: viewerId } },
  } : {}) };
  const names = { ownerName: true, slug: true } as const;
  const [people, communities, music, posts, events] = await Promise.all([
    scope === "all" || scope === "people" ? db.userList.findMany({
      where: { ...author, OR: [{ ownerName: { contains: q } }, { slug: { contains: q } }, { playlistName: { contains: q } }] },
      select: { id: true, ownerName: true, slug: true, bio: true, _count: { select: { followers: true } } },
      orderBy: [{ ownerName: "asc" }, { id: "asc" }], ...range,
    }) : [],
    scope === "all" || scope === "communities" ? db.community.findMany({
      where: { status: "active", OR: [{ name: { contains: q } }, { description: { contains: q } }, { universityName: { contains: q } }, { city: { contains: q } }] },
      select: { id: true, name: true, slug: true, description: true, _count: { select: { members: { where: { status: "active" } } } } },
      orderBy: [{ name: "asc" }, { id: "asc" }], ...range,
    }) : [],
    !preview && (scope === "all" || scope === "posts") ? db.feedPost.findMany({
      where: { status: "published", author, ...(viewerId ? { hides: { none: { userId: viewerId } } } : {}), OR: [{ trackName: { contains: q } }, { artistName: { contains: q } }, { note: { contains: q } }] },
      select: { id: true, trackName: true, artistName: true, note: true, createdAt: true, author: { select: names } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], ...range,
    }) : [],
    !preview && (scope === "all" || scope === "posts") ? db.communityPost.findMany({
      where: { status: "published", distribution: "general", community: { status: "active" }, author,
        OR: [{ title: { contains: q } }, { subjectTitle: { contains: q } }, { spoiler: false, body: { contains: q } }] },
      select: { id: true, title: true, body: true, spoiler: true, type: true, createdAt: true, author: { select: names }, community: { select: { name: true, slug: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], ...range,
    }) : [],
    !preview && (scope === "all" || scope === "posts") ? db.communityEvent.findMany({
      where: { status: "scheduled", distribution: "general", startsAt: { gt: new Date() }, community: { status: "active" }, organizer: author, OR: [{ title: { contains: q } }, { description: { contains: q } }] },
      select: { id: true, title: true, description: true, createdAt: true, organizer: { select: names }, community: { select: { name: true, slug: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], ...range,
    }) : [],
  ]);
  const results: SearchPost[] = [
    ...music.slice(0, limit).map(item => ({ id: item.id, kind: "music" as const, title: item.trackName, excerpt: `${item.artistName}${item.note ? ` · ${item.note.slice(0, 220)}` : ""}`, href: `/p/${encodeURIComponent(item.id)}`, author: item.author.ownerName, authorHref: `/u/${encodeURIComponent(item.author.slug)}`, community: null, createdAt: item.createdAt.toISOString(), spoiler: false })),
    ...posts.slice(0, limit).map(item => ({ id: item.id, kind: item.type === "review" ? "review" as const : "discussion" as const, title: item.title, excerpt: item.spoiler ? "Spoiler içeren inceleme. Ayrıntıyı açarak okuyabilirsin." : item.body.slice(0, 240), href: `/communities/${encodeURIComponent(item.community.slug)}?post=${encodeURIComponent(item.id)}`, author: item.author.ownerName, authorHref: `/u/${encodeURIComponent(item.author.slug)}`, community: item.community.name, createdAt: item.createdAt.toISOString(), spoiler: item.spoiler })),
    ...events.slice(0, limit).map(item => ({ id: item.id, kind: "event" as const, title: item.title, excerpt: item.description.slice(0, 240), href: `/communities/${encodeURIComponent(item.community.slug)}?section=events&event=${encodeURIComponent(item.id)}`, author: item.organizer.ownerName, authorHref: `/u/${encodeURIComponent(item.organizer.slug)}`, community: item.community.name, createdAt: item.createdAt.toISOString(), spoiler: false })),
  ];
  results.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  return { query: q, scope, page,
    people: people.slice(0, limit).map(item => ({ id: item.id, title: item.ownerName, href: `/u/${encodeURIComponent(item.slug)}`, description: item.bio?.slice(0, 180) ?? "", meta: `u/${item.slug} · ${item._count.followers} takipçi` })),
    communities: communities.slice(0, limit).map(item => ({ id: item.id, title: item.name, href: `/communities/${encodeURIComponent(item.slug)}`, description: item.description.slice(0, 180), meta: `${item._count.members} üye` })),
    posts: results, hasMore: page < 50 && [people, communities, music, posts, events].some(items => items.length > limit) };
}
