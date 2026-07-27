-- CreateIndex
CREATE INDEX "FeedPost_status_createdAt_idx" ON "FeedPost"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Suggestion_listId_status_createdAt_idx" ON "Suggestion"("listId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Suggestion_listId_trackId_idx" ON "Suggestion"("listId", "trackId");

-- CreateIndex
CREATE INDEX "UserList_status_updatedAt_idx" ON "UserList"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "UserList_spotifyPlaylistId_status_lastExportedAt_idx" ON "UserList"("spotifyPlaylistId", "status", "lastExportedAt");
