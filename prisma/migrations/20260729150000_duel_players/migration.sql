ALTER TABLE "GamePlayer" ADD COLUMN "state" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "GamePlayer" ADD COLUMN "winnerEntryId" TEXT;
ALTER TABLE "GamePlayer" ADD COLUMN "completedAt" DATETIME;

UPDATE "GamePlayer"
SET
  "state" = COALESCE(
    (SELECT "state" FROM "GameSession" WHERE "GameSession"."id" = "GamePlayer"."sessionId"),
    '{}'
  ),
  "winnerEntryId" = (
    SELECT "winnerEntryId" FROM "GameSession" WHERE "GameSession"."id" = "GamePlayer"."sessionId"
  ),
  "completedAt" = (
    SELECT "completedAt" FROM "GameSession" WHERE "GameSession"."id" = "GamePlayer"."sessionId"
  ),
  "status" = CASE
    WHEN (SELECT "status" FROM "GameSession" WHERE "GameSession"."id" = "GamePlayer"."sessionId") = 'completed'
    THEN 'completed'
    ELSE "status"
  END;
