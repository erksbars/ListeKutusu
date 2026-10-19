CREATE TABLE "CommunityPostLike" (
  "userId" TEXT NOT NULL, "postId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("userId", "postId"),
  CONSTRAINT "CommunityPostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityPostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CommunityPostLike_postId_idx" ON "CommunityPostLike"("postId");
CREATE TABLE "CommunityPostSave" (
  "userId" TEXT NOT NULL, "postId" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("userId", "postId"),
  CONSTRAINT "CommunityPostSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityPostSave_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CommunityPostSave_postId_idx" ON "CommunityPostSave"("postId");
CREATE INDEX "CommunityPostSave_userId_createdAt_postId_idx" ON "CommunityPostSave"("userId", "createdAt", "postId");
