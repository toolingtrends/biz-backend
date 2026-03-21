import { Router } from "express";
import {
  getSpeakersHandler,
  getSpeakerHandler,
  getSpeakerEventsHandler,
  getSpeakerSessionsHandler,
  putSpeakerHandler,
  postSpeakerHandler,
} from "./speakers.controller";
import { requireUser, optionalUser } from "../../middleware/auth.middleware";

const router = Router();

// List speakers
router.get("/speakers", getSpeakersHandler);

// Create speaker (event dashboard "Add new speaker")
router.post("/speakers", requireUser, postSpeakerHandler);

// Single speaker profile
router.get("/speakers/:id", getSpeakerHandler);

// Update speaker profile (dashboard)
router.put("/speakers/:id", requireUser, putSpeakerHandler);

// Speaker events
router.get("/speakers/:id/events", optionalUser, getSpeakerEventsHandler);

// Speaker sessions (Presentation Materials)
router.get("/speakers/:id/sessions", getSpeakerSessionsHandler);

export default router;

