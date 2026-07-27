-- CreateTable
CREATE TABLE "FeedListAdd" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "suggestionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedListAdd_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedListAdd_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedListAdd_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "Suggestion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FeedListAdd_userId_createdAt_idx" ON "FeedListAdd"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedListAdd_suggestionId_idx" ON "FeedListAdd"("suggestionId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedListAdd_postId_userId_key" ON "FeedListAdd"("postId", "userId");
