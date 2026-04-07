-- CreateTable
CREATE TABLE "admin_role_definitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_role_definitions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_role_definitions_slug_key" ON "admin_role_definitions"("slug");

CREATE INDEX "admin_role_definitions_isActive_idx" ON "admin_role_definitions"("isActive");
