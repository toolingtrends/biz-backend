"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOrganizers = listOrganizers;
exports.getOrganizerById = getOrganizerById;
exports.getOrganizerAnalytics = getOrganizerAnalytics;
exports.getOrganizerTotalAttendees = getOrganizerTotalAttendees;
const prisma_1 = __importDefault(require("../../config/prisma"));
// ---------- List organizers ----------
async function listOrganizers() {
    const organizers = await prisma_1.default.user.findMany({
        where: { role: "ORGANIZER" },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            bio: true,
            website: true,
            location: true,
            organizationName: true,
            description: true,
            headquarters: true,
            totalReviews: true,
            averageRating: true,
            founded: true,
            teamSize: true,
            specialties: true,
            isVerified: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            organizedEvents: {
                where: { status: "PUBLISHED" },
                select: { id: true },
            },
        },
    });
    const organizersWithStats = await Promise.all(organizers.map(async (organizer) => {
        const eventIds = organizer.organizedEvents.map((e) => e.id);
        const attendeeCount = await prisma_1.default.eventRegistration.count({
            where: {
                eventId: { in: eventIds },
                status: "CONFIRMED",
            },
        });
        const foundedYear = organizer.founded ? parseInt(organizer.founded) : new Date().getFullYear();
        const yearsOfExperience = Number.isNaN(foundedYear) ? 0 : new Date().getFullYear() - foundedYear;
        const revenueData = await prisma_1.default.eventRegistration.aggregate({
            where: {
                eventId: { in: eventIds },
                status: "CONFIRMED",
            },
            _sum: {
                totalAmount: true,
            },
        });
        return {
            id: organizer.id,
            name: organizer.organizationName || `${organizer.firstName} ${organizer.lastName}`,
            company: organizer.organizationName || "",
            image: organizer.avatar || "/placeholder.svg?height=100&width=100&text=Org",
            avgRating: organizer.averageRating || 0,
            totalReviews: organizer.totalReviews || 0,
            headquarters: organizer.headquarters || organizer.location || "Not specified",
            reviewCount: organizer.totalReviews || 0,
            location: organizer.location || "Not specified",
            country: "India",
            category: organizer.specialties?.[0] || "General Events",
            eventsOrganized: organizer.organizedEvents.length,
            yearsOfExperience,
            specialties: organizer.specialties || ["Event Management"],
            description: organizer.description || organizer.bio || "No description provided",
            phone: organizer.phone || "Not provided",
            email: organizer.email,
            website: organizer.website || "",
            verified: organizer.isVerified || false,
            active: organizer.isActive || false,
            featured: false,
            totalAttendees: attendeeCount,
            totalRevenue: revenueData._sum.totalAmount || 0,
            successRate: organizer.organizedEvents.length > 0 ? 95 : 0,
            joinDate: organizer.createdAt.toISOString().split("T")[0],
            lastActive: organizer.updatedAt.toISOString().split("T")[0],
        };
    }));
    return organizersWithStats;
}
// ---------- Single organizer ----------
async function getOrganizerById(id) {
    const organizer = await prisma_1.default.user.findFirst({
        where: {
            id,
            role: "ORGANIZER",
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            bio: true,
            website: true,
            linkedin: true,
            twitter: true,
            company: true,
            location: true,
            organizationName: true,
            description: true,
            headquarters: true,
            founded: true,
            teamSize: true,
            specialties: true,
            achievements: true,
            certifications: true,
            businessEmail: true,
            businessPhone: true,
            businessAddress: true,
            totalEvents: true,
            activeEvents: true,
            totalAttendees: true,
            totalRevenue: true,
            createdAt: true,
            _count: {
                select: {
                    organizedEvents: {
                        where: {
                            status: "PUBLISHED",
                        },
                    },
                },
            },
        },
    });
    if (!organizer) {
        return null;
    }
    const eventStats = await prisma_1.default.event.aggregate({
        where: {
            organizerId: id,
        },
        _count: {
            id: true,
        },
    });
    const activeEventStats = await prisma_1.default.event.aggregate({
        where: {
            organizerId: id,
            status: "PUBLISHED",
        },
        _count: {
            id: true,
        },
    });
    const attendeeStats = await prisma_1.default.eventRegistration.aggregate({
        where: {
            event: {
                organizerId: id,
            },
            status: "CONFIRMED",
        },
        _count: {
            id: true,
        },
        _sum: {
            totalAmount: true,
        },
    });
    const organizerData = {
        id: organizer.id,
        name: `${organizer.firstName} ${organizer.lastName}`,
        company: organizer.organizationName || organizer.company || `${organizer.firstName} ${organizer.lastName}`,
        email: organizer.email,
        phone: organizer.phone || "",
        location: organizer.location || "",
        website: organizer.website || "",
        description: organizer.description || organizer.bio || "",
        avatar: organizer.avatar || "/placeholder.svg?height=100&width=100&text=Avatar",
        totalEvents: eventStats._count.id,
        activeEvents: activeEventStats._count.id,
        totalAttendees: attendeeStats._count.id,
        totalRevenue: attendeeStats._sum.totalAmount || 0,
        founded: organizer.founded || "2020",
        teamSize: organizer.teamSize || "1-10",
        headquarters: organizer.headquarters || organizer.location || "Not specified",
        specialties: organizer.specialties || ["Event Management"],
        achievements: organizer.achievements || [],
        certifications: organizer.certifications || [],
        organizationName: organizer.organizationName || organizer.company || `${organizer.firstName} ${organizer.lastName}`,
        businessEmail: organizer.businessEmail || organizer.email,
        businessPhone: organizer.businessPhone || organizer.phone,
        businessAddress: organizer.businessAddress || organizer.location,
    };
    return organizerData;
}
// ---------- Organizer analytics ----------
function getColorForCategory(category) {
    const colors = {
        Technology: "#3B82F6",
        Healthcare: "#10B981",
        Business: "#F59E0B",
        Education: "#EF4444",
        Entertainment: "#8B5CF6",
        Sports: "#06B6D4",
        Other: "#6B7280",
    };
    return colors[category] ?? "#6B7280";
}
async function getOrganizerAnalytics(id) {
    const organizer = await prisma_1.default.user.findFirst({
        where: {
            id,
            role: "ORGANIZER",
        },
    });
    if (!organizer) {
        return null;
    }
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const eventAnalytics = await prisma_1.default.eventAnalytics.findMany({
        where: {
            event: {
                organizerId: id,
            },
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
        include: {
            event: {
                select: {
                    id: true,
                    title: true,
                    category: true,
                    startDate: true,
                },
            },
        },
        orderBy: {
            date: "asc",
        },
    });
    let analyticsData;
    if (eventAnalytics.length === 0) {
        const events = await prisma_1.default.event.findMany({
            where: { organizerId: id },
            select: {
                id: true,
                title: true,
                category: true,
                startDate: true,
                _count: {
                    select: {
                        registrations: {
                            where: { status: "CONFIRMED" },
                        },
                    },
                },
                registrations: {
                    where: { status: "CONFIRMED" },
                    select: { totalAmount: true },
                },
            },
        });
        const totalRegistrations = events.reduce((sum, event) => sum + event._count.registrations, 0);
        const totalRevenue = events.reduce((sum, event) => sum + event.registrations.reduce((eventSum, reg) => eventSum + reg.totalAmount, 0), 0);
        const registrationData = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayRegistrations = Math.floor(totalRegistrations / 30) + Math.floor(Math.random() * 10);
            registrationData.push({
                month: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                registrations: dayRegistrations,
            });
        }
        const eventTypeData = events.reduce((acc, event) => {
            const category = event.category || "Other";
            const existing = acc.find((item) => item.name === category);
            if (existing) {
                existing.value += event._count.registrations;
            }
            else {
                acc.push({
                    name: category,
                    value: event._count.registrations,
                    color: getColorForCategory(category),
                });
            }
            return acc;
        }, []);
        analyticsData = {
            registrationData,
            eventTypeData,
            summary: {
                totalLeads: totalRegistrations * 1.5,
                qualifiedLeads: Math.floor(totalRegistrations * 1.2),
                hotLeads: Math.floor(totalRegistrations * 0.3),
                conversionRate: totalRegistrations > 0 ? 18.7 : 0,
                totalVisitors: totalRegistrations * 8,
                uniqueVisitors: totalRegistrations * 6,
                avgSessionDuration: "4m 32s",
                bounceRate: 24.5,
                totalExhibitors: Math.floor(events.length * 15),
                confirmedExhibitors: Math.floor(events.length * 12),
                totalBoothRevenue: totalRevenue * 0.4,
            },
        };
    }
    else {
        const totalRegistrations = eventAnalytics.reduce((sum, analytics) => sum + analytics.totalRegistrations, 0);
        const totalRevenue = eventAnalytics.reduce((sum, analytics) => sum + analytics.totalRevenue, 0);
        const totalPageViews = eventAnalytics.reduce((sum, analytics) => sum + analytics.pageViews, 0);
        const totalUniqueVisitors = eventAnalytics.reduce((sum, analytics) => sum + analytics.uniqueVisitors, 0);
        const averageConversionRate = eventAnalytics.length > 0
            ? eventAnalytics.reduce((sum, analytics) => sum + analytics.conversionRate, 0) / eventAnalytics.length
            : 0;
        const registrationData = eventAnalytics.map((analytics) => ({
            month: analytics.date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            }),
            registrations: analytics.totalRegistrations,
        }));
        const eventTypeMap = new Map();
        eventAnalytics.forEach((analytics) => {
            const category = analytics.event.category || "Other";
            const current = eventTypeMap.get(category) || 0;
            eventTypeMap.set(category, current + analytics.totalRegistrations);
        });
        const eventTypeData = Array.from(eventTypeMap.entries()).map(([name, value]) => ({
            name,
            value,
            color: getColorForCategory(name),
        }));
        analyticsData = {
            registrationData,
            eventTypeData,
            summary: {
                totalLeads: Math.floor(totalRegistrations * 1.5),
                qualifiedLeads: Math.floor(totalRegistrations * 1.2),
                hotLeads: Math.floor(totalRegistrations * 0.3),
                conversionRate: Math.round(averageConversionRate * 100) / 100,
                totalVisitors: totalPageViews,
                uniqueVisitors: totalUniqueVisitors,
                avgSessionDuration: "4m 32s",
                bounceRate: 24.5,
                totalExhibitors: Math.floor(totalRegistrations * 0.1),
                confirmedExhibitors: Math.floor(totalRegistrations * 0.08),
                totalBoothRevenue: totalRevenue * 0.4,
            },
        };
    }
    return analyticsData;
}
// ---------- Organizer total attendees ----------
async function getOrganizerTotalAttendees(id) {
    const organizerId = id;
    if (!organizerId) {
        throw new Error("Organizer ID is required");
    }
    const events = await prisma_1.default.event.findMany({
        where: {
            organizerId,
        },
        select: {
            id: true,
            title: true,
        },
    });
    if (events.length === 0) {
        return {
            success: true,
            totalAttendees: 0,
            eventsCount: 0,
            statusCounts: {
                NEW: 0,
                CONTACTED: 0,
                QUALIFIED: 0,
                CONVERTED: 0,
                FOLLOW_UP: 0,
                REJECTED: 0,
            },
            eventWiseCounts: [],
            events: [],
            attendees: [],
        };
    }
    const eventIds = events.map((e) => e.id);
    const attendeeLeads = await prisma_1.default.eventLead.findMany({
        where: {
            eventId: {
                in: eventIds,
            },
            type: "ATTENDEE",
        },
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
                    organizerId: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    const verifiedLeads = attendeeLeads.filter((lead) => events.find((e) => e.id === lead.event.id));
    const statusCounts = {
        NEW: verifiedLeads.filter((l) => l.status === "NEW").length,
        CONTACTED: verifiedLeads.filter((l) => l.status === "CONTACTED").length,
        QUALIFIED: verifiedLeads.filter((l) => l.status === "QUALIFIED").length,
        CONVERTED: verifiedLeads.filter((l) => l.status === "CONVERTED").length,
        FOLLOW_UP: verifiedLeads.filter((l) => l.status === "FOLLOW_UP").length,
        REJECTED: verifiedLeads.filter((l) => l.status === "REJECTED").length,
    };
    const eventWiseCounts = events.map((event) => ({
        eventId: event.id,
        eventTitle: event.title,
        count: verifiedLeads.filter((l) => l.event.id === event.id).length,
    }));
    const attendees = verifiedLeads.map((lead) => ({
        id: lead.id,
        userId: lead.user.id,
        firstName: lead.user.firstName,
        lastName: lead.user.lastName,
        email: lead.user.email,
        status: lead.status,
        eventId: lead.event.id,
        eventTitle: lead.event.title,
        registeredAt: lead.createdAt,
    }));
    return {
        success: true,
        totalAttendees: verifiedLeads.length,
        eventsCount: events.length,
        statusCounts,
        eventWiseCounts,
        events,
        attendees,
    };
}
