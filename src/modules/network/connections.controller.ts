import { Request, Response } from "express";
import {
  listConnections,
  listConnectionRequests,
  requestConnection,
  acceptConnection,
  rejectConnection,
  deleteConnection,
} from "./connections.service";

export async function getConnectionsHandler(req: Request, res: Response) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const connections = await listConnections(userId);
    return res.json({ connections, data: connections });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error listing connections:", error);
    return res.status(500).json({
      error: "Failed to fetch connections",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getConnectionRequestsHandler(req: Request, res: Response) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const requests = await listConnectionRequests(userId);
    return res.json({ connections: requests, data: requests });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error listing connection requests:", error);
    return res.status(500).json({
      error: "Failed to fetch connection requests",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function requestConnectionHandler(req: Request, res: Response) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { receiverId } = req.body as { receiverId?: string };
    if (!receiverId) {
      return res.status(400).json({ error: "receiverId is required" });
    }
    const result = await requestConnection(userId, receiverId);
    return res.status(201).json(result);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // eslint-disable-next-line no-console
    console.error("Error sending connection request:", error);
    if (message.includes("not found")) {
      return res.status(404).json({ error: message });
    }
    if (
      message.includes("already") ||
      message.includes("Cannot send") ||
      message.includes("yourself")
    ) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
}

export async function acceptConnectionHandler(req: Request, res: Response) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Connection id is required" });
    }
    const result = await acceptConnection(id, userId);
    return res.json(result);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // eslint-disable-next-line no-console
    console.error("Error accepting connection:", error);
    if (message.includes("not found")) {
      return res.status(404).json({ error: message });
    }
    if (message.includes("Only the receiver") || message.includes("not pending")) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
}

export async function rejectConnectionHandler(req: Request, res: Response) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Connection id is required" });
    }
    await rejectConnection(id, userId);
    return res.json({ success: true });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // eslint-disable-next-line no-console
    console.error("Error rejecting connection:", error);
    if (message.includes("not found")) {
      return res.status(404).json({ error: message });
    }
    if (message.includes("Only the receiver") || message.includes("not pending")) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
}

export async function deleteConnectionHandler(req: Request, res: Response) {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Connection id is required" });
    }
    await deleteConnection(id, userId);
    return res.json({ success: true });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // eslint-disable-next-line no-console
    console.error("Error deleting connection:", error);
    if (message.includes("not found")) {
      return res.status(404).json({ error: message });
    }
    if (message.includes("only remove")) {
      return res.status(403).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
}
