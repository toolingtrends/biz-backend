-- Ensure Event.subTitle exists in Neon/PostgreSQL and backfill from shortDescription.
ALTER TABLE "events"
ADD COLUMN IF NOT EXISTS "subTitle" TEXT;

-- Backfill old rows to keep existing UI data behavior.
UPDATE "events"
SET "subTitle" = "shortDescription"
WHERE "subTitle" IS NULL
  AND "shortDescription" IS NOT NULL;
