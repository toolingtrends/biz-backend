import { Router } from "express";
import { requireAdmin } from "../../../middleware/auth.middleware";
import * as ctrl from "./venue.controller";

const router = Router();

router.get("/venue-events", requireAdmin, ctrl.listVenueEvents);
router.get("/venue-bookings", requireAdmin, ctrl.listVenueBookings);
router.patch("/venue-bookings/:id", requireAdmin, ctrl.updateVenueBooking);
router.get("/venue-feedback", requireAdmin, ctrl.listVenueFeedback);
router.patch("/venue-feedback/:id", requireAdmin, ctrl.updateVenueFeedback);

export default router;
