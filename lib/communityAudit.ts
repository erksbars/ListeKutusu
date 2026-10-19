import type { Prisma } from "@prisma/client";
import { CommunityError } from "./communityError.ts";

export function moderationNote(raw: unknown): string | null {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") throw new CommunityError("Yönetim notu metin olmalı.");
  const note = raw.trim().normalize("NFC");
  if (note.length > 300 || /[\p{Cc}\p{Cf}]/u.test(note)) throw new CommunityError("Yönetim notu tek satır ve en fazla 300 karakter olmalı.");
  return note || null;
}
export async function recordCommunityAction(tx: Prisma.TransactionClient, communityId: string, actorId: string, action: string, targetType: string, targetId: string, note: string | null = null) {
  await tx.communityModerationLog.create({ data: { communityId, actorId, action, targetType, targetId, note } });
}
export function reviewCommunityReports(tx: Prisma.TransactionClient, where: Prisma.CommunityReportWhereInput, actorId: string) {
  return tx.communityReport.updateMany({ where: { ...where, status: "pending" }, data: { status: "reviewed", reviewedAt: new Date(), reviewedById: actorId } });
}
