ALTER TABLE "CommunityReport" ADD COLUMN "reviewedAt" DATETIME;
ALTER TABLE "CommunityReport" ADD COLUMN "reviewedById" TEXT REFERENCES "UserList" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TABLE "CommunityModerationLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "communityId" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityModerationLog_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityModerationLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserList" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "CommunityModerationLog_communityId_createdAt_id_idx" ON "CommunityModerationLog" ("communityId", "createdAt", "id");
