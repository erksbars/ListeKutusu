ALTER TABLE "Community" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "Community" ADD COLUMN "archivedAt" DATETIME;
ALTER TABLE "Community" ADD COLUMN "lifecycleRevision" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "CommunityOwnershipOffer" (
  "communityId" TEXT NOT NULL PRIMARY KEY,
  "id" TEXT NOT NULL,
  "fromUserId" TEXT NOT NULL,
  "toUserId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" DATETIME NOT NULL,
  CONSTRAINT "CommunityOwnershipOffer_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityOwnershipOffer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityOwnershipOffer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CommunityOwnershipOffer_id_key" ON "CommunityOwnershipOffer" ("id");
CREATE INDEX "CommunityOwnershipOffer_toUserId_expiresAt_idx" ON "CommunityOwnershipOffer" ("toUserId", "expiresAt");
