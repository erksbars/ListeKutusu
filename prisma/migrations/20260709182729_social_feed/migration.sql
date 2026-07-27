-- CreateTable
CREATE TABLE "FeedPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "trackUri" TEXT,
    "trackName" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "albumName" TEXT,
    "durationMs" INTEGER,
    "externalUrl" TEXT,
    "source" TEXT NOT NULL DEFAULT 'spotify',
    "note" TEXT,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FeedPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeedLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeedLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FeedPost_authorId_createdAt_idx" ON "FeedPost"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedPost_createdAt_idx" ON "FeedPost"("createdAt");

-- CreateIndex
CREATE INDEX "FeedLike_userId_createdAt_idx" ON "FeedLike"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeedLike_postId_userId_key" ON "FeedLike"("postId", "userId");
