-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "postId" TEXT,
    "type" TEXT NOT NULL,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserList" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_actorId_createdAt_idx" ON "Notification"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_postId_idx" ON "Notification"("postId");
