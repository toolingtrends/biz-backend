import { Router } from "express";
import authRouter from "./auth";
import adminRouter from "./admin";
import uploadRouter from "./upload";
import eventsRouter from "../modules/events/events.routes";
import organizersRouter from "../modules/organizers/organizers.routes";
import exhibitorsRouter from "../modules/exhibitors/exhibitors.routes";
import venuesRouter from "../modules/venues/venues.routes";
import speakersRouter from "../modules/speakers/speakers.routes";

const router = Router();

// Placeholder root route for the backend API
router.get("/", (_req, res) => {
  res.json({ message: "Biz backend API root" });
});

// Example API health endpoint
router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Auth-related routes (OTP, login, refresh)
router.use("/auth", authRouter);

// Admin routes (event create, etc.)
router.use("/admin", adminRouter);

// Upload routes
router.use("/", uploadRouter);

// Events & search routes
router.use("/", eventsRouter);

// Organizers routes
router.use("/", organizersRouter);

// Exhibitors routes
router.use("/", exhibitorsRouter);

// Venues routes
router.use("/", venuesRouter);

// Speakers routes
router.use("/", speakersRouter);

export default router;

