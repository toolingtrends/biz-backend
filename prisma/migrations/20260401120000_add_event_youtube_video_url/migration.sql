-- AlterTable: optional promo YouTube URL (matches Prisma `Event.youtubeVideoUrl`)
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "youtubeVideoUrl" TEXT;
