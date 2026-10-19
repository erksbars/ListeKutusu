CREATE TABLE "PlatformCommunityCase" (
  "id" TEXT NOT NULL PRIMARY KEY, "communityId" TEXT NOT NULL, "applicantId" TEXT NOT NULL,
  "kind" TEXT NOT NULL, "subjectKey" TEXT NOT NULL, "sourceReportId" TEXT, "sourceDecisionId" TEXT,
  "reason" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'pending', "response" TEXT,
  "version" INTEGER NOT NULL DEFAULT 0, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" DATETIME, "reviewerId" TEXT, "reviewerKind" TEXT,
  CONSTRAINT "PlatformCommunityCase_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PlatformCommunityCase_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PlatformCommunityCase_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "UserList" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "PlatformCommunityCase_sourceReportId_fkey" FOREIGN KEY ("sourceReportId") REFERENCES "CommunityReport" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "PlatformCommunityCase_sourceDecisionId_fkey" FOREIGN KEY ("sourceDecisionId") REFERENCES "CommunityModerationLog" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "PlatformCommunityCaseEvent" (
  "id" TEXT NOT NULL PRIMARY KEY, "caseId" TEXT NOT NULL, "actorId" TEXT, "actorKind" TEXT NOT NULL,
  "action" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformCommunityCaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "PlatformCommunityCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PlatformCommunityCaseEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserList" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PlatformCommunityCase_applicantId_subjectKey_key" ON "PlatformCommunityCase" ("applicantId", "subjectKey");
CREATE INDEX "PlatformCommunityCase_applicantId_createdAt_id_idx" ON "PlatformCommunityCase" ("applicantId", "createdAt", "id");
CREATE INDEX "PlatformCommunityCase_status_createdAt_id_idx" ON "PlatformCommunityCase" ("status", "createdAt", "id");
CREATE INDEX "PlatformCommunityCaseEvent_caseId_createdAt_id_idx" ON "PlatformCommunityCaseEvent" ("caseId", "createdAt", "id");
