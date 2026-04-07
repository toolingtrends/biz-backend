import { Router } from "express";
import {
  getAppointmentsHandler,
  createAppointmentHandler,
  updateAppointmentHandler,
  getVenueAppointmentsHandler,
  createVenueAppointmentHandler,
  updateVenueAppointmentHandler,
} from "./appointments.controller";

const router = Router();

// Event–exhibitor appointments (Schedule Meeting on event exhibitor list).
// Proxied from Next.js /api/appointments; uses backend event/exhibitor IDs (UUID).
router.get("/appointments", getAppointmentsHandler);
router.post("/appointments", createAppointmentHandler);
router.put("/appointments", updateAppointmentHandler);

// Venue appointments used by /api/venue-appointments proxy
router.get("/venue-appointments", getVenueAppointmentsHandler);
router.post("/venue-appointments", createVenueAppointmentHandler);
router.patch("/venue-appointments", updateVenueAppointmentHandler);

export default router;

