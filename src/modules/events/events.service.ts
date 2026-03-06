import prisma from "../../config/prisma";

const statusMap: Record<string, string> = {
  PUBLISHED: "Approved",
  PENDING_APPROVAL: "Pending Review",
  DRAFT: "Draft",
  CANCELLED: "Flagged",
  REJECTED: "Rejected",
  COMPLETED: "Approved",
};

export interface ListEventsParams {
  page?: number;
  limit?: number;
  category?: string | null;
  search?: string;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  featured?: boolean;
  sort?: string;
  verified?: boolean;
  vip?: boolean;
}

export async function listEvents(params: ListEventsParams) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 12;
  const skip = (page - 1) * limit;

  const where: any = {
    status: "PUBLISHED",
    isPublic: true,
  };

  if (params.category) {
    where.category = { has: params.category };
  }

  const search = params.search?.trim() ?? "";
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { shortDescription: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ];
  }

  if (params.location) {
    const location = params.location.trim();
    if (location) {
      where.venue = {
        OR: [
          { venueCity: { contains: location, mode: "insensitive" } },
          { venueState: { contains: location, mode: "insensitive" } },
          { venueCountry: { contains: location, mode: "insensitive" } },
        ],
      };
    }
  }

  if (params.startDate) {
    where.startDate = { gte: new Date(params.startDate) };
  }

  if (params.endDate) {
    where.endDate = { lte: new Date(params.endDate) };
  }

  if (params.featured) {
    where.isFeatured = true;
  }

  if (params.verified) {
    where.isVerified = true;
  }

  if (params.vip) {
    where.isVIP = true;
  }

  let orderBy: any = {};
  switch (params.sort) {
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "soonest":
      orderBy = { startDate: "asc" };
      break;
    case "popular":
      orderBy = { currentAttendees: "desc" };
      break;
    case "featured":
      orderBy = [{ isFeatured: "desc" }, { createdAt: "desc" }];
      break;
    case "verified":
      orderBy = [{ isVerified: "desc" }, { createdAt: "desc" }];
      break;
    case "newest":
    default:
      orderBy = { createdAt: "desc" };
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
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
            venueAddress: true,
          },
        },
        ticketTypes: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            price: true,
            quantity: true,
          },
          orderBy: { price: "asc" as const },
          take: 1,
        },
        _count: {
          select: {
            registrations: {
              where: { status: "CONFIRMED" },
            },
            reviews: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  const transformedEvents = events.map((event: any) => {
    const avgRating =
      event.reviews.length > 0
        ? event.reviews.reduce(
            (sum: number, review: { rating: number | null }) => sum + (review.rating ?? 0),
            0,
          ) / event.reviews.length
        : 0;

    const cheapestTicket = event.ticketTypes[0]?.price || 0;

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      shortDescription: event.shortDescription,
      slug: event.slug,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      timezone: event.timezone,
      location: event.venue?.venueName || "Virtual Event",
      city: event.venue?.venueCity || "",
      state: event.venue?.venueState || "",
      country: event.venue?.venueCountry || "",
      address: event.venue?.venueAddress || "",
      isVirtual: event.isVirtual,
      virtualLink: event.virtualLink,
      status: statusMap[event.status] || "Pending Review",
      category: event.category || [],
      tags: event.tags || [],
      eventType: event.eventType || [],
      isFeatured: event.isFeatured,
      isVIP: event.isVIP,
      isVerified: event.isVerified || false,
      verifiedAt: event.verifiedAt?.toISOString() ?? null,
      verifiedBy: event.verifiedBy || "",
      attendees: event._count.registrations,
      totalReviews: event._count.reviews,
      averageRating: avgRating,
      cheapestTicket,
      currency: event.currency,
      images: event.images,
      bannerImage: event.bannerImage,
      thumbnailImage: event.thumbnailImage,
      organizer: {
        id: event.organizer.id,
        name: `${event.organizer.firstName} ${event.organizer.lastName}`.trim(),
        email: event.organizer.email,
        avatar: event.organizer.avatar,
      },
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  });

  return {
    events: transformedEvents,
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

// Featured events
export async function getFeaturedEvents() {
  return prisma.event.findMany({
    where: { isFeatured: true },
    select: {
      id: true,
      title: true,
      startDate: true,
      bannerImage: true,
      images: true,
      category: true,
    },
    orderBy: { startDate: "asc" as const },
  });
}

// Event detail helpers (PostgreSQL: id is uuid; lookup by id or slug/title)
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export async function getEventByIdentifier(id: string) {
  if (!id) {
    throw new Error("Invalid event identifier");
  }

  const include = {
    organizer: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        organizationName: true,
        company: true,
        description: true,
        phone: true,
        totalEvents: true,
        averageRating: true,
        totalReviews: true,
        createdAt: true,
      },
    },
    venue: true,
    leads: true,
    ticketTypes: {
      where: { isActive: true },
      orderBy: { price: "asc" as const },
    },
    speakerSessions: {
      include: {
        speaker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
            company: true,
            jobTitle: true,
          },
        },
      },
      orderBy: { startTime: "asc" as const },
    },
    exhibitionSpaces: { where: { isAvailable: true } },
    _count: { select: { registrations: true, reviews: true } },
  };

  let event: any = await prisma.event.findUnique({
    where: { id },
    include,
  });

  if (!event) {
    event = await prisma.event.findFirst({
      where: {
        OR: [
          { slug: id },
          {
            title: {
              equals: id.replace(/-/g, " "),
              mode: "insensitive",
            },
          },
        ],
      },
      include,
    });
  }

  if (!event) {
    event = await prisma.event.findFirst({
      where: {
        title: {
          contains: id.replace(/-/g, " "),
          mode: "insensitive",
        },
      },
      include,
    });
  }

  if (!event) {
    return null;
  }

  const availableTickets =
    event.ticketTypes?.reduce(
      (total: number, ticket: { quantity: number; sold: number }) => total + (ticket.quantity - ticket.sold),
      0,
    ) ?? 0;

  const slug = event.slug || generateSlug(event.title);

  const data = {
    ...event,
    title: event.title || "Untitled Event",
    description: event.description || event.shortDescription || "",
    availableTickets,
    isAvailable: availableTickets > 0 && new Date() < event.registrationEnd,
    registrationCount: event._count?.registrations ?? 0,
    reviewCount: event._count?.reviews ?? 0,
    layoutPlan: event.layoutPlan,
    slug,
    metadata: {
      title: event.title,
      description: event.description || event.shortDescription,
      image: event.bannerImage || event.images?.[0] || null,
      tags: event.tags || [],
      category: event.category || "General",
    },
  };

  return data;
}

// Events stats (categories only, matching ?stats=true behavior)
const ALL_CATEGORIES = [
  "Education & Training",
  "Medical & Pharma",
  "IT & Technology",
  "Banking & Finance",
  "Business Services",
  "Industrial Engineering",
  "Building & Construction",
  "Power & Energy",
  "Entertainment & Media",
  "Wellness, Health & Fitness",
  "Science & Research",
  "Environment & Waste",
  "Agriculture & Forestry",
  "Food & Beverages",
  "Logistics & Transportation",
  "Electric & Electronics",
  "Arts & Crafts",
  "Auto & Automotive",
  "Home & Office",
  "Security & Defense",
  "Fashion & Beauty",
  "Travel & Tourism",
  "Telecommunication",
  "Apparel & Clothing",
  "Animals & Pets",
  "Baby, Kids & Maternity",
  "Hospitality",
  "Packing & Packaging",
  "Miscellaneous",
];

export async function getCategoryStats() {
  const categoryCounts = await Promise.all(
    ALL_CATEGORIES.map(async (category) => {
      const count = await prisma.event.count({
        where: {
          status: "PUBLISHED",
          isPublic: true,
          category: {
            has: category,
          },
        },
      });
      return { category, count };
    }),
  );

  const filteredCounts = categoryCounts.filter((item) => item.count > 0);

  return {
    categories: filteredCounts,
    totalCategories: filteredCounts.length,
  };
}

// Extended stats (cities/countries/categories) – mirrors app/api/events/stats
const CITIES_LIST = [
  "London",
  "Dubai",
  "Berlin",
  "Amsterdam",
  "Paris",
  "Washington DC",
  "New York",
  "Barcelona",
  "Kuala Lumpur",
  "Orlando",
  "Chicago",
  "Munich",
];

const COUNTRIES_LIST = [
  "USA",
  "Germany",
  "UK",
  "Canada",
  "UAE",
  "India",
  "Australia",
  "China",
  "Spain",
  "Italy",
  "France",
  "Japan",
];

export interface EventStatsOptions {
  includeCategories?: boolean;
  includeCities?: boolean;
  includeCountries?: boolean;
}

export async function getEventStats(options: EventStatsOptions) {
  const includeCategories = options.includeCategories ?? true;
  const includeCities = options.includeCities ?? false;
  const includeCountries = options.includeCountries ?? false;

  const result: any = {
    success: true,
  };

  if (includeCategories) {
    const { categories, totalCategories } = await getCategoryStats();
    result.categories = categories.sort((a: any, b: any) => b.count - a.count);
    result.totalCategories = totalCategories;
  }

  if (includeCities) {
    const cityCounts = await Promise.all(
      CITIES_LIST.map(async (city) => {
        const count = await prisma.event.count({
          where: {
            status: "PUBLISHED",
            isPublic: true,
            venue: {
              venueCity: {
                contains: city,
                mode: "insensitive",
              },
            },
          },
        });
        return { city, count };
      }),
    );

    const filteredCities = cityCounts.filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
    result.cities = filteredCities;
    result.totalCities = filteredCities.length;
  }

  if (includeCountries) {
    const countryCounts = await Promise.all(
      COUNTRIES_LIST.map(async (country) => {
        const count = await prisma.event.count({
          where: {
            status: "PUBLISHED",
            isPublic: true,
            venue: {
              venueCountry: {
                contains: country,
                mode: "insensitive",
              },
            },
          },
        });
        return { country, count };
      }),
    );

    const filteredCountries = countryCounts.filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
    result.countries = filteredCountries;
    result.totalCountries = filteredCountries.length;
  }

  return result;
}

// Search service – mirrors app/api/search/route.ts
export async function searchEntities(query: string, limit = 5) {
  const trimmed = query.trim();

  if (!trimmed || trimmed.length < 2) {
    return {
      events: [],
      venues: [],
      speakers: [],
      allResults: [],
    };
  }

  const [events, venues, speakers] = await Promise.all([
    prisma.event.findMany({
      where: {
        isPublic: true,
        title: { contains: trimmed, mode: "insensitive" },
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        isVIP: true,
        isFeatured: true,
        venue: {
          select: {
            venueCity: true,
            venueCountry: true,
          },
        },
      },
      orderBy: { startDate: "asc" as const },
      take: limit,
    }),

    prisma.user.findMany({
      where: {
        role: "VENUE_MANAGER",
        isActive: true,
        venueName: { contains: trimmed, mode: "insensitive" },
      },
      select: {
        id: true,
        venueName: true,
        venueCity: true,
        venueCountry: true,
      },
      take: limit,
    }),

    prisma.user.findMany({
      where: {
        role: "SPEAKER",
        isActive: true,
        OR: [
          { firstName: { contains: trimmed, mode: "insensitive" } },
          { lastName: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
      take: limit,
    }),
  ]);

  const eventResults = events.map((event: any) => ({
    id: event.id,
    title: event.title,
    startDate: event.startDate,
    isVIP: event.isVIP,
    isFeatured: event.isFeatured,
    venue: event.venue,
    type: "event" as const,
  }));

  const venueResults = venues.map((venue: any) => ({
    id: venue.id,
    venueName: venue.venueName,
    location: [venue.venueCity, venue.venueCountry].filter(Boolean).join(", "),
    type: "venue" as const,
  }));

  const speakerResults = speakers.map((speaker: any) => ({
    id: speaker.id,
    displayName: `${speaker.firstName} ${speaker.lastName}`,
    type: "speaker" as const,
  }));

  const allResults = [
    ...eventResults.map((e: any) => ({ ...e, resultType: "event" as const })),
    ...venueResults.map((v: any) => ({ ...v, resultType: "venue" as const })),
    ...speakerResults.map((s: any) => ({ ...s, resultType: "speaker" as const })),
  ];

  return {
    events: eventResults,
    venues: venueResults,
    speakers: speakerResults,
    allResults,
  };
}

// Simple helpers for additional event endpoints

export async function listRecentEvents(limit = 10) {
  const result = await listEvents({
    page: 1,
    limit,
    sort: "newest",
  });
  return result.events;
}

export async function listVipEvents(limit = 10) {
  const result = await listEvents({
    page: 1,
    limit,
    sort: "newest",
    vip: true,
  });
  return result.events;
}

// ----- Event sub-resources (leads, exhibitors, speakers, brochure, layout, space-costs) -----

export async function listEventLeads(eventId: string) {
  const leads = await prisma.eventLead.findMany({
    where: { eventId },
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
    orderBy: { createdAt: "desc" },
  });

  return leads;
}

export async function listEventExhibitors(eventId: string) {
  const booths = await prisma.exhibitorBooth.findMany({
    where: { eventId },
    include: {
      exhibitor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
          company: true,
          jobTitle: true,
        },
      },
      space: {
        select: {
          id: true,
          name: true,
          spaceType: true,
          area: true,
          basePrice: true,
          pricePerSqm: true,
          currency: true,
          isAvailable: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return booths;
}

export async function listEventSpeakers(eventId: string) {
  const sessions = await prisma.speakerSession.findMany({
    where: { eventId },
    include: {
      speaker: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          company: true,
          jobTitle: true,
        },
      },
    },
    orderBy: { startTime: "asc" as const },
  });

  return sessions;
}

export async function getEventBrochureAndDocuments(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      brochure: true,
      documents: true,
    },
  });

  return event;
}

export async function updateEventLayoutPlan(eventId: string, layoutPlan: string | null) {
  const existing = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      layoutPlan,
    },
    select: {
      id: true,
      layoutPlan: true,
    },
  });

  return updated;
}

export async function listEventSpaceCosts(eventId: string) {
  const spaces = await prisma.exhibitionSpace.findMany({
    where: {
      eventId,
      isAvailable: true,
    },
    select: {
      id: true,
      name: true,
      spaceType: true,
      description: true,
      area: true,
      basePrice: true,
      pricePerSqm: true,
      currency: true,
      additionalPowerRate: true,
      compressedAirRate: true,
      unit: true,
      pricePerUnit: true,
      isFixed: true,
      maxBooths: true,
    },
    orderBy: { basePrice: "asc" as const },
  });

  return spaces;
}

// ----- Write operations: save, promotions, create, update, delete -----

export async function saveEvent(userId: string, eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { error: "NOT_FOUND" as const };

  const existing = await prisma.savedEvent.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
  if (existing) return { alreadySaved: true as const, savedEvent: existing };

  const savedEvent = await prisma.savedEvent.create({
    data: { userId, eventId },
    include: { event: true },
  });
  return { savedEvent };
}

export async function unsaveEvent(userId: string, eventId: string) {
  await prisma.savedEvent.deleteMany({
    where: { userId, eventId },
  });
  return { removed: true };
}

export async function isEventSaved(userId: string, eventId: string): Promise<boolean> {
  const saved = await prisma.savedEvent.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
  return !!saved;
}

export async function getEventPromotions(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      startDate: true,
      status: true,
      category: true,
      organizerId: true,
    },
  });
  if (!event) return null;

  const promotions = await prisma.promotion.findMany({
    where: { eventId },
    include: {
      event: {
        select: { id: true, title: true, startDate: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    event: {
      ...event,
      date: event.startDate.toISOString().split("T")[0],
    },
    promotions,
  };
}

export async function createPromotion(
  eventId: string,
  body: { packageType: string; targetCategories: string[]; amount: number; duration: number }
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, organizerId: true },
  });
  if (!event) return { error: "NOT_FOUND" as const };

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + body.duration);

  const promotion = await prisma.promotion.create({
    data: {
      eventId,
      organizerId: event.organizerId,
      packageType: body.packageType,
      targetCategories: body.targetCategories ?? [],
      amount: body.amount,
      duration: body.duration,
      startDate,
      endDate,
      status: "ACTIVE",
    },
    include: {
      event: {
        select: { id: true, title: true, startDate: true, status: true },
      },
    },
  });
  return { promotion };
}

// ----- Organizer event update / delete -----

export async function updateEventByOrganizer(
  organizerId: string,
  eventId: string,
  body: Record<string, unknown>
) {
  const existingEvent = await prisma.event.findFirst({
    where: { id: eventId, organizerId },
    include: { ticketTypes: true, exhibitionSpaces: true },
  });
  if (!existingEvent) return { error: "NOT_FOUND" as const };

  const eventUpdateData: Record<string, unknown> = {
    title: body.title,
    description: body.description,
    shortDescription: body.shortDescription ?? null,
    slug:
      (body.slug as string) ??
      (body.title as string)?.toString().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    status: (body.status as string)?.toUpperCase() ?? existingEvent.status,
    category: (body.category as string[]) || (body.eventType as string[]) || existingEvent.category,
    tags: (body.tags as string[]) || (body.categories as string[]) || existingEvent.tags,
    startDate: body.startDate ? new Date(body.startDate as string) : existingEvent.startDate,
    endDate: body.endDate ? new Date(body.endDate as string) : existingEvent.endDate,
    registrationStart: body.registrationStart
      ? new Date(body.registrationStart as string)
      : existingEvent.registrationStart,
    registrationEnd: body.registrationEnd
      ? new Date(body.registrationEnd as string)
      : existingEvent.registrationEnd,
    timezone: (body.timezone as string) ?? existingEvent.timezone,
    isVirtual: body.isVirtual ?? existingEvent.isVirtual,
    virtualLink: (body.virtualLink as string) || null,
    venueId: body.venue && typeof body.venue === "string" ? body.venue : existingEvent.venueId,
    maxAttendees: body.maxAttendees ?? body.capacity ?? existingEvent.maxAttendees,
    currency: (body.currency as string) ?? existingEvent.currency,
    bannerImage: (body.bannerImage as string) || (body.images as { url?: string }[])?.[0]?.url || null,
    thumbnailImage: (body.thumbnailImage as string) || null,
    isPublic: body.isPublic !== false,
    requiresApproval: !!body.requiresApproval,
    allowWaitlist: !!body.allowWaitlist,
    refundPolicy: (body.refundPolicy as string) || null,
    metaTitle: (body.metaTitle as string) || null,
    metaDescription: (body.metaDescription as string) || null,
    isFeatured: !!(body.featured ?? body.isFeatured),
    isVIP: !!(body.vip ?? body.isVIP),
  };

  const ticketTypesToCreate: Array<{ name: string; description: string; price: number; quantity: number; isActive: boolean }> = [];
  if (body.generalPrice || (body.pricing as { general?: number })?.general) {
    ticketTypesToCreate.push({
      name: "General Admission",
      description: "General admission ticket",
      price: Number(body.generalPrice ?? (body.pricing as { general?: number })?.general ?? 0),
      quantity: Number(body.maxAttendees ?? body.capacity ?? 100),
      isActive: true,
    });
  }
  if (body.vipPrice) {
    ticketTypesToCreate.push({
      name: "VIP",
      description: "VIP ticket with premium access",
      price: Number(body.vipPrice),
      quantity: Math.floor((Number(body.maxAttendees ?? body.capacity ?? 100)) * 0.1),
      isActive: true,
    });
  }
  if (body.premiumPrice) {
    ticketTypesToCreate.push({
      name: "Premium",
      description: "Premium ticket with enhanced experience",
      price: Number(body.premiumPrice),
      quantity: Math.floor((Number(body.maxAttendees ?? body.capacity ?? 100)) * 0.2),
      isActive: true,
    });
  }

  if (ticketTypesToCreate.length > 0) {
    await prisma.ticketType.deleteMany({ where: { eventId } });
    (eventUpdateData as any).ticketTypes = { create: ticketTypesToCreate };
  }

  if (Array.isArray(body.exhibitionSpaces) && body.exhibitionSpaces.length > 0) {
    await prisma.exhibitionSpace.deleteMany({ where: { eventId } });
    (eventUpdateData as any).exhibitionSpaces = {
      create: (body.exhibitionSpaces as any[]).map((space: any) => ({
        spaceType: space.spaceType || "CUSTOM",
        name: space.name,
        description: space.description ?? "",
        basePrice: space.basePrice ?? 0,
        pricePerSqm: space.pricePerSqm ?? 0,
        minArea: space.minArea ?? 0,
        isFixed: space.isFixed ?? false,
        additionalPowerRate: space.additionalPowerRate ?? 0,
        compressedAirRate: space.compressedAirRate ?? 0,
        unit: space.unit ?? null,
        area: space.area ?? 0,
        isAvailable: space.isAvailable !== false,
        maxBooths: space.maxBooths ?? null,
      })),
    };
  }

  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: eventUpdateData as any,
    include: {
      exhibitionSpaces: true,
      ticketTypes: true,
      venue: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          venueCity: true,
          venueState: true,
          venueCountry: true,
        },
      },
    },
  });

  return { event: updatedEvent };
}

export async function deleteEventByOrganizer(organizerId: string, eventId: string) {
  const existingEvent = await prisma.event.findFirst({
    where: { id: eventId, organizerId },
  });
  if (!existingEvent) return { error: "NOT_FOUND" as const };

  await prisma.ticketType.deleteMany({ where: { eventId } });
  await prisma.exhibitionSpace.deleteMany({ where: { eventId } });
  await prisma.event.delete({ where: { id: eventId } });
  await prisma.user.update({
    where: { id: organizerId },
    data: { totalEvents: { decrement: 1 } },
  });
  return { deleted: true };
}

