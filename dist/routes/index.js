"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const admin_1 = __importDefault(require("./admin"));
const events_routes_1 = __importDefault(require("../modules/events/events.routes"));
const organizers_routes_1 = __importDefault(require("../modules/organizers/organizers.routes"));
const exhibitors_routes_1 = __importDefault(require("../modules/exhibitors/exhibitors.routes"));
const venues_routes_1 = __importDefault(require("../modules/venues/venues.routes"));
const speakers_routes_1 = __importDefault(require("../modules/speakers/speakers.routes"));
const router = (0, express_1.Router)();
// Placeholder root route for the backend API
router.get("/", (_req, res) => {
    res.json({ message: "Biz backend API root" });
});
// Example API health endpoint
router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
// Auth-related routes (OTP)
router.use("/auth", auth_1.default);
// Admin routes (event create, etc.)
router.use("/admin", admin_1.default);
// Events & search routes
router.use("/", events_routes_1.default);
// Organizers routes
router.use("/", organizers_routes_1.default);
// Exhibitors routes
router.use("/", exhibitors_routes_1.default);
// Venues routes
router.use("/", venues_routes_1.default);
// Speakers routes
router.use("/", speakers_routes_1.default);
exports.default = router;
