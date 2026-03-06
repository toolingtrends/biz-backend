import { Router } from "express";
import { requireAdmin } from "../../middleware/auth.middleware";
import {
  adminGetEventsHandler,
  adminGetEventByIdHandler,
  adminUpdateEventHandler,
  adminDeleteEventHandler,
  adminApproveEventHandler,
  adminRejectEventHandler,
  adminGetVenuesHandler,
  adminGetVisitorsHandler,
  adminGetDashboardHandler,
} from "./admin.controller";
import { createEventAdminHandler } from "../events/events.controller";

const router = Router();

// Events CRUD for admin
router.get("/events", requireAdmin, adminGetEventsHandler);
router.get("/events/:id", requireAdmin, adminGetEventByIdHandler);
router.patch("/events/:id", requireAdmin, adminUpdateEventHandler);
router.delete("/events/:id", requireAdmin, adminDeleteEventHandler);

// Create event (existing behavior)
router.post("/events", requireAdmin, createEventAdminHandler);

// Event approval / rejection
router.post("/events/approve", requireAdmin, adminApproveEventHandler);
router.post("/events/reject", requireAdmin, adminRejectEventHandler);

// Venues list
router.get("/venues", requireAdmin, adminGetVenuesHandler);

// Visitors list
router.get("/visitors", requireAdmin, adminGetVisitorsHandler);

// Admin dashboard summary
router.get("/dashboard", requireAdmin, adminGetDashboardHandler);

export default router;

