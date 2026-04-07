-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'SUB_ADMIN');

-- CreateEnum
CREATE TYPE "AdminType" AS ENUM ('SUPER_ADMIN', 'SUB_ADMIN');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ORGANIZER', 'ATTENDEE', 'SPEAKER', 'EXHIBITOR', 'VENUE_MANAGER');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('KEYNOTE', 'PRESENTATION', 'WORKSHOP', 'PANEL', 'ROUNDTABLE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExhibitionSpaceType" AS ENUM ('SHELL_SPACE', 'RAW_SPACE', 'TWO_SIDE_OPEN', 'THREE_SIDE_OPEN', 'FOUR_SIDE_OPEN', 'MEZZANINE', 'ADDITIONAL_POWER', 'COMPRESSED_AIR', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BoothStatus" AS ENUM ('BOOKED', 'CONFIRMED', 'SETUP', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "super_admins" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'SUPER_ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "permissions" TEXT[],
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockoutUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_admins" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'SUB_ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "permissions" TEXT[],
    "createdById" UUID NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockoutUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" UUID NOT NULL,
    "adminId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminType" "AdminType" NOT NULL,
    "superAdminId" UUID,
    "subAdminId" UUID,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" UUID NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminType" "AdminType" NOT NULL,
    "superAdminId" UUID,
    "subAdminId" UUID,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL DEFAULT 'TEMP_PASSWORD',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ATTENDEE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockoutUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "otp" TEXT,
    "otpExpiry" TIMESTAMP(3),
    "lastPasswordChange" TIMESTAMP(3),
    "passwordResetAttempts" INTEGER NOT NULL DEFAULT 0,
    "bio" TEXT,
    "website" TEXT,
    "linkedin" TEXT,
    "twitter" TEXT,
    "instagram" TEXT,
    "company" TEXT,
    "companyIndustry" TEXT,
    "jobTitle" TEXT,
    "location" TEXT,
    "timezone" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "organizationName" TEXT,
    "description" TEXT,
    "headquarters" TEXT,
    "founded" TEXT,
    "teamSize" TEXT,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "businessEmail" TEXT,
    "businessPhone" TEXT,
    "businessAddress" TEXT,
    "taxId" TEXT,
    "totalEvents" INTEGER NOT NULL DEFAULT 0,
    "activeEvents" INTEGER NOT NULL DEFAULT 0,
    "totalAttendees" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "organizerId" UUID,
    "organizerIdForExhibitor" UUID,
    "organizerIdForVenueManager" UUID,
    "venueName" TEXT,
    "venueDescription" TEXT,
    "venueAddress" TEXT,
    "venueCity" TEXT,
    "venueState" TEXT,
    "venueCountry" TEXT,
    "venueZipCode" TEXT,
    "venuePhone" TEXT,
    "venueEmail" TEXT,
    "venueWebsite" TEXT,
    "maxCapacity" INTEGER,
    "totalHalls" INTEGER,
    "activeBookings" INTEGER,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "venueImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "venueVideos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "floorPlans" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "virtualTour" TEXT,
    "basePrice" DOUBLE PRECISION,
    "venueCurrency" TEXT NOT NULL DEFAULT 'USD',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "speakingExperience" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "slug" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "category" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "edition" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eventType" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verifiedBadgeImage" TEXT,
    "isFeatured" BOOLEAN DEFAULT false,
    "isVIP" BOOLEAN DEFAULT false,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "registrationStart" TIMESTAMP(3) NOT NULL,
    "registrationEnd" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "venueId" UUID,
    "isVirtual" BOOLEAN NOT NULL DEFAULT false,
    "virtualLink" TEXT,
    "maxAttendees" INTEGER,
    "currentAttendees" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "brochure" TEXT,
    "layoutPlan" TEXT,
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bannerImage" TEXT,
    "thumbnailImage" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "allowWaitlist" BOOLEAN NOT NULL DEFAULT false,
    "refundPolicy" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "organizerId" UUID NOT NULL,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "rejectionReason" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_types" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "earlyBirdPrice" DOUBLE PRECISION,
    "earlyBirdEnd" TIMESTAMP(3),
    "quantity" INTEGER NOT NULL,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exhibition_spaces" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "spaceType" "ExhibitionSpaceType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dimensions" TEXT,
    "area" DOUBLE PRECISION NOT NULL,
    "location" TEXT,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "pricePerSqm" DOUBLE PRECISION,
    "minArea" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "powerIncluded" BOOLEAN NOT NULL DEFAULT false,
    "additionalPowerRate" DOUBLE PRECISION,
    "compressedAirRate" DOUBLE PRECISION,
    "unit" TEXT,
    "pricePerUnit" DOUBLE PRECISION,
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "maxBooths" INTEGER,
    "bookedBooths" INTEGER NOT NULL DEFAULT 0,
    "setupRequirements" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exhibition_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exhibitor_booths" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "exhibitorId" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "spaceReference" TEXT,
    "boothNumber" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "description" TEXT,
    "additionalPower" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "compressedAir" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "setupRequirements" JSONB,
    "specialRequests" TEXT,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "BoothStatus" NOT NULL DEFAULT 'BOOKED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exhibitor_booths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speaker_sessions" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "speakerId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sessionType" "SessionType" NOT NULL,
    "duration" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "room" TEXT,
    "abstract" TEXT,
    "learningObjectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetAudience" TEXT,
    "youtube" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "speaker_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL,
    "organizerId" UUID,
    "exhibitorId" UUID,
    "eventId" UUID,
    "packageType" TEXT NOT NULL,
    "targetCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_events" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "ticketTypeId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "eventId" UUID,
    "exhibitorId" UUID,
    "venueId" UUID,
    "organizerId" UUID,
    "rating" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_leads" (
    "id" UUID NOT NULL,
    "eventId" UUID,
    "userId" UUID,
    "ticketTypeId" TEXT,
    "type" TEXT,
    "status" TEXT DEFAULT 'NEW',
    "notes" TEXT,
    "contactedAt" TIMESTAMP(3),
    "followUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_analytics" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "totalRegistrations" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "averageTimeOnPage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "topCountries" JSONB,
    "topCities" JSONB,
    "trafficSources" JSONB,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_appointments" (
    "id" UUID NOT NULL,
    "venueId" UUID NOT NULL,
    "visitorId" UUID,
    "requestedDate" TIMESTAMP(3) NOT NULL,
    "requestedTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "purpose" TEXT,
    "notes" TEXT,
    "location" TEXT,
    "meetingLink" TEXT,
    "type" TEXT NOT NULL DEFAULT 'VENUE_TOUR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_email_key" ON "super_admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sub_admins_email_key" ON "sub_admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_token_key" ON "admin_sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_refreshToken_key" ON "admin_sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "admin_sessions_adminId_adminType_idx" ON "admin_sessions"("adminId", "adminType");

-- CreateIndex
CREATE INDEX "admin_logs_adminId_adminType_idx" ON "admin_logs"("adminId", "adminType");

-- CreateIndex
CREATE INDEX "admin_logs_action_idx" ON "admin_logs"("action");

-- CreateIndex
CREATE INDEX "admin_logs_createdAt_idx" ON "admin_logs"("createdAt");

-- CreateIndex
CREATE INDEX "otps_email_idx" ON "otps"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "exhibitor_booths_eventId_exhibitorId_key" ON "exhibitor_booths"("eventId", "exhibitorId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_events_userId_eventId_key" ON "saved_events"("userId", "eventId");

-- CreateIndex
CREATE INDEX "venue_appointments_venueId_idx" ON "venue_appointments"("venueId");

-- CreateIndex
CREATE INDEX "venue_appointments_visitorId_idx" ON "venue_appointments"("visitorId");

-- CreateIndex
CREATE INDEX "venue_appointments_status_idx" ON "venue_appointments"("status");

-- AddForeignKey
ALTER TABLE "sub_admins" ADD CONSTRAINT "sub_admins_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "super_admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "super_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_subAdminId_fkey" FOREIGN KEY ("subAdminId") REFERENCES "sub_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "super_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_subAdminId_fkey" FOREIGN KEY ("subAdminId") REFERENCES "sub_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizerIdForExhibitor_fkey" FOREIGN KEY ("organizerIdForExhibitor") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizerIdForVenueManager_fkey" FOREIGN KEY ("organizerIdForVenueManager") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "super_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exhibition_spaces" ADD CONSTRAINT "exhibition_spaces_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exhibitor_booths" ADD CONSTRAINT "exhibitor_booths_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exhibitor_booths" ADD CONSTRAINT "exhibitor_booths_exhibitorId_fkey" FOREIGN KEY ("exhibitorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exhibitor_booths" ADD CONSTRAINT "exhibitor_booths_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "exhibition_spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaker_sessions" ADD CONSTRAINT "speaker_sessions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaker_sessions" ADD CONSTRAINT "speaker_sessions_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_exhibitorId_fkey" FOREIGN KEY ("exhibitorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_events" ADD CONSTRAINT "saved_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_events" ADD CONSTRAINT "saved_events_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_leads" ADD CONSTRAINT "event_leads_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_leads" ADD CONSTRAINT "event_leads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_analytics" ADD CONSTRAINT "event_analytics_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_appointments" ADD CONSTRAINT "venue_appointments_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_appointments" ADD CONSTRAINT "venue_appointments_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
