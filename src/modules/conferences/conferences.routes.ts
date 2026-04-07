import { Router } from "express";
import {
  listConferencesHandler,
  getConferenceHandler,
  createConferenceHandler,
  updateConferenceHandler,
  deleteConferenceHandler,
} from "./conferences.controller";

const router = Router();

// List conferences for an event (must be before /:id)
router.get("/conferences", listConferencesHandler);
router.post("/conferences", createConferenceHandler);

// Single conference
router.get("/conferences/:id", getConferenceHandler);
router.put("/conferences/:id", updateConferenceHandler);
router.delete("/conferences/:id", deleteConferenceHandler);

export default router;
