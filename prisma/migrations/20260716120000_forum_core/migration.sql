CREATE TABLE "ForumThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "approvedAt" DATETIME,
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" DATETIME,
    CONSTRAINT "ForumThread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ForumReply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ForumReply_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ForumReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "Notification" ADD COLUMN "forumThreadId" TEXT REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ForumThread_slug_key" ON "ForumThread"("slug");
CREATE INDEX "ForumThread_status_lastActivityAt_idx" ON "ForumThread"("status", "lastActivityAt");
CREATE INDEX "ForumThread_category_status_lastActivityAt_idx" ON "ForumThread"("category", "status", "lastActivityAt");
CREATE INDEX "ForumThread_authorId_createdAt_idx" ON "ForumThread"("authorId", "createdAt");
CREATE INDEX "ForumReply_threadId_status_createdAt_idx" ON "ForumReply"("threadId", "status", "createdAt");
CREATE INDEX "ForumReply_authorId_createdAt_idx" ON "ForumReply"("authorId", "createdAt");
CREATE INDEX "Notification_forumThreadId_idx" ON "Notification"("forumThreadId");
