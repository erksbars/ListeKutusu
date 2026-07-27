-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Suggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listId" TEXT,
    "trackId" TEXT NOT NULL,
    "trackUri" TEXT NOT NULL,
    "trackName" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "suggestedBy" TEXT,
    "suggestedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" DATETIME,
    CONSTRAINT "Suggestion_listId_fkey" FOREIGN KEY ("listId") REFERENCES "UserList" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Suggestion_suggestedById_fkey" FOREIGN KEY ("suggestedById") REFERENCES "UserList" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Suggestion" ("artistName", "createdAt", "decidedAt", "durationMs", "id", "listId", "status", "suggestedBy", "trackId", "trackName", "trackUri") SELECT "artistName", "createdAt", "decidedAt", "durationMs", "id", "listId", "status", "suggestedBy", "trackId", "trackName", "trackUri" FROM "Suggestion";
DROP TABLE "Suggestion";
ALTER TABLE "new_Suggestion" RENAME TO "Suggestion";
CREATE INDEX "Suggestion_listId_status_createdAt_idx" ON "Suggestion"("listId", "status", "createdAt");
CREATE INDEX "Suggestion_listId_trackId_idx" ON "Suggestion"("listId", "trackId");
CREATE INDEX "Suggestion_suggestedById_createdAt_idx" ON "Suggestion"("suggestedById", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
