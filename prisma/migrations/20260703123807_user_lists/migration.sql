-- CreateTable
CREATE TABLE "UserList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "spotifyPlaylistId" TEXT,
    "spotifyExternalUrl" TEXT,
    "spotifySnapshotId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastExportedAt" DATETIME,
    "recycledAt" DATETIME
);

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
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" DATETIME,
    CONSTRAINT "Suggestion_listId_fkey" FOREIGN KEY ("listId") REFERENCES "UserList" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Suggestion" ("artistName", "createdAt", "decidedAt", "durationMs", "id", "status", "suggestedBy", "trackId", "trackName", "trackUri") SELECT "artistName", "createdAt", "decidedAt", "durationMs", "id", "status", "suggestedBy", "trackId", "trackName", "trackUri" FROM "Suggestion";
DROP TABLE "Suggestion";
ALTER TABLE "new_Suggestion" RENAME TO "Suggestion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "UserList_slug_key" ON "UserList"("slug");
