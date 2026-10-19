ALTER TABLE "Community" ADD COLUMN "universityName" TEXT;
ALTER TABLE "Community" ADD COLUMN "universityKey" TEXT;
ALTER TABLE "Community" ADD COLUMN "city" TEXT;
ALTER TABLE "Community" ADD COLUMN "cityKey" TEXT;
ALTER TABLE "Community" ADD COLUMN "interest" TEXT;
ALTER TABLE "CommunityEvent" ADD COLUMN "cityKey" TEXT NOT NULL DEFAULT '';
UPDATE "CommunityEvent" SET "cityKey" = lower(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace("city", 'Ç', 'c'), 'ç', 'c'), 'Ğ', 'g'), 'ğ', 'g'), 'İ', 'i'), 'ı', 'i'), 'Ö', 'o'), 'ö', 'o'), 'Ş', 's'), 'ş', 's'), 'Ü', 'u'), 'ü', 'u'), ' ', ''), char(9), ''), char(10), ''), char(11), ''), char(12), ''), char(13), ''), char(160), ''));
CREATE INDEX "Community_interest_createdAt_id_idx" ON "Community"("interest", "createdAt", "id");
CREATE INDEX "CommunityEvent_distribution_status_startsAt_id_idx" ON "CommunityEvent"("distribution", "status", "startsAt", "id");
