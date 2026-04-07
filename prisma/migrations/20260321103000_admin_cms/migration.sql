-- CreateEnum
CREATE TYPE "AdminContentType" AS ENUM ('NEWS', 'BLOG', 'BANNER', 'FEATURED_EVENT', 'MEDIA');

-- CreateTable
CREATE TABLE "admin_app_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_content" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "AdminContentType" NOT NULL,
    "title" TEXT,
    "slug" TEXT,
    "body" TEXT,
    "extras" JSONB,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_subscription_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "interval" TEXT NOT NULL DEFAULT 'MONTHLY',
    "features" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_user_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewsAt" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_app_settings_key_key" ON "admin_app_settings"("key");

-- CreateIndex
CREATE INDEX "admin_content_type_idx" ON "admin_content"("type");

-- CreateIndex
CREATE INDEX "admin_content_published_idx" ON "admin_content"("published");

-- CreateIndex
CREATE INDEX "admin_user_subscriptions_userId_idx" ON "admin_user_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "admin_user_subscriptions_planId_idx" ON "admin_user_subscriptions"("planId");

-- CreateIndex
CREATE INDEX "admin_user_subscriptions_status_idx" ON "admin_user_subscriptions"("status");

-- AddForeignKey
ALTER TABLE "admin_user_subscriptions" ADD CONSTRAINT "admin_user_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_user_subscriptions" ADD CONSTRAINT "admin_user_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "admin_subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
