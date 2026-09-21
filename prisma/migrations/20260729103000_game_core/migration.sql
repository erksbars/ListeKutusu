CREATE TABLE "GameSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "gameCode" TEXT NOT NULL,
  "gameVersion" INTEGER NOT NULL DEFAULT 1,
  "ownerId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'setup',
  "visibility" TEXT NOT NULL DEFAULT 'private',
  "source" TEXT NOT NULL DEFAULT 'personal',
  "targetSize" INTEGER NOT NULL,
  "currentRound" INTEGER NOT NULL DEFAULT 1,
  "state" TEXT NOT NULL,
  "winnerEntryId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "startedAt" DATETIME,
  "completedAt" DATETIME,
  CONSTRAINT "GameSession_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "GamePlayer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "seat" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'ready',
  "score" INTEGER NOT NULL DEFAULT 0,
  "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GamePlayer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GamePlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "GameEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "trackId" TEXT NOT NULL,
  "trackName" TEXT NOT NULL,
  "artistName" TEXT NOT NULL,
  "externalUrl" TEXT,
  "seed" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GameEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "GameVote" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "selectedEntryId" TEXT NOT NULL,
  "roundNumber" INTEGER NOT NULL,
  "matchupNumber" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GameVote_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GameVote_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "GamePlayer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GameVote_selectedEntryId_fkey" FOREIGN KEY ("selectedEntryId") REFERENCES "GameEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "GameSession_ownerId_status_updatedAt_idx" ON "GameSession"("ownerId", "status", "updatedAt");
CREATE INDEX "GameSession_gameCode_status_createdAt_idx" ON "GameSession"("gameCode", "status", "createdAt");
CREATE UNIQUE INDEX "GamePlayer_sessionId_userId_key" ON "GamePlayer"("sessionId", "userId");
CREATE INDEX "GamePlayer_userId_joinedAt_idx" ON "GamePlayer"("userId", "joinedAt");
CREATE UNIQUE INDEX "GameEntry_sessionId_trackId_key" ON "GameEntry"("sessionId", "trackId");
CREATE INDEX "GameEntry_sessionId_seed_idx" ON "GameEntry"("sessionId", "seed");
CREATE UNIQUE INDEX "GameVote_sessionId_playerId_roundNumber_matchupNumber_key" ON "GameVote"("sessionId", "playerId", "roundNumber", "matchupNumber");
CREATE INDEX "GameVote_sessionId_roundNumber_matchupNumber_idx" ON "GameVote"("sessionId", "roundNumber", "matchupNumber");
