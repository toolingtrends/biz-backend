import { Router } from "express";
import {
  getOrganizersHandler,
  getOrganizerHandler,
  getOrganizerAnalyticsHandler,
  getOrganizerTotalAttendeesHandler,
  updateOrganizerEventHandler,
  deleteOrganizerEventHandler,
  createOrganizerEventHandler,
  getOrganizerMessagesHandler,
  createOrganizerMessageHandler,
  deleteOrganizerMessageHandler,
  getOrganizerLeadsHandler,
  getOrganizerExhibitorLeadsHandler,
  getOrganizerAttendeeLeadsHandler,
  getOrganizerPromotionsHandler,
  createOrganizerPromotionHandler,
  getOrganizerSubscriptionHandler,
  updateOrganizerSubscriptionHandler,
  getOrganizerReviewsHandler,
} from "./organizers.controller";
import { requireUser } from "../../middleware/auth.middleware";

const router = Router();

// List organizers
router.get("/organizers", getOrganizersHandler);

// Single organizer details
router.get("/organizers/:id", getOrganizerHandler);

// Organizer analytics
router.get("/organizers/:id/analytics", getOrganizerAnalyticsHandler);

// Organizer total attendees
router.get("/organizers/:id/total-attendees", getOrganizerTotalAttendeesHandler);

// Organizer event create/update/delete (authenticated)
router.post("/organizers/:id/events", requireUser, createOrganizerEventHandler);
router.put("/organizers/:id/events/:eventId", requireUser, updateOrganizerEventHandler);
router.delete("/organizers/:id/events/:eventId", requireUser, deleteOrganizerEventHandler);

// Organizer messages (dashboard, authenticated)
router.get("/organizers/:id/messages", requireUser, getOrganizerMessagesHandler);
router.post("/organizers/:id/messages", requireUser, createOrganizerMessageHandler);
router.delete(
  "/organizers/:id/messages/:messageId",
  requireUser,
  deleteOrganizerMessageHandler
);

// Organizer leads (dashboard, authenticated)
router.get("/organizers/:id/leads", requireUser, getOrganizerLeadsHandler);
router.get(
  "/organizers/:id/leads/exhibitor",
  requireUser,
  getOrganizerExhibitorLeadsHandler
);
router.get(
  "/organizers/:id/leads/attendees",
  requireUser,
  getOrganizerAttendeeLeadsHandler
);

// Organizer promotions (dashboard, authenticated)
router.get("/organizers/:id/promotions", requireUser, getOrganizerPromotionsHandler);
router.post("/organizers/:id/promotions", requireUser, createOrganizerPromotionHandler);

// Organizer subscription (dashboard, authenticated)
router.get("/organizers/:id/subscription", requireUser, getOrganizerSubscriptionHandler);
router.put(
  "/organizers/:id/subscription",
  requireUser,
  updateOrganizerSubscriptionHandler
);

// Organizer reviews (dashboard, authenticated)
router.get("/organizers/:id/reviews", requireUser, getOrganizerReviewsHandler);

export default router;

