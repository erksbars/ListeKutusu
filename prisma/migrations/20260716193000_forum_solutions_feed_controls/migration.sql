ALTER TABLE "ForumThread" ADD COLUMN "acceptedReplyId" TEXT REFERENCES "ForumReply"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ForumThread" ADD COLUMN "acceptedAt" DATETIME;

CREATE UNIQUE INDEX "ForumThread_acceptedReplyId_key" ON "ForumThread"("acceptedReplyId");

CREATE TABLE "FeedSave" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedSave_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "FeedHide" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedHide_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedHide_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "FeedSave_postId_userId_key" ON "FeedSave"("postId", "userId");
CREATE INDEX "FeedSave_userId_createdAt_idx" ON "FeedSave"("userId", "createdAt");
CREATE UNIQUE INDEX "FeedHide_postId_userId_key" ON "FeedHide"("postId", "userId");
CREATE INDEX "FeedHide_userId_createdAt_idx" ON "FeedHide"("userId", "createdAt");
