import prisma from "../../../config/prisma";
import { AccountDeactivationStatus } from "@prisma/client";

const GRACE_MS = 30 * 24 * 60 * 60 * 1000;

/** Apply approved deactivations whose effective date has passed. */
export async function processDueAccountDeactivations(): Promise<number> {
  const now = new Date();
  const due = await prisma.accountDeactivationRequest.findMany({
    where: {
      status: AccountDeactivationStatus.APPROVED,
      deactivateEffectiveAt: { lte: now },
    },
    select: { id: true, userId: true },
  });

  let n = 0;
  for (const row of due) {
    try {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: row.userId },
          data: { isActive: false },
        }),
        prisma.accountDeactivationRequest.update({
          where: { id: row.id },
          data: { status: AccountDeactivationStatus.COMPLETED },
        }),
      ]);
      n += 1;
    } catch {
      // eslint-disable-next-line no-console
      console.error("[deactivation] Failed to complete request", row.id);
    }
  }
  return n;
}

export async function listPendingDeactivationRequests() {
  return prisma.accountDeactivationRequest.findMany({
    where: { status: AccountDeactivationStatus.PENDING },
    orderBy: { requestedAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function listAllDeactivationRequestsForAdmin(status?: string) {
  const where =
    status && Object.values(AccountDeactivationStatus).includes(status as AccountDeactivationStatus)
      ? { status: status as AccountDeactivationStatus }
      : {};
  return prisma.accountDeactivationRequest.findMany({
    where,
    orderBy: { requestedAt: "desc" },
    take: 200,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      },
    },
  });
}

export async function approveDeactivationRequest(
  requestId: string,
  adminId: string,
  adminType: string
): Promise<{ effectiveAt: Date }> {
  const row = await prisma.accountDeactivationRequest.findUnique({
    where: { id: requestId },
  });
  if (!row) {
    throw new Error("Request not found");
  }
  if (row.status !== AccountDeactivationStatus.PENDING) {
    throw new Error("Request is not pending");
  }

  const reviewedAt = new Date();
  const deactivateEffectiveAt = new Date(reviewedAt.getTime() + GRACE_MS);

  await prisma.accountDeactivationRequest.update({
    where: { id: requestId },
    data: {
      status: AccountDeactivationStatus.APPROVED,
      reviewedAt,
      reviewedByAdminId: adminId,
      reviewedByAdminType: adminType,
      deactivateEffectiveAt,
    },
  });

  return { effectiveAt: deactivateEffectiveAt };
}

export async function rejectDeactivationRequest(
  requestId: string,
  adminId: string,
  adminType: string,
  rejectReason?: string
): Promise<void> {
  const row = await prisma.accountDeactivationRequest.findUnique({
    where: { id: requestId },
  });
  if (!row) {
    throw new Error("Request not found");
  }
  if (row.status !== AccountDeactivationStatus.PENDING) {
    throw new Error("Request is not pending");
  }

  await prisma.accountDeactivationRequest.update({
    where: { id: requestId },
    data: {
      status: AccountDeactivationStatus.REJECTED,
      reviewedAt: new Date(),
      reviewedByAdminId: adminId,
      reviewedByAdminType: adminType,
      rejectReason: rejectReason?.trim() || null,
    },
  });
}
