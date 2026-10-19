CREATE TABLE "CommunityEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "communityId" TEXT NOT NULL,
  "organizerId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "startsAt" DATETIME NOT NULL,
  "timeZone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
  "city" TEXT NOT NULL,
  "venue" TEXT NOT NULL,
  "capacity" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "CommunityEvent_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityEvent_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CommunityEvent_communityId_status_startsAt_id_idx" ON "CommunityEvent"("communityId", "status", "startsAt", "id");
