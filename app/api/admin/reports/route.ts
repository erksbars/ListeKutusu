import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isOwnerAuthenticated } from "@/lib/session";
import { groupReportsByPost } from "@/lib/moderation";
import { writeAdminAuditLog } from "@/lib/adminAudit";

export async function GET(req: NextRequest) {
  if (!(await isOwnerAuthenticated())) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const requestedStatus = req.nextUrl.searchParams.get("status") || "pending";
  const status = ["pending", "resolved", "dismissed", "all"].includes(requestedStatus)
    ? requestedStatus
    : "pending";

  const [reports, pendingCount, resolvedCount, dismissedCount] = await Promise.all([
    prisma.postReport.findMany({
    where: status === "all" ? {} : { status },
    orderBy: status === "pending" ? { createdAt: "asc" } : { reviewedAt: "desc" },
    take: 200,
    include: {
      reporter: { select: { ownerName: true, slug: true } },
      post: {
        select: {
          id: true,
          trackName: true,
          artistName: true,
          note: true,
          author: { select: { ownerName: true, slug: true } },
        },
      },
    },
    }),
    prisma.postReport.count({ where: { status: "pending" } }),
    prisma.postReport.count({ where: { status: "resolved" } }),
    prisma.postReport.count({ where: { status: "dismissed" } }),
  ]);

  return NextResponse.json({
    reports: groupReportsByPost(reports),
    stats: { pending: pendingCount, resolved: resolvedCount, dismissed: dismissedCount },
  });
}

export async function PATCH(req: NextRequest) {
  if (!(await isOwnerAuthenticated())) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const action = body?.action;
  if (!id || !["dismiss", "resolve", "remove"].includes(action)) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const report = await prisma.postReport.findUnique({
    where: { id },
    select: { id: true, postId: true, post: { select: { trackName: true, artistName: true } } },
  });
  if (!report) return NextResponse.json({ error: "Şikâyet bulunamadı." }, { status: 404 });

  await prisma.$transaction([
    prisma.postReport.updateMany({
      where: { postId: report.postId, status: "pending" },
      data: { status: action === "dismiss" ? "dismissed" : "resolved", reviewedAt: new Date() },
    }),
    ...(action === "remove"
      ? [prisma.feedPost.update({ where: { id: report.postId }, data: { status: "removed" } })]
      : []),
  ]);

  await writeAdminAuditLog({
    action: action === "remove" ? "report.remove_post" : action === "resolve" ? "report.resolve" : "report.dismiss",
    targetType: "feed_post",
    targetId: report.postId,
    targetLabel: `${report.post.trackName} - ${report.post.artistName}`,
    metadata: { reportId: report.id },
  });

  return NextResponse.json({ ok: true });
}
