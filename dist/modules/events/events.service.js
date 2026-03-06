"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEvents = listEvents;
exports.getFeaturedEvents = getFeaturedEvents;
exports.getEventByIdentifier = getEventByIdentifier;
exports.getCategoryStats = getCategoryStats;
exports.getEventStats = getEventStats;
exports.searchEntities = searchEntities;
exports.saveEvent = saveEvent;
exports.unsaveEvent = unsaveEvent;
exports.isEventSaved = isEventSaved;
exports.getEventPromotions = getEventPromotions;
exports.createPromotion = createPromotion;
exports.updateEventByOrganizer = updateEventByOrganizer;
exports.deleteEventByOrganizer = deleteEventByOrganizer;
const prisma_1 = __importDefault(require("../../config/prisma"));
const statusMap = {
    PUBLISHED: "Approved",
    PENDING_APPROVAL: "Pending Review",
    DRAFT: "Draft",
    CANCELLED: "Flagged",
    REJECTED: "Rejected",
    COMPLETED: "Approved",
};
async function listEvents(params) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 12;
    const skip = (page - 1) * limit;
    const where = {
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
    let orderBy = {};
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
        prisma_1.default.event.findMany({
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
                    orderBy: { price: "asc" },
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
        prisma_1.default.event.count({ where }),
    ]);
    const transformedEvents = events.map((event) => {
        const avgRating = event.reviews.length > 0
            ? event.reviews.reduce((sum, review) => sum + review.rating, 0) / event.reviews.length
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
async function getFeaturedEvents() {
    return prisma_1.default.event.findMany({
        where: { isFeatured: true },
        select: {
            id: true,
            title: true,
            startDate: true,
            bannerImage: true,
            images: true,
            category: true,
        },
        orderBy: { startDate: "asc" },
    });
}
// Event detail helpers
function isObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
}
function generateSlug(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
}
async function getEventByIdentifier(id) {
    if (!id) {
        throw new Error("Invalid event identifier");
    }
    let event = null;
    if (isObjectId(id)) {
        event = await prisma_1.default.event.findUnique({
            where: { id },
            include: {
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
                    orderBy: { price: "asc" },
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
                    orderBy: { startTime: "asc" },
                },
                exhibitionSpaces: { where: { isAvailable: true } },
                _count: { select: { registrations: true, reviews: true } },
            },
        });
    }
    else {
        // Try by slug or exact title
        event = await prisma_1.default.event.findFirst({
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
            include: {
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
                    orderBy: { price: "asc" },
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
                    orderBy: { startTime: "asc" },
                },
                exhibitionSpaces: { where: { isAvailable: true } },
                _count: { select: { registrations: true, reviews: true } },
            },
        });
        // Fallback fuzzy title search
        if (!event) {
            event = await prisma_1.default.event.findFirst({
                where: {
                    title: {
                        contains: id.replace(/-/g, " "),
                        mode: "insensitive",
                    },
                },
                include: {
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
                        orderBy: { price: "asc" },
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
                        orderBy: { startTime: "asc" },
                    },
                    exhibitionSpaces: { where: { isAvailable: true } },
                    _count: { select: { registrations: true, reviews: true } },
                },
            });
        }
    }
    if (!event) {
        return null;
    }
    const availableTickets = event.ticketTypes?.reduce((total, ticket) => total + (ticket.quantity - ticket.sold), 0) ?? 0;
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
async function getCategoryStats() {
    const categoryCounts = await Promise.all(ALL_CATEGORIES.map(async (category) => {
        const count = await prisma_1.default.event.count({
            where: {
                status: "PUBLISHED",
                isPublic: true,
                category: {
                    has: category,
                },
            },
        });
        return { category, count };
    }));
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
async function getEventStats(options) {
    const includeCategories = options.includeCategories ?? true;
    const includeCities = options.includeCities ?? false;
    const includeCountries = options.includeCountries ?? false;
    const result = {
        success: true,
    };
    if (includeCategories) {
        const { categories, totalCategories } = await getCategoryStats();
        result.categories = categories.sort((a, b) => b.count - a.count);
        result.totalCategories = totalCategories;
    }
    if (includeCities) {
        const cityCounts = await Promise.all(CITIES_LIST.map(async (city) => {
            const count = await prisma_1.default.event.count({
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
        }));
        const filteredCities = cityCounts.filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
        result.cities = filteredCities;
        result.totalCities = filteredCities.length;
    }
    if (includeCountries) {
        const countryCounts = await Promise.all(COUNTRIES_LIST.map(async (country) => {
            const count = await prisma_1.default.event.count({
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
        }));
        const filteredCountries = countryCounts.filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
        result.countries = filteredCountries;
        result.totalCountries = filteredCountries.length;
    }
    return result;
}
// Search service – mirrors app/api/search/route.ts
async function searchEntities(query, limit = 5) {
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
        prisma_1.default.event.findMany({
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
            orderBy: { startDate: "asc" },
            take: limit,
        }),
        prisma_1.default.user.findMany({
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
        prisma_1.default.user.findMany({
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
    const eventResults = events.map((event) => ({
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        isVIP: event.isVIP,
        isFeatured: event.isFeatured,
        venue: event.venue,
        type: "event",
    }));
    const venueResults = venues.map((venue) => ({
        id: venue.id,
        venueName: venue.venueName,
        location: [venue.venueCity, venue.venueCountry].filter(Boolean).join(", "),
        type: "venue",
    }));
    const speakerResults = speakers.map((speaker) => ({
        id: speaker.id,
        displayName: `${speaker.firstName} ${speaker.lastName}`,
        type: "speaker",
    }));
    const allResults = [
        ...eventResults.map((e) => ({ ...e, resultType: "event" })),
        ...venueResults.map((v) => ({ ...v, resultType: "venue" })),
        ...speakerResults.map((s) => ({ ...s, resultType: "speaker" })),
    ];
    return {
        events: eventResults,
        venues: venueResults,
        speakers: speakerResults,
        allResults,
    };
}
// ----- Write operations: save, promotions, create, update, delete -----
async function saveEvent(userId, eventId) {
    const event = await prisma_1.default.event.findUnique({ where: { id: eventId } });
    if (!event)
        return { error: "NOT_FOUND" };
    const existing = await prisma_1.default.savedEvent.findUnique({
        where: { userId_eventId: { userId, eventId } },
    });
    if (existing)
        return { alreadySaved: true, savedEvent: existing };
    const savedEvent = await prisma_1.default.savedEvent.create({
        data: { userId, eventId },
        include: { event: true },
    });
    return { savedEvent };
}
async function unsaveEvent(userId, eventId) {
    await prisma_1.default.savedEvent.deleteMany({
        where: { userId, eventId },
    });
    return { removed: true };
}
async function isEventSaved(userId, eventId) {
    const saved = await prisma_1.default.savedEvent.findUnique({
        where: { userId_eventId: { userId, eventId } },
    });
    return !!saved;
}
async function getEventPromotions(eventId) {
    const event = await prisma_1.default.event.findUnique({
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
    if (!event)
        return null;
    const promotions = await prisma_1.default.promotion.findMany({
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
async function createPromotion(eventId, body) {
    const event = await prisma_1.default.event.findUnique({
        where: { id: eventId },
        select: { id: true, organizerId: true },
    });
    if (!event)
        return { error: "NOT_FOUND" };
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + body.duration);
    const promotion = await prisma_1.default.promotion.create({
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
async function updateEventByOrganizer(organizerId, eventId, body) {
    const existingEvent = await prisma_1.default.event.findFirst({
        where: { id: eventId, organizerId },
        include: { ticketTypes: true, exhibitionSpaces: true },
    });
    if (!existingEvent)
        return { error: "NOT_FOUND" };
    const eventUpdateData = {
        title: body.title,
        description: body.description,
        shortDescription: body.shortDescription ?? null,
        slug: body.slug ??
            body.title?.toString().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        status: body.status?.toUpperCase() ?? existingEvent.status,
        category: body.category || body.eventType || existingEvent.category,
        tags: body.tags || body.categories || existingEvent.tags,
        startDate: body.startDate ? new Date(body.startDate) : existingEvent.startDate,
        endDate: body.endDate ? new Date(body.endDate) : existingEvent.endDate,
        registrationStart: body.registrationStart
            ? new Date(body.registrationStart)
            : existingEvent.registrationStart,
        registrationEnd: body.registrationEnd
            ? new Date(body.registrationEnd)
            : existingEvent.registrationEnd,
        timezone: body.timezone ?? existingEvent.timezone,
        isVirtual: body.isVirtual ?? existingEvent.isVirtual,
        virtualLink: body.virtualLink || null,
        venueId: body.venue && typeof body.venue === "string" ? body.venue : existingEvent.venueId,
        maxAttendees: body.maxAttendees ?? body.capacity ?? existingEvent.maxAttendees,
        currency: body.currency ?? existingEvent.currency,
        bannerImage: body.bannerImage || body.images?.[0]?.url || null,
        thumbnailImage: body.thumbnailImage || null,
        isPublic: body.isPublic !== false,
        requiresApproval: !!body.requiresApproval,
        allowWaitlist: !!body.allowWaitlist,
        refundPolicy: body.refundPolicy || null,
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        isFeatured: !!(body.featured ?? body.isFeatured),
        isVIP: !!(body.vip ?? body.isVIP),
    };
    const ticketTypesToCreate = [];
    if (body.generalPrice || body.pricing?.general) {
        ticketTypesToCreate.push({
            name: "General Admission",
            description: "General admission ticket",
            price: Number(body.generalPrice ?? body.pricing?.general ?? 0),
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
        await prisma_1.default.ticketType.deleteMany({ where: { eventId } });
        eventUpdateData.ticketTypes = { create: ticketTypesToCreate };
    }
    if (Array.isArray(body.exhibitionSpaces) && body.exhibitionSpaces.length > 0) {
        await prisma_1.default.exhibitionSpace.deleteMany({ where: { eventId } });
        eventUpdateData.exhibitionSpaces = {
            create: body.exhibitionSpaces.map((space) => ({
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
    const updatedEvent = await prisma_1.default.event.update({
        where: { id: eventId },
        data: eventUpdateData,
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
async function deleteEventByOrganizer(organizerId, eventId) {
    const existingEvent = await prisma_1.default.event.findFirst({
        where: { id: eventId, organizerId },
    });
    if (!existingEvent)
        return { error: "NOT_FOUND" };
    await prisma_1.default.ticketType.deleteMany({ where: { eventId } });
    await prisma_1.default.exhibitionSpace.deleteMany({ where: { eventId } });
    await prisma_1.default.event.delete({ where: { id: eventId } });
    await prisma_1.default.user.update({
        where: { id: organizerId },
        data: { totalEvents: { decrement: 1 } },
    });
    return { deleted: true };
}
