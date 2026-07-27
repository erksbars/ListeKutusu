CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "targetLabel" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");
CREATE INDEX "AdminAuditLog_targetType_createdAt_idx" ON "AdminAuditLog"("targetType", "createdAt");
