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

  const [reports, commentReports, postPending, postResolved, postDismissed, commentPending, commentResolved, commentDismissed] = await Promise.all([
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
    prisma.commentReport.findMany({
      where: status === "all" ? {} : { status },
      orderBy: status === "pending" ? { createdAt: "asc" } : { reviewedAt: "desc" },
      take: 200,
      include: {
        reporter: { select: { ownerName: true, slug: true } },
        comment: {
          select: {
            id: true,
            body: true,
            author: { select: { ownerName: true, slug: true } },
            post: { select: { id: true, trackName: true, artistName: true, note: true, author: { select: { ownerName: true, slug: true } } } },
          },
        },
      },
    }),
    prisma.postReport.count({ where: { status: "pending" } }),
    prisma.postReport.count({ where: { status: "resolved" } }),
    prisma.postReport.count({ where: { status: "dismissed" } }),
    prisma.commentReport.count({ where: { status: "pending" } }),
    prisma.commentReport.count({ where: { status: "resolved" } }),
    prisma.commentReport.count({ where: { status: "dismissed" } }),
  ]);

  const groupedPosts = groupReportsByPost(reports).map((report) => ({ ...report, targetType: "post" as const, comment: null }));
  const groupedComments = new Map<string, (typeof commentReports)[number] & { reportCount: number; reasons: string[]; reporters: Array<{ ownerName: string; slug: string }> }>();
  for (const report of commentReports) {
    const current = groupedComments.get(report.commentId);
    if (current) {
      current.reportCount += 1;
      if (!current.reasons.includes(report.reason)) current.reasons.push(report.reason);
      current.reporters.push(report.reporter);
    } else {
      groupedComments.set(report.commentId, { ...report, reportCount: 1, reasons: [report.reason], reporters: [report.reporter] });
    }
  }
  const normalizedComments = Array.from(groupedComments.values()).map((report) => ({
    ...report,
    id: `comment:${report.id}`,
    targetType: "comment" as const,
    post: report.comment.post,
    comment: { id: report.comment.id, body: report.comment.body, author: report.comment.author },
  }));

  return NextResponse.json({
    reports: [...groupedPosts, ...normalizedComments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    stats: { pending: postPending + commentPending, resolved: postResolved + commentResolved, dismissed: postDismissed + commentDismissed },
  });
}

export async function PATCH(req: NextRequest) {
  if (!(await isOwnerAuthenticated())) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const rawId = typeof body?.id === "string" ? body.id : "";
  const isComment = rawId.startsWith("comment:");
  const id = isComment ? rawId.slice("comment:".length) : rawId;
  const action = body?.action;
  if (!id || !["dismiss", "resolve", "remove"].includes(action)) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (isComment) {
    const report = await prisma.commentReport.findUnique({
      where: { id },
      select: { id: true, commentId: true, comment: { select: { body: true } } },
    });
    if (!report) return NextResponse.json({ error: "Şikâyet bulunamadı." }, { status: 404 });
    await prisma.$transaction([
      prisma.commentReport.updateMany({ where: { commentId: report.commentId, status: "pending" }, data: { status: action === "dismiss" ? "dismissed" : "resolved", reviewedAt: new Date() } }),
      ...(action === "remove" ? [
        prisma.feedComment.update({ where: { id: report.commentId }, data: { status: "removed" } }),
        prisma.feedComment.updateMany({ where: { parentId: report.commentId }, data: { status: "removed" } }),
      ] : []),
    ]);
    await writeAdminAuditLog({
      action: action === "remove" ? "report.remove_comment" : action === "resolve" ? "report.resolve" : "report.dismiss",
      targetType: "feed_comment",
      targetId: report.commentId,
      targetLabel: report.comment.body.slice(0, 80),
      metadata: { reportId: report.id },
    });
    return NextResponse.json({ ok: true });
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
