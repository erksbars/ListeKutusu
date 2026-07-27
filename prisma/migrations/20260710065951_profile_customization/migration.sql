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
    "adminCode" TEXT,
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
INSERT INTO "new_UserList" ("adminCode", "createdAt", "email", "id", "lastExportedAt", "ownerName", "passwordHash", "playlistName", "recycledAt", "slug", "spotifyExternalUrl", "spotifyPlaylistId", "spotifySnapshotId", "status", "submitCode", "updatedAt") SELECT "adminCode", "createdAt", "email", "id", "lastExportedAt", "ownerName", "passwordHash", "playlistName", "recycledAt", "slug", "spotifyExternalUrl", "spotifyPlaylistId", "spotifySnapshotId", "status", "submitCode", "updatedAt" FROM "UserList";
DROP TABLE "UserList";
ALTER TABLE "new_UserList" RENAME TO "UserList";
CREATE UNIQUE INDEX "UserList_email_key" ON "UserList"("email");
CREATE UNIQUE INDEX "UserList_slug_key" ON "UserList"("slug");
CREATE UNIQUE INDEX "UserList_adminCode_key" ON "UserList"("adminCode");
CREATE UNIQUE INDEX "UserList_submitCode_key" ON "UserList"("submitCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
