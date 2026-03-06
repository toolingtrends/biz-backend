"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizersHandler = getOrganizersHandler;
exports.getOrganizerHandler = getOrganizerHandler;
exports.getOrganizerAnalyticsHandler = getOrganizerAnalyticsHandler;
exports.getOrganizerTotalAttendeesHandler = getOrganizerTotalAttendeesHandler;
exports.updateOrganizerEventHandler = updateOrganizerEventHandler;
exports.deleteOrganizerEventHandler = deleteOrganizerEventHandler;
const organizers_service_1 = require("./organizers.service");
const events_service_1 = require("../events/events.service");
async function getOrganizersHandler(_req, res) {
    try {
        const organizers = await (0, organizers_service_1.listOrganizers)();
        return res.json({
            organizers,
            total: organizers.length,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching organizers (backend):", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
async function getOrganizerHandler(req, res) {
    try {
        const { id } = req.params;
        const organizer = await (0, organizers_service_1.getOrganizerById)(id);
        if (!organizer) {
            return res.status(404).json({ error: "Organizer not found" });
        }
        return res.json({ organizer });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching organizer (backend):", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
async function getOrganizerAnalyticsHandler(req, res) {
    try {
        const { id } = req.params;
        const analytics = await (0, organizers_service_1.getOrganizerAnalytics)(id);
        if (!analytics) {
            return res.status(404).json({ error: "Organizer not found" });
        }
        return res.json({ analytics });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching organizer analytics (backend):", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
async function getOrganizerTotalAttendeesHandler(req, res) {
    try {
        const { id } = req.params;
        const data = await (0, organizers_service_1.getOrganizerTotalAttendees)(id);
        return res.json(data);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching organizer total attendees (backend):", error);
        if (error instanceof Error && error.message.includes("Organizer ID is required")) {
            return res.status(400).json({ success: false, error: "Organizer ID is required" });
        }
        return res.status(500).json({ success: false, error: "Failed to fetch total attendees" });
    }
}
async function updateOrganizerEventHandler(req, res) {
    try {
        const auth = req.auth;
        const { id, eventId } = req.params;
        if (!id || id === "undefined") {
            return res.status(400).json({ error: "Invalid organizer ID" });
        }
        if (!eventId) {
            return res.status(400).json({ error: "Event ID is required" });
        }
        if (auth.sub !== id && auth.role !== "ORGANIZER") {
            return res.status(403).json({ error: "Forbidden" });
        }
        const result = await (0, events_service_1.updateEventByOrganizer)(id, eventId, req.body);
        if ("error" in result && result.error === "NOT_FOUND") {
            return res.status(404).json({ error: "Event not found or access denied" });
        }
        return res.status(200).json({
            message: "Event updated successfully",
            event: result.event,
        });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Update organizer event error (backend):", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}
async function deleteOrganizerEventHandler(req, res) {
    try {
        const auth = req.auth;
        const { id, eventId } = req.params;
        if (!id || id === "undefined") {
            return res.status(400).json({ error: "Invalid organizer ID" });
        }
        if (!eventId) {
            return res.status(400).json({ error: "Event ID is required" });
        }
        if (auth.sub !== id && auth.role !== "ORGANIZER") {
            return res.status(403).json({ error: "Forbidden" });
        }
        const result = await (0, events_service_1.deleteEventByOrganizer)(id, eventId);
        if ("error" in result && result.error === "NOT_FOUND") {
            return res.status(404).json({ error: "Event not found or access denied" });
        }
        return res.status(200).json({ message: "Event deleted successfully" });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Delete organizer event error (backend):", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}
