"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpeakersHandler = getSpeakersHandler;
exports.getSpeakerHandler = getSpeakerHandler;
exports.getSpeakerEventsHandler = getSpeakerEventsHandler;
const speakers_service_1 = require("./speakers.service");
async function getSpeakersHandler(_req, res) {
    try {
        const speakers = await (0, speakers_service_1.listSpeakers)();
        return res.json({
            success: true,
            speakers,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching speakers (backend):", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
}
async function getSpeakerHandler(req, res) {
    try {
        const { id } = req.params;
        const profile = await (0, speakers_service_1.getSpeakerById)(id);
        if (!profile) {
            return res.status(404).json({ success: false, error: "Speaker not found" });
        }
        return res.json({
            success: true,
            profile,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching speaker (backend):", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
}
async function getSpeakerEventsHandler(req, res) {
    try {
        const { id } = req.params;
        const result = await (0, speakers_service_1.getSpeakerEvents)(id);
        return res.json(result);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching speaker events (backend):", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
}
