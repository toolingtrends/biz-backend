"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExhibitorsHandler = getExhibitorsHandler;
exports.getExhibitorHandler = getExhibitorHandler;
exports.getExhibitorAnalyticsHandler = getExhibitorAnalyticsHandler;
exports.getExhibitorEventsHandler = getExhibitorEventsHandler;
const exhibitors_service_1 = require("./exhibitors.service");
async function getExhibitorsHandler(_req, res) {
    try {
        const exhibitors = await (0, exhibitors_service_1.listExhibitors)();
        return res.json({ exhibitors });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching exhibitors (backend):", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
async function getExhibitorHandler(req, res) {
    try {
        const { id } = req.params;
        const exhibitor = await (0, exhibitors_service_1.getExhibitorById)(id);
        if (!exhibitor) {
            return res.status(404).json({ success: false, error: "Exhibitor not found" });
        }
        return res.json({ success: true, exhibitor });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("Invalid exhibitor ID")) {
            return res.status(400).json({ success: false, error: "Invalid exhibitor ID" });
        }
        // eslint-disable-next-line no-console
        console.error("Error fetching exhibitor (backend):", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}
async function getExhibitorAnalyticsHandler(req, res) {
    try {
        const { id } = req.params;
        const analytics = await (0, exhibitors_service_1.getExhibitorAnalytics)(id);
        return res.json({
            success: true,
            analytics,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching exhibitor analytics (backend):", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
async function getExhibitorEventsHandler(req, res) {
    try {
        const { exhibitorId } = req.params;
        if (!exhibitorId) {
            return res.status(400).json({ error: "exhibitorId is required" });
        }
        const events = await (0, exhibitors_service_1.getExhibitorEvents)(exhibitorId);
        return res.status(200).json({ events });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("exhibitorId is required")) {
            return res.status(400).json({ error: "exhibitorId is required" });
        }
        // eslint-disable-next-line no-console
        console.error("Error fetching exhibitor events (backend):", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
