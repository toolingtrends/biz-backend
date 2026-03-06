"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVenuesHandler = getVenuesHandler;
exports.getVenueEventsHandler = getVenueEventsHandler;
const venues_service_1 = require("./venues.service");
async function getVenuesHandler(req, res) {
    try {
        const search = req.query.search ?? "";
        const page = req.query.page ? Number.parseInt(req.query.page, 10) : undefined;
        const limit = req.query.limit ? Number.parseInt(req.query.limit, 10) : undefined;
        const { venues, pagination } = await (0, venues_service_1.listVenues)({ search, page, limit });
        return res.json({
            success: true,
            data: venues,
            pagination,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching venues (backend):", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch venues",
        });
    }
}
async function getVenueEventsHandler(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, error: "Invalid venue ID" });
        }
        const result = await (0, venues_service_1.getVenueEvents)(id);
        return res.json(result);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("Invalid venue ID")) {
            return res.status(400).json({ success: false, error: "Invalid venue ID" });
        }
        // eslint-disable-next-line no-console
        console.error("Error fetching events by venue ID (backend):", error);
        return res.status(500).json({ success: false, error: "Server Error" });
    }
}
