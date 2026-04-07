import { Router } from "express";
import { requireUser } from "../../middleware/auth.middleware";
import {
  getMessagesHandler,
  postMessageHandler,
  markReadHandler,
} from "./messages.controller";

const router = Router();

router.use(requireUser);

// POST /api/messages/read — mark conversation as read (body: { conversationId })
// Must be before /:conversationId so "read" is not captured
router.post("/read", markReadHandler);

// GET /api/messages/:conversationId — list messages in a conversation
router.get("/:conversationId", getMessagesHandler);

// POST /api/messages — send a message (body: { conversationId, content, type? })
router.post("/", postMessageHandler);

export default router;
