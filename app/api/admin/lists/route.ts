import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { paginationMeta, parsePage, parsePageSize } from "@/lib/pagination";
import { isOwnerAuthenticated } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isOwnerAuthenticated())) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const query = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 80);
  const requestedFilter = req.nextUrl.searchParams.get("filter") || "all";
  const filter = ["all", "ready", "waiting"].includes(requestedFilter) ? requestedFilter : "all";
  const requestedPage = parsePage(req.nextUrl.searchParams.get("page"));
  const pageSize = parsePageSize(req.nextUrl.searchParams.get("pageSize"), 20, 50);
  const where = {
    status: "active",
    ...(query
      ? { OR: [{ ownerName: { contains: query } }, { playlistName: { contains: query } }, { email: { contains: query } }] }
      : {}),
    ...(filter === "ready"
      ? { spotifyExternalUrl: { not: null } }
      : filter === "waiting"
        ? { spotifyExternalUrl: null }
        : {}),
  };

  const total = await prisma.userList.count({ where });
  const meta = paginationMeta(total, requestedPage, pageSize);
  const lists = await prisma.userList.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    skip: (meta.page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      ownerName: true,
      email: true,
      role: true,
      playlistName: true,
      slug: true,
      status: true,
      spotifyExternalUrl: true,
      createdAt: true,
      updatedAt: true,
      lastExportedAt: true,
      _count: { select: { suggestions: true } },
    },
  });

  const statusCounts = lists.length
    ? await prisma.suggestion.groupBy({
        by: ["listId", "status"],
        where: { listId: { in: lists.map((list) => list.id) } },
        _count: { _all: true },
      })
    : [];
  const countsByList = new Map<string, Record<string, number>>();
  for (const row of statusCounts) {
    if (!row.listId) continue;
    const current = countsByList.get(row.listId) || {};
    current[row.status] = row._count._all;
    countsByList.set(row.listId, current);
  }

  return NextResponse.json({
    lists: lists.map((list) => ({
      ...list,
      suggestionCount: list._count.suggestions,
      pendingCount: countsByList.get(list.id)?.pending || 0,
      approvedCount: countsByList.get(list.id)?.approved || 0,
      _count: undefined,
    })),
    pagination: meta,
    filters: { query, filter },
  });
}
