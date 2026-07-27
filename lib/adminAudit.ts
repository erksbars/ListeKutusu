import { prisma } from "./db";

export type AdminAuditInput = {
  action: string;
  targetType: string;
  targetId?: string | null;
  targetLabel?: string | null;
  metadata?: Record<string, string | number | boolean | null> | null;
};

export async function writeAdminAuditLog(input: AdminAuditInput) {
  return prisma.adminAuditLog.create({
    data: {
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId || null,
      targetLabel: input.targetLabel?.slice(0, 240) || null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}
