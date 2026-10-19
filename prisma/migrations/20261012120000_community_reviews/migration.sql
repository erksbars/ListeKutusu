ALTER TABLE "CommunityPost" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'discussion';
ALTER TABLE "CommunityPost" ADD COLUMN "reviewKind" TEXT;
ALTER TABLE "CommunityPost" ADD COLUMN "subjectTitle" TEXT;
ALTER TABLE "CommunityPost" ADD COLUMN "rating" INTEGER;
ALTER TABLE "CommunityPost" ADD COLUMN "spoiler" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CommunityPost" ADD COLUMN "sourceUrl" TEXT;
