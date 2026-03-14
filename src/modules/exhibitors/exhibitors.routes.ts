import { Router } from "express";
import {
  getExhibitorsHandler,
  getExhibitorHandler,
  updateExhibitorHandler,
  getExhibitorAnalyticsHandler,
  getExhibitorEventsHandler,
  createExhibitorHandler,
  getExhibitorReviewsHandler,
  createExhibitorReviewHandler,
  getExhibitorProductsHandler,
  createExhibitorProductHandler,
  updateExhibitorProductHandler,
  deleteExhibitorProductHandler,
} from "./exhibitors.controller";

const router = Router();

// List exhibitors
router.get("/exhibitors", getExhibitorsHandler);
// Create exhibitor (for Add Exhibitor flow)
router.post("/exhibitors", createExhibitorHandler);

// Single exhibitor (GET + PUT for profile)
router.get("/exhibitors/:id", getExhibitorHandler);
router.put("/exhibitors/:id", updateExhibitorHandler);

// Exhibitor analytics
router.get("/exhibitors/:id/analytics", getExhibitorAnalyticsHandler);

// Exhibitor events
router.get("/exhibitors/:exhibitorId/events", getExhibitorEventsHandler);

// Exhibitor reviews (list, create)
router.get("/exhibitors/:id/reviews", getExhibitorReviewsHandler);
router.post("/exhibitors/:id/reviews", createExhibitorReviewHandler);

// Exhibitor products (list, create, update, delete)
router.get("/exhibitors/:id/products", getExhibitorProductsHandler);
router.post("/exhibitors/:id/products", createExhibitorProductHandler);
router.put("/exhibitors/:id/products/:productId", updateExhibitorProductHandler);
router.delete("/exhibitors/:id/products/:productId", deleteExhibitorProductHandler);

export default router;

