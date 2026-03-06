import prisma from "../../config/prisma";

export interface ListVenuesParams {
  search?: string;
  page?: number;
  limit?: number;
}

export async function listVenues(params: ListVenuesParams) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const skip = (page - 1) * limit;

  const where: any = { role: "VENUE_MANAGER" };

  const search = params.search?.trim() ?? "";
  if (search) {
    where.OR = [
      { venueName: { contains: search, mode: "insensitive" } },
      { venueDescription: { contains: search, mode: "insensitive" } },
      { venueAddress: { contains: search, mode: "insensitive" } },
    ];
  }

  const [venues, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        organizerIdForVenueManager: true,
        venueName: true,
        venueDescription: true,
        venueAddress: true,
        venueCity: true,
        venueState: true,
        venueCountry: true,
        venueZipCode: true,
        maxCapacity: true,
        totalHalls: true,
        averageRating: true,
        totalReviews: true,
        amenities: true,
        venueCurrency: true,
        createdAt: true,
        updatedAt: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    venues,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getVenueEvents(id: string) {
  if (!id) {
    throw new Error("Invalid venue ID");
  }

  const events = await prisma.event.findMany({
    where: { venueId: id },
    include: {
      organizer: {
        select: {
          firstName: true,
          lastName: true,
          company: true,
          avatar: true,
        },
      },
    },
    orderBy: { startDate: "asc" },
  });

  const transformedEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    shortDescription: event.shortDescription,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    status: event.status,
    category: event.category,
    images: event.images,
    bannerImage: event.bannerImage,
    venueId: event.venueId,
    organizerId: event.organizerId,
    maxAttendees: event.maxAttendees,
    currentAttendees: event.currentAttendees,
    currency: event.currency,
    isVirtual: event.isVirtual,
    virtualLink: event.virtualLink,
    averageRating: event.averageRating,
    eventType: event.eventType,
    totalReviews: event.totalReviews,
    ticketTypes: true,
    organizer: event.organizer
      ? {
          name: `${event.organizer.firstName} ${event.organizer.lastName}`,
          organization: event.organizer.company || "Unknown Organization",
          avatar: event.organizer.avatar,
        }
      : undefined,
  }));

  return {
    success: true,
    events: transformedEvents,
  };
}

