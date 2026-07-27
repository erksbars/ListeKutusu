-- CreateTable
CREATE TABLE "PostReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    CONSTRAINT "PostReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PostReport_status_createdAt_idx" ON "PostReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PostReport_postId_idx" ON "PostReport"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostReport_reporterId_postId_key" ON "PostReport"("reporterId", "postId");

-- CreateIndex
CREATE INDEX "UserBlock_blockedId_createdAt_idx" ON "UserBlock"("blockedId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId");
