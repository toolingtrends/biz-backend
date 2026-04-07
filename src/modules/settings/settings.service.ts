import { AccountDeactivationStatus } from "@prisma/client";
import prisma from "../../config/prisma";
import { sendVerificationEmail } from "../../services/email.service";

export interface DeactivationSummary {
  status: "NONE" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  requestId?: string;
  requestedAt?: string;
  reviewedAt?: string;
  deactivateEffectiveAt?: string;
  rejectReason?: string | null;
}

export interface UserSettingsResponse {
  profileVisibility: string;
  phoneNumber: string;
  email: string;
  introduceMe: boolean;
  emailNotifications: boolean;
  eventReminders: boolean;
  newMessages: boolean;
  connectionRequests: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: string;
  deactivation: DeactivationSummary;
}

function mapUserToSettings(
  u: {
    profileVisibility: string;
    phone: string | null;
    email: string | null;
    introduceMe: boolean;
    emailNotifications: boolean;
    eventReminders: boolean;
    newMessages: boolean;
    connectionRequests: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    role: string;
  },
  deactivation: DeactivationSummary
): UserSettingsResponse {
  return {
    profileVisibility: u.profileVisibility || "public",
    phoneNumber: u.phone ?? "",
    email: u.email ?? "",
    introduceMe: u.introduceMe,
    emailNotifications: u.emailNotifications,
    eventReminders: u.eventReminders,
    newMessages: u.newMessages,
    connectionRequests: u.connectionRequests,
    emailVerified: u.emailVerified,
    phoneVerified: u.phoneVerified,
    role: u.role,
    deactivation,
  };
}

export async function getDeactivationSummaryForUser(userId: string, userIsActive: boolean): Promise<DeactivationSummary> {
  const latest = await prisma.accountDeactivationRequest.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!latest || latest.status === AccountDeactivationStatus.CANCELLED) {
    return { status: "NONE" };
  }

  if (latest.status === AccountDeactivationStatus.PENDING) {
    return {
      status: "PENDING",
      requestId: latest.id,
      requestedAt: latest.requestedAt.toISOString(),
    };
  }

  if (latest.status === AccountDeactivationStatus.APPROVED) {
    const eff = latest.deactivateEffectiveAt;
    if (eff && eff.getTime() > Date.now()) {
      return {
        status: "APPROVED",
        requestId: latest.id,
        requestedAt: latest.requestedAt.toISOString(),
        reviewedAt: latest.reviewedAt?.toISOString(),
        deactivateEffectiveAt: eff.toISOString(),
      };
    }
    if (!userIsActive) {
      return {
        status: "COMPLETED",
        requestedAt: latest.requestedAt.toISOString(),
        reviewedAt: latest.reviewedAt?.toISOString(),
        deactivateEffectiveAt: eff?.toISOString(),
      };
    }
    return {
      status: "APPROVED",
      requestId: latest.id,
      requestedAt: latest.requestedAt.toISOString(),
      reviewedAt: latest.reviewedAt?.toISOString(),
      deactivateEffectiveAt: eff?.toISOString(),
    };
  }

  if (latest.status === AccountDeactivationStatus.REJECTED) {
    return {
      status: "REJECTED",
      requestId: latest.id,
      requestedAt: latest.requestedAt.toISOString(),
      reviewedAt: latest.reviewedAt?.toISOString() ?? undefined,
      rejectReason: latest.rejectReason,
    };
  }

  if (latest.status === AccountDeactivationStatus.COMPLETED) {
    return {
      status: "COMPLETED",
      requestedAt: latest.requestedAt.toISOString(),
      reviewedAt: latest.reviewedAt?.toISOString(),
    };
  }

  return { status: "NONE" };
}

export async function getSettingsForUser(userId: string): Promise<UserSettingsResponse | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      profileVisibility: true,
      phone: true,
      email: true,
      introduceMe: true,
      emailNotifications: true,
      eventReminders: true,
      newMessages: true,
      connectionRequests: true,
      emailVerified: true,
      phoneVerified: true,
      role: true,
      isActive: true,
    },
  });
  if (!user) return null;
  const { isActive, ...rest } = user;
  const deactivation = await getDeactivationSummaryForUser(userId, isActive);
  return mapUserToSettings(rest, deactivation);
}

export async function updateSettingsForUser(
  userId: string,
  body: Record<string, unknown>
): Promise<UserSettingsResponse | null> {
  const data: Record<string, unknown> = {};

  if (body.profileVisibility !== undefined) {
    const v = String(body.profileVisibility).toLowerCase();
    if (v === "public" || v === "private") {
      data.profileVisibility = v;
    }
  }
  if (body.phoneNumber !== undefined) {
    data.phone = String(body.phoneNumber).trim() || null;
  }
  if (body.email !== undefined) {
    const em = String(body.email).trim().toLowerCase();
    if (em) {
      const taken = await prisma.user.findFirst({
        where: { email: em, id: { not: userId } },
      });
      if (taken) {
        throw new Error("This email is already registered with another account");
      }
      data.email = em;
    }
  }
  if (body.introduceMe !== undefined) data.introduceMe = Boolean(body.introduceMe);
  if (body.emailNotifications !== undefined) data.emailNotifications = Boolean(body.emailNotifications);
  if (body.eventReminders !== undefined) data.eventReminders = Boolean(body.eventReminders);
  if (body.newMessages !== undefined) data.newMessages = Boolean(body.newMessages);
  if (body.connectionRequests !== undefined) data.connectionRequests = Boolean(body.connectionRequests);

  if (Object.keys(data).length === 0) {
    return getSettingsForUser(userId);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: data as any,
    select: {
      profileVisibility: true,
      phone: true,
      email: true,
      introduceMe: true,
      emailNotifications: true,
      eventReminders: true,
      newMessages: true,
      connectionRequests: true,
      emailVerified: true,
      phoneVerified: true,
      role: true,
      isActive: true,
    },
  });
  const { isActive, ...rest } = user;
  const deactivation = await getDeactivationSummaryForUser(userId, isActive);
  return mapUserToSettings(rest, deactivation);
}

export async function sendEmailChangeOtp(userId: string, rawEmail: string): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Please enter a valid email address");
  }

  const other = await prisma.user.findFirst({
    where: { email, id: { not: userId } },
  });
  if (other) {
    throw new Error("This email is already registered with another account");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.otp.deleteMany({ where: { userId } });
  await prisma.otp.create({
    data: {
      email,
      otp,
      expiresAt,
      userId,
    },
  });

  await sendVerificationEmail(email, otp);
}

export async function verifyEmailChangeOtp(
  userId: string,
  rawEmail: string,
  code: string
): Promise<UserSettingsResponse | null> {
  const email = rawEmail.trim().toLowerCase();
  if (!/^\d{6}$/.test(code)) {
    throw new Error("Verification code must be 6 digits");
  }

  const other = await prisma.user.findFirst({
    where: { email, id: { not: userId } },
  });
  if (other) {
    throw new Error("This email is already registered with another account");
  }

  const row = await prisma.otp.findFirst({
    where: { userId, email },
    orderBy: { createdAt: "desc" },
  });

  if (!row) {
    throw new Error("No verification code found. Please request a new one.");
  }
  if (row.expiresAt < new Date()) {
    throw new Error("Verification code expired. Please request a new one.");
  }
  if (row.otp !== code) {
    throw new Error("Invalid verification code");
  }

  await prisma.otp.deleteMany({ where: { userId, email } });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { email, emailVerified: true },
    select: {
      profileVisibility: true,
      phone: true,
      email: true,
      introduceMe: true,
      emailNotifications: true,
      eventReminders: true,
      newMessages: true,
      connectionRequests: true,
      emailVerified: true,
      phoneVerified: true,
      role: true,
      isActive: true,
    },
  });
  const { isActive, ...rest } = user;
  const deactivation = await getDeactivationSummaryForUser(userId, isActive);
  return mapUserToSettings(rest, deactivation);
}

/** User requests account closure — pending admin approval, then 30-day grace after approval. */
export async function requestAccountDeactivation(userId: string): Promise<{ requestId: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true },
  });
  if (!user?.isActive) {
    throw new Error("Account is already inactive");
  }

  const pending = await prisma.accountDeactivationRequest.findFirst({
    where: { userId, status: AccountDeactivationStatus.PENDING },
  });
  if (pending) {
    throw new Error("You already have a pending deactivation request");
  }

  const approvedGrace = await prisma.accountDeactivationRequest.findFirst({
    where: {
      userId,
      status: AccountDeactivationStatus.APPROVED,
      deactivateEffectiveAt: { gt: new Date() },
    },
  });
  if (approvedGrace) {
    throw new Error("A deactivation is already scheduled for your account");
  }

  const row = await prisma.accountDeactivationRequest.create({
    data: {
      userId,
      status: AccountDeactivationStatus.PENDING,
    },
  });
  return { requestId: row.id };
}

export async function cancelPendingDeactivationRequest(userId: string): Promise<void> {
  const pending = await prisma.accountDeactivationRequest.findFirst({
    where: { userId, status: AccountDeactivationStatus.PENDING },
  });
  if (!pending) {
    throw new Error("No pending deactivation request to cancel");
  }
  await prisma.accountDeactivationRequest.update({
    where: { id: pending.id },
    data: { status: AccountDeactivationStatus.CANCELLED },
  });
}
