import { Router } from "express";
import { requireUser } from "../../middleware/auth.middleware";
import {
  listConversationsHandler,
  getConversationHandler,
  startConversationHandler,
} from "./conversations.controller";

const router = Router();

router.use(requireUser);

// POST /api/conversations/start — start a conversation (body: { participantIds: string[] })
router.post("/start", startConversationHandler);

// GET /api/conversations — list my conversations
router.get("/", listConversationsHandler);

// GET /api/conversations/:id — get one conversation (must be participant)
router.get("/:id", getConversationHandler);

export default router;
