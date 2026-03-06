"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listVenues = listVenues;
exports.getVenueEvents = getVenueEvents;
const prisma_1 = __importDefault(require("../../config/prisma"));
async function listVenues(params) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const skip = (page - 1) * limit;
    const where = { role: "VENUE_MANAGER" };
    const search = params.search?.trim() ?? "";
    if (search) {
        where.OR = [
            { venueName: { contains: search, mode: "insensitive" } },
            { venueDescription: { contains: search, mode: "insensitive" } },
            { venueAddress: { contains: search, mode: "insensitive" } },
        ];
    }
    const [venues, total] = await Promise.all([
        prisma_1.default.user.findMany({
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
        prisma_1.default.user.count({ where }),
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
async function getVenueEvents(id) {
    if (!id) {
        throw new Error("Invalid venue ID");
    }
    const events = await prisma_1.default.event.findMany({
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
