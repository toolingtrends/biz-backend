import { Router } from "express";
import { requireAdmin } from "../../../middleware/auth.middleware";
import * as ctrl from "./organizers.controller";

const router = Router();

// Organizer followers / connections (admin dashboard) — must be before /:id
// GET /api/admin/organizers/organizer-connections
router.get("/organizer-connections", requireAdmin, ctrl.listOrganizerConnections);
// GET /api/admin/organizers/organizer-connections/:id
router.get("/organizer-connections/:id", requireAdmin, ctrl.getOrganizerConnectionsDetail);

// Venue bookings (admin dashboard)
// GET /api/admin/organizers/venue-bookings
router.get("/venue-bookings", requireAdmin, ctrl.listVenueBookings);

// Base CRUD
router.get("/", requireAdmin, ctrl.list);
router.get("/:id", requireAdmin, ctrl.getById);
router.post("/", requireAdmin, ctrl.create);
router.patch("/:id", requireAdmin, ctrl.update);
router.delete("/:id", requireAdmin, ctrl.remove);

export default router;
