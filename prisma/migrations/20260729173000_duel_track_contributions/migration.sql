PRAGMA foreign_keys=OFF;

CREATE TABLE "new_GameEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "submittedByPlayerId" TEXT,
  "trackId" TEXT NOT NULL,
  "trackName" TEXT NOT NULL,
  "artistName" TEXT NOT NULL,
  "externalUrl" TEXT,
  "youtubeVideoId" TEXT,
  "seed" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GameEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GameEntry_submittedByPlayerId_fkey" FOREIGN KEY ("submittedByPlayerId") REFERENCES "GamePlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_GameEntry" ("id", "sessionId", "trackId", "trackName", "artistName", "externalUrl", "seed", "createdAt")
SELECT "id", "sessionId", "trackId", "trackName", "artistName", "externalUrl", "seed", "createdAt" FROM "GameEntry";

DROP TABLE "GameEntry";
ALTER TABLE "new_GameEntry" RENAME TO "GameEntry";
CREATE UNIQUE INDEX "GameEntry_sessionId_trackId_key" ON "GameEntry"("sessionId", "trackId");
CREATE INDEX "GameEntry_sessionId_seed_idx" ON "GameEntry"("sessionId", "seed");
CREATE INDEX "GameEntry_sessionId_submittedByPlayerId_idx" ON "GameEntry"("sessionId", "submittedByPlayerId");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
