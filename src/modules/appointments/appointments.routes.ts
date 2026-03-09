import { Router } from "express";
import {
  getVenueAppointmentsHandler,
  createVenueAppointmentHandler,
  updateVenueAppointmentHandler,
} from "./appointments.controller";

const router = Router();

// Venue appointments used by /api/venue-appointments proxy
// NOTE: These are currently public while the appointment model and
// auth wiring are being finalized. Frontend calls them without JWT.
router.get("/venue-appointments", getVenueAppointmentsHandler);
router.post("/venue-appointments", createVenueAppointmentHandler);
router.patch("/venue-appointments", updateVenueAppointmentHandler);

export default router;

