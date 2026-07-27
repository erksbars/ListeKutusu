-- CreateTable
CREATE TABLE "AccountSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "persistent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    CONSTRAINT "AccountSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountSession_tokenHash_key" ON "AccountSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AccountSession_userId_revokedAt_expiresAt_idx" ON "AccountSession"("userId", "revokedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "AccountSession_expiresAt_idx" ON "AccountSession"("expiresAt");
