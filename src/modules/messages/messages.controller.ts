import { Request, Response } from "express";
import { MessageType } from "@prisma/client";
import {
  listMessages as listMessagesService,
  sendMessage as sendMessageService,
  markConversationAsRead,
} from "./messages.service";

export async function getMessagesHandler(req: Request, res: Response) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { conversationId } = req.params;
    if (!conversationId) {
      return res.status(400).json({ error: "conversationId is required" });
    }
    const messages = await listMessagesService(conversationId, userId);
    if (messages === null) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    return res.json({ messages });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error listing messages:", error);
    return res.status(500).json({
      error: "Failed to fetch messages",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function postMessageHandler(req: Request, res: Response) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { conversationId, content, type } = req.body as {
      conversationId?: string;
      content?: string;
      type?: string;
    };
    if (!conversationId || !content) {
      return res.status(400).json({ error: "conversationId and content are required" });
    }
    const result = await sendMessageService({
      senderId: userId,
      conversationId,
      content,
      type: type === "SYSTEM" ? MessageType.SYSTEM : MessageType.TEXT,
    });
    return res.status(201).json(result);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // eslint-disable-next-line no-console
    console.error("Error sending message:", error);
    if (message.includes("not a participant")) {
      return res.status(403).json({ error: message });
    }
    if (message.includes("content is required")) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
}

export async function markReadHandler(req: Request, res: Response) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { conversationId } = req.body as { conversationId?: string };
    if (!conversationId) {
      return res.status(400).json({ error: "conversationId is required" });
    }
    await markConversationAsRead(conversationId, userId);
    return res.json({ success: true });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error marking messages as read:", error);
    return res.status(500).json({
      error: "Failed to mark as read",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
