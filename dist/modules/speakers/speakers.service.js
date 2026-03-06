"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSpeakers = listSpeakers;
exports.getSpeakerById = getSpeakerById;
exports.getSpeakerEvents = getSpeakerEvents;
const prisma_1 = __importDefault(require("../../config/prisma"));
// List speakers
async function listSpeakers() {
    await prisma_1.default.$connect();
    const speakers = await prisma_1.default.user.findMany({
        where: {
            role: "SPEAKER",
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            bio: true,
            company: true,
            jobTitle: true,
            location: true,
            website: true,
            linkedin: true,
            twitter: true,
            specialties: true,
            achievements: true,
            certifications: true,
            speakingExperience: true,
            isVerified: true,
            totalEvents: true,
            activeEvents: true,
            totalAttendees: true,
            totalRevenue: true,
            averageRating: true,
            totalReviews: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    return speakers;
}
// Single speaker profile
async function getSpeakerById(id) {
    await prisma_1.default.$connect();
    const speaker = await prisma_1.default.user.findUnique({
        where: {
            id,
            role: "SPEAKER",
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            bio: true,
            company: true,
            jobTitle: true,
            location: true,
            website: true,
            linkedin: true,
            twitter: true,
            specialties: true,
            achievements: true,
            certifications: true,
            speakingExperience: true,
            isVerified: true,
            totalEvents: true,
            activeEvents: true,
            totalAttendees: true,
            totalRevenue: true,
            averageRating: true,
            totalReviews: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    if (!speaker) {
        return null;
    }
    const profile = {
        fullName: `${speaker.firstName} ${speaker.lastName}`,
        designation: speaker.jobTitle || "",
        company: speaker.company || "",
        email: speaker.email,
        phone: speaker.phone || "",
        linkedin: speaker.linkedin || "",
        website: speaker.website || "",
        location: speaker.location || "",
        bio: speaker.bio || "",
        speakingExperience: speaker.speakingExperience || "",
        avatar: speaker.avatar || undefined,
    };
    return profile;
}
// Speaker events
async function getSpeakerEvents(id) {
    const speakerId = id;
    await prisma_1.default.$connect();
    const sessions = await prisma_1.default.speakerSession.findMany({
        where: { speakerId },
        include: {
            event: {
                include: {
                    venue: true,
                },
            },
        },
        orderBy: { startTime: "desc" },
    });
    const now = new Date();
    const upcoming = sessions.filter((s) => new Date(s.startTime) > now);
    const past = sessions.filter((s) => new Date(s.startTime) <= now);
    const mapSessionToEvent = (session) => ({
        id: session.event.id,
        title: session.event.title,
        date: session.event.startDate.toISOString(),
        location: session.event.venue
            ? `${session.event.venue.venueName}, ${session.event.venue.venueCity}, ${session.event.venue.venueState}, ${session.event.venue.venueCountry}`
            : "TBD",
        image: session.event.bannerImage || "/images/gpex.jpg",
        averageRating: session.event.averageRating || 0,
        currentAttendees: session.event.currentAttendees || 0,
    });
    return {
        success: true,
        upcoming: upcoming.map(mapSessionToEvent),
        past: past.map(mapSessionToEvent),
    };
}
