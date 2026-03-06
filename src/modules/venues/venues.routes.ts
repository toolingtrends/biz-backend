import { Router } from "express";
import { getVenuesHandler, getVenueEventsHandler } from "./venues.controller";

const router = Router();

// List venues
router.get("/venues", getVenuesHandler);

// Events for a specific venue
router.get("/venues/:id/events", getVenueEventsHandler);

export default router;

