import prisma from "../../config/prisma";
import { EventStatus } from "@prisma/client";

export async function listAdminEvents() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
  });
  return events;
}

interface UpdateAdminEventParams {
  id: string;
  statusLabel?: string;
  featured?: boolean;
  vip?: boolean;
  isVerified?: boolean;
  adminEmail?: string | null;
}

export async function updateAdminEvent(params: UpdateAdminEventParams) {
  const { id, statusLabel, featured, vip, isVerified, adminEmail } = params;

  const data: any = {};

  if (typeof featured === "boolean") {
    data.isFeatured = featured;
  }

  if (typeof vip === "boolean") {
    data.isVIP = vip;
  }

  if (typeof isVerified === "boolean") {
    data.isVerified = isVerified;
    if (isVerified) {
      data.verifiedAt = new Date();
      data.verifiedBy = adminEmail ?? "Admin";
      if (!data.verifiedBadgeImage) {
        data.verifiedBadgeImage = "/badge/VerifiedBADGE (1).png";
      }
    } else {
      data.verifiedAt = null;
      data.verifiedBy = null;
      data.verifiedBadgeImage = null;
    }
  }

  if (statusLabel) {
    let mapped: EventStatus;
    switch (statusLabel) {
      case "Approved":
        mapped = EventStatus.PUBLISHED;
        break;
      case "Pending Review":
        mapped = EventStatus.PENDING_APPROVAL;
        break;
      case "Rejected":
        mapped = EventStatus.REJECTED;
        break;
      case "Draft":
        mapped = EventStatus.DRAFT;
        break;
      case "Flagged":
        mapped = EventStatus.CANCELLED;
        break;
      default:
        mapped = EventStatus.DRAFT;
        break;
    }
    data.status = mapped;
  }

  const event = await prisma.event.update({
    where: { id },
    data,
  });

  return event;
}

export interface AdminListEventsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export async function adminListEvents(params: AdminListEventsParams) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (params.status) {
    where.status = params.status.toUpperCase();
  }
  const search = (params.search || "").trim();
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { rejectionReason: { contains: search, mode: "insensitive" } },
      {
        organizer: {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  const [rawEvents, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
            phone: true,
          },
        },
        venue: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            venueName: true,
            venueAddress: true,
            venueCity: true,
            venueState: true,
            venueCountry: true,
          },
        },
        ticketTypes: {
          select: { id: true, name: true, price: true, quantity: true },
        },
        exhibitionSpaces: {
          select: { id: true, name: true, spaceType: true, basePrice: true, area: true },
        },
        _count: { select: { leads: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  const events = rawEvents.map((event: any) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    shortDescription: event.shortDescription,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    registrationStart: event.registrationStart.toISOString(),
    registrationEnd: event.registrationEnd.toISOString(),
    timezone: event.timezone,
    venue:
      event.venue?.venueName ||
      (event.venue ? `${event.venue.firstName || ""} ${event.venue.lastName || ""}`.trim() || "Not specified" : "Not specified") ||
      "Not specified",
    city: event.venue?.venueCity ?? "Not specified",
    state: event.venue?.venueState ?? "",
    country: event.venue?.venueCountry ?? "",
    status: event.status,
    isVirtual: event.isVirtual,
    virtualLink: event.virtualLink,
    maxAttendees: event.maxAttendees,
    currentAttendees: event.currentAttendees,
    currency: event.currency,
    images: event.images ?? [],
    bannerImage: event.bannerImage,
    thumbnailImage: event.thumbnailImage,
    organizer: event.organizer
      ? {
          id: event.organizer.id,
          name: `${event.organizer.firstName || ""} ${event.organizer.lastName || ""}`.trim(),
          email: event.organizer.email,
          company: event.organizer.company ?? "",
          phone: event.organizer.phone ?? "",
        }
      : null,
    ticketTypes: event.ticketTypes ?? [],
    exhibitionSpaces: event.exhibitionSpaces ?? [],
    leadsCount: event._count?.leads ?? 0,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    rejectionReason: event.rejectionReason ?? undefined,
    rejectedAt: event.rejectedAt?.toISOString(),
    rejectedBy: event.rejectedBy ?? undefined,
    isFeatured: event.isFeatured ?? false,
    isVIP: event.isVIP ?? false,
    isPublic: event.isPublic ?? true,
  }));

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}

export async function adminGetEventStats() {
  const [total, approved, rejected, pending] = await Promise.all([
    prisma.event.count(),
    prisma.event.count({ where: { status: "PUBLISHED" } }),
    prisma.event.count({ where: { status: "REJECTED" } }),
    prisma.event.count({ where: { status: "PENDING_APPROVAL" } }),
  ]);
  return { total, approved, rejected, pending };
}

export async function adminGetEventById(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
        },
      },
      venue: {
        select: {
          id: true,
          venueName: true,
          venueCity: true,
          venueState: true,
          venueCountry: true,
        },
      },
      ticketTypes: true,
      exhibitionSpaces: true,
    },
  });

  return event;
}

export async function adminUpdateEvent(
  id: string,
  data: Record<string, unknown>
) {
  const existing = await prisma.event.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return { error: "NOT_FOUND" as const };
  }

  const allowedFields = [
    "title",
    "description",
    "shortDescription",
    "status",
    "category",
    "tags",
    "eventType",
    "startDate",
    "endDate",
    "registrationStart",
    "registrationEnd",
    "timezone",
    "isFeatured",
    "isVIP",
    "isPublic",
    "requiresApproval",
    "allowWaitlist",
    "refundPolicy",
    "metaTitle",
    "metaDescription",
    "isVerified",
    "verifiedBadgeImage",
  ];

  const raw: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      raw[key] = data[key];
    }
  }

  // Map frontend status labels to Prisma EventStatus enum (so "Approved" -> PUBLISHED, etc.)
  if (raw.status !== undefined && typeof raw.status === "string") {
    const statusMap: Record<string, EventStatus> = {
      Approved: EventStatus.PUBLISHED,
      "Pending Review": EventStatus.PENDING_APPROVAL,
      Draft: EventStatus.DRAFT,
      Rejected: EventStatus.REJECTED,
      Flagged: EventStatus.CANCELLED,
      PUBLISHED: EventStatus.PUBLISHED,
      PENDING_APPROVAL: EventStatus.PENDING_APPROVAL,
      DRAFT: EventStatus.DRAFT,
      REJECTED: EventStatus.REJECTED,
      CANCELLED: EventStatus.CANCELLED,
      COMPLETED: EventStatus.COMPLETED,
    };
    raw.status = statusMap[raw.status] ?? raw.status;
  }

  // Prisma expects category, tags, eventType as String[] — never pass string
  const toStrArray = (v: unknown): string[] => {
    if (Array.isArray(v)) {
      return v.filter((x) => typeof x === "string" && String(x).trim() && String(x).trim() !== "—").map((x) => String(x).trim());
    }
    if (typeof v === "string") {
      const s = v.trim();
      if (!s || s === "—" || s === "–" || s === "−") return [];
      return [s];
    }
    return [];
  };

  const updateData: Record<string, unknown> = { ...raw };
  if (raw.category !== undefined) updateData.category = toStrArray(raw.category);
  if (raw.tags !== undefined) updateData.tags = toStrArray(raw.tags);
  if (raw.eventType !== undefined) updateData.eventType = toStrArray(raw.eventType);

  // Prisma DateTime fields — ensure strings are converted to Date
  const dateFields = ["startDate", "endDate", "registrationStart", "registrationEnd", "verifiedAt"];
  for (const key of dateFields) {
    if (updateData[key] !== undefined && updateData[key] !== null) {
      const v = updateData[key];
      updateData[key] = v instanceof Date ? v : new Date(v as string);
    }
  }

  // When setting isVerified true, set verifiedAt/verifiedBy server-side if not provided
  if (updateData.isVerified === true) {
    if (updateData.verifiedAt === undefined) updateData.verifiedAt = new Date();
    const adminId = (data as any).verifiedBy;
    if (adminId) updateData.verifiedBy = adminId;
  }
  if (updateData.isVerified === false) {
    updateData.verifiedAt = null;
    updateData.verifiedBy = null;
    updateData.verifiedBadgeImage = null;
  }

  const event = await prisma.event.update({
    where: { id },
    data: updateData as any,
  });

  return { event };
}

export async function adminDeleteEvent(id: string) {
  const existing = await prisma.event.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return { error: "NOT_FOUND" as const };
  }

  await prisma.event.delete({
    where: { id },
  });

  return { deleted: true as const };
}

export async function adminApproveEvent(eventId: string, adminId: string) {
  const existing = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });

  if (!existing) {
    return { error: "NOT_FOUND" as const };
  }

  const now = new Date();

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      status: "PUBLISHED",
      rejectionReason: null,
      rejectedAt: null,
      rejectedById: null,
      isVerified: true,
      verifiedAt: now,
      verifiedBy: adminId,
    },
  });

  return { event };
}

export async function adminRejectEvent(
  eventId: string,
  adminId: string,
  reason?: string
) {
  const existing = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });

  if (!existing) {
    return { error: "NOT_FOUND" as const };
  }

  const now = new Date();

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      status: "REJECTED",
      rejectionReason: reason ?? "Rejected by admin",
      rejectedAt: now,
      rejectedById: adminId,
      isVerified: false,
      verifiedAt: null,
      verifiedBy: null,
    },
  });

  return { event };
}

export async function adminListVenues() {
  const venues = await prisma.user.findMany({
    where: { role: "VENUE_MANAGER" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      venueName: true,
      venueCity: true,
      venueState: true,
      venueCountry: true,
      venueAddress: true,
      maxCapacity: true,
      totalHalls: true,
      averageRating: true,
      totalReviews: true,
      activeBookings: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return venues;
}

export async function adminListVisitors() {
  const registrations = await prisma.eventRegistration.findMany({
    where: {
      status: "CONFIRMED",
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
        },
      },
    },
    orderBy: { registeredAt: "desc" },
    take: 200,
  });

  return registrations;
}

export async function adminGetDashboardSummary() {
  const [
    totalEvents,
    publishedEvents,
    organizers,
    exhibitors,
    venues,
    attendees,
    recentEvents,
    recentRegistrations,
  ] = await Promise.all([
    prisma.event.count(),
    prisma.event.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count({ where: { role: "ORGANIZER" } }),
    prisma.user.count({ where: { role: "EXHIBITOR" } }),
    prisma.user.count({ where: { role: "VENUE_MANAGER" } }),
    prisma.user.count({ where: { role: "ATTENDEE" } }),
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        startDate: true,
        createdAt: true,
      },
    }),
    prisma.eventRegistration.findMany({
      where: { status: "CONFIRMED" },
      orderBy: { registeredAt: "desc" },
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
          },
        },
      },
    }),
  ]);

  return {
    totals: {
      totalEvents,
      publishedEvents,
      organizers,
      exhibitors,
      venues,
      attendees,
    },
    recentEvents,
    recentRegistrations,
  };
}

export async function adminListEventCategories(): Promise<{ id: string; name: string; eventCount: number; isActive: boolean }[]> {
  const events = await prisma.event.findMany({
    select: { category: true },
  });
  const countByCategory: Record<string, number> = {};
  for (const e of events) {
    const cats = Array.isArray(e.category) ? e.category : [];
    for (const c of cats) {
      const name = String(c || "").trim();
      if (!name) continue;
      countByCategory[name] = (countByCategory[name] ?? 0) + 1;
    }
  }
  return Object.entries(countByCategory).map(([name]) => ({
    id: name,
    name,
    eventCount: countByCategory[name],
    isActive: true,
  }));
}

