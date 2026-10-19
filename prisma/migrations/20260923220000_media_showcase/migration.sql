ALTER TABLE "MediaLibraryEntry" ADD COLUMN "showcasedAt" DATETIME;
CREATE INDEX "MediaLibraryEntry_userId_showcasedAt_idx" ON "MediaLibraryEntry"("userId", "showcasedAt");
