"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const organizers_controller_1 = require("./organizers.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// List organizers
router.get("/organizers", organizers_controller_1.getOrganizersHandler);
// Single organizer details
router.get("/organizers/:id", organizers_controller_1.getOrganizerHandler);
// Organizer analytics
router.get("/organizers/:id/analytics", organizers_controller_1.getOrganizerAnalyticsHandler);
// Organizer total attendees
router.get("/organizers/:id/total-attendees", organizers_controller_1.getOrganizerTotalAttendeesHandler);
// Organizer event update / delete (authenticated)
router.put("/organizers/:id/events/:eventId", auth_middleware_1.requireUser, organizers_controller_1.updateOrganizerEventHandler);
router.delete("/organizers/:id/events/:eventId", auth_middleware_1.requireUser, organizers_controller_1.deleteOrganizerEventHandler);
exports.default = router;
