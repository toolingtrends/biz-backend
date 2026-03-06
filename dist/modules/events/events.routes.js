"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const events_controller_1 = require("./events.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// List events, with filters & pagination
router.get("/events", events_controller_1.getEventsHandler);
// Featured events (before :id)
router.get("/events/featured", events_controller_1.getFeaturedEventsHandler);
// Events stats (categories, cities, countries)
router.get("/events/stats", events_controller_1.getEventsStatsHandler);
// Single event by id / slug / title
router.get("/events/:id", events_controller_1.getEventByIdHandler);
// Save / unsave event (user only)
router.post("/events/:id/save", auth_middleware_1.requireUser, events_controller_1.saveEventHandler);
router.delete("/events/:id/save", auth_middleware_1.requireUser, events_controller_1.unsaveEventHandler);
router.get("/events/:id/save", auth_middleware_1.requireUser, events_controller_1.isEventSavedHandler);
// Event promotions (GET public, POST authenticated)
router.get("/events/:id/promotions", events_controller_1.getEventPromotionsHandler);
router.post("/events/:id/promotions", auth_middleware_1.requireUser, events_controller_1.createPromotionHandler);
// Global search (events, venues, speakers)
router.get("/search", events_controller_1.searchHandler);
exports.default = router;
