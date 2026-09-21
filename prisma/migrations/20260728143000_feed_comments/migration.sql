CREATE TABLE "FeedComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FeedComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FeedComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "FeedComment_postId_status_createdAt_idx" ON "FeedComment"("postId", "status", "createdAt");
CREATE INDEX "FeedComment_authorId_createdAt_idx" ON "FeedComment"("authorId", "createdAt");
CREATE INDEX "FeedComment_parentId_status_createdAt_idx" ON "FeedComment"("parentId", "status", "createdAt");
