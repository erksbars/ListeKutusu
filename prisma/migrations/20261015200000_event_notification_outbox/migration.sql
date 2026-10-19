CREATE TABLE "CommunityEventNotificationJob" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "availableAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" DATETIME,
  "failedAt" DATETIME,
  "failures" INTEGER NOT NULL DEFAULT 0,
  "revision" INTEGER NOT NULL DEFAULT 0,
  "errorCode" TEXT,
  CONSTRAINT "CommunityEventNotificationJob_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CommunityEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityEventNotificationJob_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "CommunityEventNotificationRecipient" (
  "jobId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  PRIMARY KEY ("jobId", "userId"),
  CONSTRAINT "CommunityEventNotificationRecipient_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "CommunityEventNotificationJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityEventNotificationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CommunityEventNotificationJob_completedAt_failedAt_availableAt_createdAt_id_idx" ON "CommunityEventNotificationJob" ("completedAt", "failedAt", "availableAt", "createdAt", "id");
CREATE INDEX "CommunityEventNotificationRecipient_userId_idx" ON "CommunityEventNotificationRecipient" ("userId");
