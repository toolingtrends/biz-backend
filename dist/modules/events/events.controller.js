"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventsHandler = getEventsHandler;
exports.getEventByIdHandler = getEventByIdHandler;
exports.getFeaturedEventsHandler = getFeaturedEventsHandler;
exports.getEventsStatsHandler = getEventsStatsHandler;
exports.searchHandler = searchHandler;
exports.saveEventHandler = saveEventHandler;
exports.unsaveEventHandler = unsaveEventHandler;
exports.isEventSavedHandler = isEventSavedHandler;
exports.getEventPromotionsHandler = getEventPromotionsHandler;
exports.createPromotionHandler = createPromotionHandler;
exports.createEventAdminHandler = createEventAdminHandler;
const events_service_1 = require("./events.service");
const events_writes_service_1 = require("./events-writes.service");
async function getEventsHandler(req, res) {
    try {
        const { page, limit, category, search, location, startDate, endDate, featured, sort, verified, stats, } = req.query;
        // If stats=true, return category stats (backward-compatible behavior)
        if (stats === "true") {
            const data = await (0, events_service_1.getCategoryStats)();
            return res.json({
                success: true,
                ...data,
            });
        }
        const pageNum = page ? parseInt(page, 10) : undefined;
        const limitNum = limit ? parseInt(limit, 10) : undefined;
        const result = await (0, events_service_1.listEvents)({
            page: pageNum,
            limit: limitNum,
            category: category ?? null,
            search: search ?? "",
            location: location ?? null,
            startDate: startDate ?? null,
            endDate: endDate ?? null,
            featured: featured === "true",
            sort: sort ?? "newest",
            verified: verified === "true",
        });
        return res.json({
            success: true,
            events: result.events,
            pagination: result.pagination,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching events (backend):", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch events",
            details: error.message,
        });
    }
}
async function getEventByIdHandler(req, res) {
    try {
        const { id } = req.params;
        const event = await (0, events_service_1.getEventByIdentifier)(id);
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }
        // Note: we don't set cache headers here; that can be done at gateway/proxy level
        return res.json(event);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching event (backend):", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
async function getFeaturedEventsHandler(_req, res) {
    try {
        const events = await (0, events_service_1.getFeaturedEvents)();
        return res.json(events);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch featured events (backend):", error);
        return res.status(500).json({ error: "Failed to fetch featured events" });
    }
}
async function getEventsStatsHandler(req, res) {
    try {
        const include = req.query.include ?? "";
        const includes = include ? include.split(",") : [];
        const includeCategories = includes.length === 0 || includes.includes("categories");
        const includeCities = includes.includes("cities");
        const includeCountries = includes.includes("countries");
        const result = await (0, events_service_1.getEventStats)({
            includeCategories,
            includeCities,
            includeCountries,
        });
        return res.json(result);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching stats (backend):", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch stats",
            details: error.message,
        });
    }
}
async function searchHandler(req, res) {
    try {
        const q = req.query.q ?? "";
        const limit = req.query.limit ? Number(req.query.limit) : 5;
        const result = await (0, events_service_1.searchEntities)(q, limit);
        return res.json(result);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Search API error (backend):", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
// ----- Write handlers (requireUser for save/promotions) -----
async function saveEventHandler(req, res) {
    try {
        const auth = req.auth;
        if (auth.domain !== "USER") {
            return res.status(403).json({ error: "Only user accounts can save events" });
        }
        const userId = auth.sub;
        const eventId = req.params.id;
        const result = await (0, events_service_1.saveEvent)(userId, eventId);
        if ("error" in result && result.error === "NOT_FOUND") {
            return res.status(404).json({ error: "Event not found" });
        }
        if ("alreadySaved" in result && result.alreadySaved) {
            return res.json({ message: "Event already saved", saved: true });
        }
        return res.json({
            message: "Event saved successfully",
            savedEvent: result.savedEvent,
        });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Save event error (backend):", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}
async function unsaveEventHandler(req, res) {
    try {
        const auth = req.auth;
        if (auth.domain !== "USER") {
            return res.status(403).json({ error: "Only user accounts can unsave events" });
        }
        const userId = auth.sub;
        const eventId = req.params.id;
        await (0, events_service_1.unsaveEvent)(userId, eventId);
        return res.json({ message: "Event removed from saved" });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Unsave event error (backend):", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}
async function isEventSavedHandler(req, res) {
    try {
        const auth = req.auth;
        if (auth.domain !== "USER") {
            return res.json({ isSaved: false });
        }
        const userId = auth.sub;
        const eventId = req.params.id;
        const saved = await (0, events_service_1.isEventSaved)(userId, eventId);
        return res.json({ isSaved: saved });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Is event saved error (backend):", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}
async function getEventPromotionsHandler(req, res) {
    try {
        const eventId = req.params.id;
        const data = await (0, events_service_1.getEventPromotions)(eventId);
        if (!data) {
            return res.status(404).json({ error: "Event not found" });
        }
        return res.json(data);
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Get event promotions error (backend):", err);
        return res.status(500).json({ error: "Failed to fetch promotion data" });
    }
}
async function createPromotionHandler(req, res) {
    try {
        const eventId = req.params.id;
        const body = req.body;
        const packageType = body.packageType ?? "";
        const targetCategories = Array.isArray(body.targetCategories) ? body.targetCategories : [];
        const amount = Number(body.amount) || 0;
        const duration = Number(body.duration) || 0;
        const result = await (0, events_service_1.createPromotion)(eventId, {
            packageType,
            targetCategories,
            amount,
            duration,
        });
        if ("error" in result && result.error === "NOT_FOUND") {
            return res.status(404).json({ error: "Event not found" });
        }
        return res.status(201).json(result.promotion);
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Create promotion error (backend):", err);
        return res.status(500).json({ error: "Failed to create promotion" });
    }
}
async function createEventAdminHandler(req, res) {
    try {
        const auth = req.auth;
        if (auth.domain !== "ADMIN" || (auth.role !== "SUPER_ADMIN" && auth.role !== "SUB_ADMIN")) {
            return res.status(403).json({ error: "Forbidden" });
        }
        const result = await (0, events_writes_service_1.createEventAdmin)({
            body: req.body,
            adminId: auth.sub,
            adminType: auth.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "SUB_ADMIN",
            ipAddress: req.headers["x-forwarded-for"] ?? req.socket?.remoteAddress,
            userAgent: req.headers["user-agent"],
        });
        if ("error" in result) {
            if (result.error === "MISSING_FIELDS") {
                return res.status(400).json({
                    error: `Missing required fields: ${(result.missing ?? []).join(", ")}`,
                });
            }
            if (result.error === "ORGANIZER_REQUIRED") {
                return res.status(400).json({
                    error: "organizerId or organizerEmail/organizerName is required",
                });
            }
            return res.status(400).json({ error: "Bad request" });
        }
        return res.status(201).json({
            success: result.success,
            message: result.message,
            event: result.event,
        });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Create event (admin) error (backend):", err);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            details: err?.message,
        });
    }
}
