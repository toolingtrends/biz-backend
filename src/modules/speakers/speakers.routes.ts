import { Router } from "express";
import {
  getSpeakersHandler,
  getSpeakerHandler,
  getSpeakerEventsHandler,
} from "./speakers.controller";

const router = Router();

// List speakers
router.get("/speakers", getSpeakersHandler);

// Single speaker profile
router.get("/speakers/:id", getSpeakerHandler);

// Speaker events
router.get("/speakers/:id/events", getSpeakerEventsHandler);

export default router;

