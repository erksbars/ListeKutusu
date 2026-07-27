import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isOwnerAuthenticated } from "@/lib/session";
import { buildAdminAuditCsv, parseAdminReportRange } from "@/lib/adminReporting";
import { paginationMeta, parsePage, parsePageSize } from "@/lib/pagination";

export const dynamic = "force-dynamic";

const TARGET_GROUPS: Record<string, string[]> = {
  suggestion: ["suggestion"],
  report: ["feed_post"],
  forum: ["forum_thread", "forum_reply"],
  user: ["user"],
  settings: ["settings"],
};

function parseMetadata(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value) as Record<string, string | number | boolean | null>;
  } catch {
    return { raw: value };
  }
}

export async function GET(req: NextRequest) {
  if (!(await isOwnerAuthenticated())) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  let range;
  try {
    range = parseAdminReportRange(req.nextUrl.searchParams.get("from"), req.nextUrl.searchParams.get("to"));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Geçersiz tarih aralığı." }, { status: 400 });
  }

  const requestedKind = req.nextUrl.searchParams.get("kind") || "all";
  const kind = requestedKind === "all" || requestedKind in TARGET_GROUPS ? requestedKind : "all";
  const createdAt = { gte: range.from, lte: range.to };
  const auditWhere = {
    createdAt,
    ...(kind === "all" ? {} : { targetType: { in: TARGET_GROUPS[kind] } }),
  };
  const isCsv = req.nextUrl.searchParams.get("format") === "csv";

  if (isCsv) {
    const rows = await prisma.adminAuditLog.findMany({ where: auditWhere, orderBy: { createdAt: "desc" }, take: 5000 });
    return new NextResponse(buildAdminAuditCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="yonetim-islemleri-${range.fromDate}-${range.toDate}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const requestedPage = parsePage(req.nextUrl.searchParams.get("page"));
  const pageSize = parsePageSize(req.nextUrl.searchParams.get("pageSize"), 20, 50);
  const [newAccounts, suggestions, approvedSuggestions, rejectedSuggestions, feedPosts, forumThreads, reports, auditEvents] = await Promise.all([
    prisma.userList.count({ where: { createdAt, status: "active" } }),
    prisma.suggestion.count({ where: { createdAt } }),
    prisma.suggestion.count({ where: { decidedAt: createdAt, status: "approved" } }),
    prisma.suggestion.count({ where: { decidedAt: createdAt, status: "rejected" } }),
    prisma.feedPost.count({ where: { createdAt, status: "published" } }),
    prisma.forumThread.count({ where: { createdAt } }),
    prisma.postReport.count({ where: { createdAt } }),
    prisma.adminAuditLog.count({ where: auditWhere }),
  ]);
  const pagination = paginationMeta(auditEvents, requestedPage, pageSize);
  const logs = await prisma.adminAuditLog.findMany({
    where: auditWhere,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (pagination.page - 1) * pageSize,
    take: pageSize,
  });

  return NextResponse.json({
    range: { from: range.fromDate, to: range.toDate },
    kind,
    summary: { newAccounts, suggestions, approvedSuggestions, rejectedSuggestions, feedPosts, forumThreads, reports, auditEvents },
    pagination,
    logs: logs.map((log) => ({
      ...log,
      metadata: parseMetadata(log.metadata),
    })),
  });
}
