"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exhibitors_controller_1 = require("./exhibitors.controller");
const router = (0, express_1.Router)();
// List exhibitors
router.get("/exhibitors", exhibitors_controller_1.getExhibitorsHandler);
// Single exhibitor
router.get("/exhibitors/:id", exhibitors_controller_1.getExhibitorHandler);
// Exhibitor analytics
router.get("/exhibitors/:id/analytics", exhibitors_controller_1.getExhibitorAnalyticsHandler);
// Exhibitor events
router.get("/exhibitors/:exhibitorId/events", exhibitors_controller_1.getExhibitorEventsHandler);
exports.default = router;
