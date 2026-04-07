-- AlterTable
ALTER TABLE "otps" ADD COLUMN "purpose" TEXT NOT NULL DEFAULT 'registration';

-- CreateIndex
CREATE INDEX "otps_email_purpose_idx" ON "otps"("email", "purpose");
