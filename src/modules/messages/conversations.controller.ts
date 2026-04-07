import { Request, Response } from "express";
import {
  listConversations,
  getConversationById,
  startConversation,
} from "./conversations.service";

export async function listConversationsHandler(req: Request, res: Response) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const list = await listConversations(userId);
    return res.json({ conversations: list });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error listing conversations:", error);
    return res.status(500).json({
      error: "Failed to fetch conversations",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getConversationHandler(req: Request, res: Response) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Conversation id is required" });
    }
    const conversation = await getConversationById(id, userId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    return res.json({ conversation });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching conversation:", error);
    return res.status(500).json({
      error: "Failed to fetch conversation",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function startConversationHandler(req: Request, res: Response) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { participantIds } = req.body as { participantIds?: string[] };
    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ error: "participantIds array with at least one user id is required" });
    }
    const result = await startConversation(userId, participantIds);
    return res.status(201).json(result);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // eslint-disable-next-line no-console
    console.error("Error starting conversation:", error);
    if (message.includes("not found") || message.includes("participants not found")) {
      return res.status(404).json({ error: message });
    }
    if (message.includes("connected") || message.includes("yourself") || message.includes("participant")) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
}
