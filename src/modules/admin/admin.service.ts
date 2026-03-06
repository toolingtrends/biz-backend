import prisma from "../../config/prisma";

export interface AdminListEventsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export async function adminListEvents(params: AdminListEventsParams) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (params.status) {
    where.status = params.status.toUpperCase();
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

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
  ];

  const updateData: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      updateData[key] = data[key];
    }
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

