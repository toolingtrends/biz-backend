import prisma from "../../../config/prisma";

const exhibitorForList = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  company: true,
  phone: true,
} as const;

const organizerForList = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  organizationName: true,
} as const;

/** Admin: promotions created by exhibitors */
export async function listExhibitorPromotionsAdmin() {
  return prisma.promotion.findMany({
    where: { exhibitorId: { not: null } },
    include: {
      exhibitor: { select: exhibitorForList },
      event: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getExhibitorPromotionAdmin(id: string) {
  return prisma.promotion.findFirst({
    where: { id, exhibitorId: { not: null } },
    include: {
      exhibitor: { select: exhibitorForList },
      event: { select: { id: true, title: true, startDate: true, endDate: true } },
    },
  });
}

const EXHIBITOR_PATCH_STATUSES = ["APPROVED", "REJECTED", "ACTIVE", "COMPLETED", "EXPIRED"];

export async function patchExhibitorPromotionAdmin(
  id: string,
  body: { status?: string; rejectionReason?: string }
) {
  const { status, rejectionReason } = body;
  if (!status || !EXHIBITOR_PATCH_STATUSES.includes(status)) {
    throw new Error("INVALID_STATUS");
  }
  if (status === "REJECTED" && !(rejectionReason && String(rejectionReason).trim())) {
    throw new Error("REJECTION_REASON_REQUIRED");
  }

  const existing = await prisma.promotion.findFirst({
    where: { id, exhibitorId: { not: null } },
  });
  if (!existing) return null;

  return prisma.promotion.update({
    where: { id },
    data: { status },
    include: {
      exhibitor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          company: true,
        },
      },
      event: { select: { id: true, title: true } },
    },
  });
}

/** Admin: promotions created by organizers */
export async function listOrganizerPromotionsAdmin() {
  const promotions = await prisma.promotion.findMany({
    where: { organizerId: { not: null } },
    include: {
      organizer: { select: organizerForList },
      event: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return { promotions, total: promotions.length };
}

export async function getOrganizerPromotionAdmin(id: string) {
  return prisma.promotion.findFirst({
    where: { id, organizerId: { not: null } },
    include: {
      organizer: { select: organizerForList },
      event: { select: { id: true, title: true } },
    },
  });
}

const ORGANIZER_PATCH_STATUSES = ["PENDING", "APPROVED", "REJECTED", "ACTIVE", "EXPIRED"];

export async function patchOrganizerPromotionAdmin(
  id: string,
  body: { status?: string; rejectionReason?: string }
) {
  const { status, rejectionReason } = body;
  if (!status || !ORGANIZER_PATCH_STATUSES.includes(status)) {
    throw new Error("INVALID_STATUS");
  }
  if (status === "REJECTED" && !(rejectionReason && String(rejectionReason).trim())) {
    throw new Error("REJECTION_REASON_REQUIRED");
  }

  const existing = await prisma.promotion.findFirst({
    where: { id, organizerId: { not: null } },
  });
  if (!existing) return null;

  const updated = await prisma.promotion.update({
    where: { id },
    data: { status },
    include: {
      organizer: { select: organizerForList },
      exhibitor: { select: organizerForList },
      event: { select: { id: true, title: true } },
    },
  });

  return updated;
}
