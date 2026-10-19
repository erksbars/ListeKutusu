CREATE TABLE "MediaLibraryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "creators" TEXT NOT NULL DEFAULT '[]',
    "year" INTEGER,
    "sourceUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MediaLibraryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MediaLibraryEntry_kind_provider" CHECK (("kind" IN ('movie', 'tv') AND "provider" = 'tmdb') OR ("kind" = 'book' AND "provider" = 'openlibrary')),
    CONSTRAINT "MediaLibraryEntry_status" CHECK (("kind" = 'book' AND "status" IN ('to_read', 'reading', 'read')) OR ("kind" IN ('movie', 'tv') AND "status" IN ('to_watch', 'watching', 'watched')))
);
CREATE UNIQUE INDEX "MediaLibraryEntry_userId_catalogId_key" ON "MediaLibraryEntry"("userId", "catalogId");
CREATE INDEX "MediaLibraryEntry_userId_kind_createdAt_id_idx" ON "MediaLibraryEntry"("userId", "kind", "createdAt", "id");
