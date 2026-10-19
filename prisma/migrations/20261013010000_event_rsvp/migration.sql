ALTER TABLE "CommunityEvent" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "CommunityEventRsvp" (
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  PRIMARY KEY ("eventId", "userId"),
  CONSTRAINT "CommunityEventRsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CommunityEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityEventRsvp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CommunityEventRsvp_eventId_status_createdAt_idx" ON "CommunityEventRsvp"("eventId", "status", "createdAt");
CREATE INDEX "CommunityEventRsvp_userId_status_idx" ON "CommunityEventRsvp"("userId", "status");
