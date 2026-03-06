import { Router } from "express";
import {
  getEventsHandler,
  getEventByIdHandler,
  getFeaturedEventsHandler,
  getEventsStatsHandler,
  searchHandler,
  saveEventHandler,
  unsaveEventHandler,
  isEventSavedHandler,
  getEventPromotionsHandler,
  createPromotionHandler,
  getRecentEventsHandler,
  getVipEventsHandler,
  getEventLeadsHandler,
  getEventExhibitorsHandler,
  getEventSpeakersHandler,
  getEventBrochureHandler,
  updateEventLayoutHandler,
  deleteEventLayoutHandler,
  getEventSpaceCostsHandler,
} from "./events.controller";
import { requireUser } from "../../middleware/auth.middleware";

const router = Router();

// List events, with filters & pagination
router.get("/events", getEventsHandler);

// Recent events
router.get("/events/recent", getRecentEventsHandler);

// VIP events
router.get("/events/vip", getVipEventsHandler);

// Featured events (before :id)
router.get("/events/featured", getFeaturedEventsHandler);

// Events stats (categories, cities, countries)
router.get("/events/stats", getEventsStatsHandler);

// Single event by id / slug / title
router.get("/events/:id", getEventByIdHandler);

// Event sub-resources (leads, exhibitors, speakers, brochure, layout, space-costs)
router.get("/events/:id/leads", getEventLeadsHandler);
router.get("/events/:id/exhibitors", getEventExhibitorsHandler);
router.get("/events/:id/speakers", getEventSpeakersHandler);
router.get("/events/:id/brochure", getEventBrochureHandler);
router.put("/events/:id/layout", requireUser, updateEventLayoutHandler);
router.delete("/events/:id/layout", requireUser, deleteEventLayoutHandler);
router.get("/events/:id/space-costs", getEventSpaceCostsHandler);

// Save / unsave event (user only)
router.post("/events/:id/save", requireUser, saveEventHandler);
router.delete("/events/:id/save", requireUser, unsaveEventHandler);
router.get("/events/:id/save", requireUser, isEventSavedHandler);

// Event promotions (GET public, POST authenticated)
router.get("/events/:id/promotions", getEventPromotionsHandler);
router.post("/events/:id/promotions", requireUser, createPromotionHandler);

// Global search (events, venues, speakers)
router.get("/search", searchHandler);

export default router;

