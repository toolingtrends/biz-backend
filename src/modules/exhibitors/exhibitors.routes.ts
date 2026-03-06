import { Router } from "express";
import {
  getExhibitorsHandler,
  getExhibitorHandler,
  getExhibitorAnalyticsHandler,
  getExhibitorEventsHandler,
} from "./exhibitors.controller";

const router = Router();

// List exhibitors
router.get("/exhibitors", getExhibitorsHandler);

// Single exhibitor
router.get("/exhibitors/:id", getExhibitorHandler);

// Exhibitor analytics
router.get("/exhibitors/:id/analytics", getExhibitorAnalyticsHandler);

// Exhibitor events
router.get("/exhibitors/:exhibitorId/events", getExhibitorEventsHandler);

export default router;

