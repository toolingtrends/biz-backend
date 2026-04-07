import { Router } from "express";
import { requireUser } from "../../middleware/auth.middleware";
import { getEventNetworkHandler } from "./network.controller";

const router = Router();

// GET /api/events/:eventId/network — event networking discovery (speakers, exhibitors, attendees, organizers)
router.get("/:eventId/network", requireUser, getEventNetworkHandler);

export default router;
