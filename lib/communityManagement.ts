import type { Prisma, PrismaClient } from "@prisma/client";
import { activeUser, community, communityPage, membership } from "./communities.ts";
import { CommunityError } from "./communityError.ts";

const person = { id: true, ownerName: true, slug: true, status: true } as const;
function publicStaff(actor: { id: string; ownerName: string; slug: string; status: string } | null) {
  return actor?.status === "active" ? { id: actor.id, ownerName: actor.ownerName, slug: actor.slug } : null;
}
export async function communityManagement(db: PrismaClient, slug: string, userId: string | null, params: Record<string, string>) {
  if (!userId) throw new CommunityError("Önce giriş yapmalısın.", 401);
  await activeUser(db, userId);
  const row = await community(db, slug), member = await membership(db, row.id, userId, true);
  if (member.role !== "owner" && member.role !== "moderator") throw new CommunityError("Topluluk yönetimi yetkin yok.", 403);
  const view = params.view || "reports", page = communityPage(params.page);
  if (!["reports", "members", "history"].includes(view)) throw new CommunityError("Geçersiz yönetim görünümü.");
  const base = { view, page, members: [], reports: [], logs: [] };
  const paging = { take: 20, skip: (page - 1) * 20 };
  if (view === "members") {
    const status = params.status || "active", q = (params.q || "").trim();
    if (!["active", "banned", "all"].includes(status) || q.length > 100) throw new CommunityError("Geçersiz üye filtresi.");
    const where: Prisma.CommunityMemberWhereInput = { communityId: row.id, ...(status === "all" ? {} : { status }), user: { status: "active", ...(q ? { OR: [{ ownerName: { contains: q } }, { slug: { contains: q } }] } : {}) } };
    const [members, total] = await db.$transaction([
      db.communityMember.findMany({ where, ...paging, orderBy: [{ joinedAt: "desc" }, { userId: "desc" }], select: { userId: true, role: true, status: true, user: { select: { id: true, ownerName: true, slug: true } } } }),
      db.communityMember.count({ where }),
    ]);
    return { ...base, members, total, hasMore: total > page * 20 };
  }
  if (view === "history") {
    const [logs, total] = await db.$transaction([
      db.communityModerationLog.findMany({ where: { communityId: row.id }, ...paging, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, action: true, targetType: true, targetId: true, note: true, createdAt: true, actor: { select: person } } }),
      db.communityModerationLog.count({ where: { communityId: row.id } }),
    ]);
    return { ...base, logs: logs.map(log => ({ ...log, actor: publicStaff(log.actor) })), total, hasMore: total > page * 20 };
  }
  const status = params.status || "pending", type = params.type || "all";
  if (!["pending", "reviewed", "all"].includes(status) || !["all", "post", "comment", "event"].includes(type)) throw new CommunityError("Geçersiz bildirim filtresi.");
  const where = { communityId: row.id, ...(status === "all" ? {} : { status }), ...(type === "all" ? {} : { targetType: type }) };
  const direction = status === "pending" ? "asc" : "desc";
  const [reports, total] = await db.$transaction([
    db.communityReport.findMany({ where, ...paging, orderBy: [{ createdAt: direction }, { id: direction }], select: { id: true, targetType: true, targetId: true, reason: true, status: true, createdAt: true, reviewedAt: true, reviewedBy: { select: person } } }),
    db.communityReport.count({ where }),
  ]);
  const comments = await db.communityComment.findMany({ where: { id: { in: reports.filter(report => report.targetType === "comment").map(report => report.targetId) }, post: { communityId: row.id } }, select: { id: true, postId: true } });
  return { ...base, reports: reports.map(report => ({ ...report, reviewedBy: publicStaff(report.reviewedBy), postId: report.targetType === "post" ? report.targetId : comments.find(comment => comment.id === report.targetId)?.postId ?? null })), total, hasMore: total > page * 20 };
}
