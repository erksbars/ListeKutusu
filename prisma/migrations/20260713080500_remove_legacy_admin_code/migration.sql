-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerName" TEXT NOT NULL,
    "playlistName" TEXT,
    "bio" TEXT,
    "favoriteGenres" TEXT,
    "profileTheme" TEXT NOT NULL DEFAULT 'aurora',
    "email" TEXT,
    "passwordHash" TEXT,
    "slug" TEXT NOT NULL,
    "submitCode" TEXT,
    "spotifyPlaylistId" TEXT,
    "spotifyExternalUrl" TEXT,
    "spotifySnapshotId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastExportedAt" DATETIME,
    "recycledAt" DATETIME
);
INSERT INTO "new_UserList" ("bio", "createdAt", "email", "favoriteGenres", "id", "lastExportedAt", "ownerName", "passwordHash", "playlistName", "profileTheme", "recycledAt", "slug", "spotifyExternalUrl", "spotifyPlaylistId", "spotifySnapshotId", "status", "submitCode", "updatedAt")
SELECT "bio", "createdAt", "email", "favoriteGenres", "id", "lastExportedAt", "ownerName", "passwordHash", "playlistName", "profileTheme", "recycledAt", "slug", "spotifyExternalUrl", "spotifyPlaylistId", "spotifySnapshotId", "status", "submitCode", "updatedAt" FROM "UserList";
DROP TABLE "UserList";
ALTER TABLE "new_UserList" RENAME TO "UserList";
CREATE UNIQUE INDEX "UserList_email_key" ON "UserList"("email");
CREATE UNIQUE INDEX "UserList_slug_key" ON "UserList"("slug");
CREATE UNIQUE INDEX "UserList_submitCode_key" ON "UserList"("submitCode");
CREATE INDEX "UserList_status_updatedAt_idx" ON "UserList"("status", "updatedAt");
CREATE INDEX "UserList_spotifyPlaylistId_status_lastExportedAt_idx" ON "UserList"("spotifyPlaylistId", "status", "lastExportedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
