import { randomBytes } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { activeUser, community, communityPage } from "./communities.ts";
import { lockActiveAccount } from "./communityLifecycle.ts";
import { CommunityError } from "./communityError.ts";
import { PLATFORM_CASE_KINDS } from "./platformCommunityCaseTypes.ts";

export type PlatformCaseActor = { kind: "owner"; id: null } | { kind: "account"; id: string };
const select = { id: true, kind: true, reason: true, status: true, response: true, version: true, createdAt: true, reviewedAt: true, community: { select: { slug: true, name: true } } } as const;
function text(raw: unknown, label: string, max: number) {
  if (typeof raw !== "string") throw new CommunityError(`${label} gerekli.`);
  const value = raw.trim().replace(/\r\n?/g, "\n").normalize("NFC");
  if (value.length < 10 || value.length > max || /[\p{Cf}\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value)) throw new CommunityError(`${label} 10–${max} karakter olmalı; görünmez kontrol karakteri içeremez.`);
  return value;
}
async function staffScope(db: Prisma.TransactionClient, actor: PlatformCaseActor): Promise<Prisma.PlatformCommunityCaseWhereInput> {
  if (actor.kind === "owner") return {};
  const user = await db.userList.findFirst({ where: { id: actor.id, status: "active", role: "admin" }, select: { id: true } });
  if (!user) throw new CommunityError("Platform yönetimi yetkin yok.", 403);
  return { applicantId: { not: actor.id }, community: { ownerId: { not: actor.id }, members: { none: { userId: actor.id, role: { in: ["owner", "moderator"] } } } },
    AND: [
      { OR: [{ sourceReportId: null }, { sourceReport: { reviewedById: null } }, { sourceReport: { reviewedById: { not: actor.id } } }] },
      { OR: [{ sourceDecisionId: null }, { sourceDecision: { actorId: null } }, { sourceDecision: { actorId: { not: actor.id } } }] },
    ] };
}
export function createPlatformCommunityCases(db: PrismaClient) {
  return {
    async own(userId: string | null, pageRaw?: string, slug = "") {
      if (!userId) throw new CommunityError("Önce giriş yapmalısın.", 401);
      await activeUser(db, userId); const page = communityPage(pageRaw);
      const row = slug ? await community(db, slug) : null;
      const where = { applicantId: userId, ...(row ? { communityId: row.id } : {}) };
      const [cases, total] = await db.$transaction([
        db.platformCommunityCase.findMany({ where, select, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 20, skip: (page - 1) * 20 }), db.platformCommunityCase.count({ where }),
      ]);
      const reports = row ? await db.communityReport.findMany({ where: { communityId: row.id, reporterId: userId, status: "reviewed" }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 20, select: { id: true, targetType: true, reviewedAt: true } }) : [];
      const member = row ? await db.communityMember.findUnique({ where: { communityId_userId: { communityId: row.id, userId } }, select: { status: true } }) : null;
      return { cases, total, page, hasMore: total > page * 20, context: row ? { slug: row.slug, name: row.name, canAppealBan: member?.status === "banned", reports } : null };
    },
    async submit(userId: string, body: Record<string, unknown>) {
      const reason = text(body.reason, "Başvuru açıklaması", 1500);
      if (typeof body.kind !== "string" || !Object.hasOwn(PLATFORM_CASE_KINDS, body.kind)) throw new CommunityError("Geçerli başvuru türü seç.");
      if (typeof body.communitySlug !== "string") throw new CommunityError("Topluluk kullanıcı adı gerekli.");
      return db.$transaction(async tx => {
        await lockActiveAccount(tx, userId);
        const row = await community(tx, body.communitySlug as string);
        let subjectKey = `community:${row.id}:${randomBytes(10).toString("hex")}`, sourceReportId: string | null = null, sourceDecisionId: string | null = null;
        if (body.kind === "report_appeal") {
          if (typeof body.sourceReportId !== "string" || body.sourceReportId.length > 100) throw new CommunityError("Kendi incelenmiş şikâyetini seç.");
          const source = await tx.communityReport.findFirst({ where: { id: body.sourceReportId, communityId: row.id, reporterId: userId, status: "reviewed" }, select: { id: true } });
          if (!source) throw new CommunityError("İtiraz edilebilir şikâyet bulunamadı.", 404);
          sourceReportId = source.id; subjectKey = `report:${source.id}`;
        } else if (body.kind === "ban_appeal") {
          const member = await tx.communityMember.findUnique({ where: { communityId_userId: { communityId: row.id, userId } } });
          if (member?.status !== "banned") throw new CommunityError("Bu toplulukta güncel uzaklaştırman bulunmuyor.", 409);
          const decision = await tx.communityModerationLog.findFirst({ where: { communityId: row.id, targetType: "member", targetId: userId, action: "ban" }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true } });
          sourceDecisionId = decision?.id ?? null; subjectKey = `ban:${row.id}:${sourceDecisionId ?? "legacy"}`;
        }
        const existing = await tx.platformCommunityCase.findFirst({ where: body.kind === "community" ? { applicantId: userId, communityId: row.id, kind: "community", status: "pending" } : { applicantId: userId, subjectKey }, select: { id: true } });
        if (existing) return { id: existing.id, duplicate: true };
        const application = await tx.platformCommunityCase.create({ data: { applicantId: userId, communityId: row.id, kind: String(body.kind), subjectKey, sourceReportId, sourceDecisionId, reason }, select: { id: true } });
        await tx.platformCommunityCaseEvent.create({ data: { caseId: application.id, actorId: userId, actorKind: "applicant", action: "submitted" } });
        return { id: application.id, duplicate: false };
      });
    },
    async queue(actor: PlatformCaseActor, pageRaw?: string, status = "pending") {
      const scope = await staffScope(db, actor), page = communityPage(pageRaw);
      if (!["pending", "resolved", "dismissed", "all"].includes(status)) throw new CommunityError("Geçersiz başvuru filtresi.");
      const where = { ...scope, ...(status === "all" ? {} : { status }) };
      const [cases, total] = await db.$transaction([
        db.platformCommunityCase.findMany({ where, select, orderBy: [{ createdAt: status === "pending" ? "asc" : "desc" }, { id: status === "pending" ? "asc" : "desc" }], take: 20, skip: (page - 1) * 20 }), db.platformCommunityCase.count({ where }),
      ]);
      return { cases, total, page, hasMore: total > page * 20 };
    },
    async review(actor: PlatformCaseActor, body: Record<string, unknown>) {
      if (typeof body.id !== "string" || body.id.length > 100 || !["resolved", "dismissed"].includes(String(body.status))) throw new CommunityError("Geçersiz karar.");
      if (typeof body.expectedVersion !== "number" || !Number.isInteger(body.expectedVersion) || body.expectedVersion < 0) throw new CommunityError("Geçerli başvuru sürümü gerekli.");
      const response = text(body.response, "Başvurana yanıt", 1000);
      return db.$transaction(async tx => {
        if (actor.kind === "account") await lockActiveAccount(tx, actor.id);
        const scope = await staffScope(tx, actor);
        const locked = await tx.platformCommunityCase.updateMany({ where: { ...scope, id: body.id as string, status: "pending", version: body.expectedVersion as number }, data: { version: { increment: 1 } } });
        if (!locked.count) throw new CommunityError("Başvuru değişmiş veya kapanmış. Yeniden yükle.", 409);
        const application = await tx.platformCommunityCase.findFirst({ where: { id: body.id as string, ...scope }, select: { id: true } });
        if (!application) throw new CommunityError("Başvuru bulunamadı.", 404);
        await tx.platformCommunityCase.update({ where: { id: application.id }, data: { status: String(body.status), response, reviewedAt: new Date(), reviewerId: actor.id, reviewerKind: actor.kind } });
        await tx.platformCommunityCaseEvent.create({ data: { caseId: application.id, actorId: actor.id, actorKind: actor.kind, action: String(body.status) } });
        return { ok: true };
      });
    },
  };
}
