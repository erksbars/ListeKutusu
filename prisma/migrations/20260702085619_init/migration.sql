-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "spotifyUserId" TEXT,
    "spotifyAccessToken" TEXT,
    "spotifyRefreshToken" TEXT,
    "spotifyExpiresAt" DATETIME,
    "playlistId" TEXT,
    "playlistName" TEXT
);

-- CreateTable
CREATE TABLE "WhitelistCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trackId" TEXT NOT NULL,
    "trackUri" TEXT NOT NULL,
    "trackName" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "suggestedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "WhitelistCode_code_key" ON "WhitelistCode"("code");
