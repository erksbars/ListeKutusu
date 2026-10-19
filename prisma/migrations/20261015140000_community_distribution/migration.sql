ALTER TABLE "CommunityPost" ADD COLUMN "distribution" TEXT NOT NULL DEFAULT 'community';
ALTER TABLE "CommunityEvent" ADD COLUMN "distribution" TEXT NOT NULL DEFAULT 'community';
CREATE INDEX "CommunityPost_distribution_status_createdAt_id_idx" ON "CommunityPost"("distribution", "status", "createdAt", "id");
CREATE INDEX "CommunityEvent_distribution_status_createdAt_id_idx" ON "CommunityEvent"("distribution", "status", "createdAt", "id");
