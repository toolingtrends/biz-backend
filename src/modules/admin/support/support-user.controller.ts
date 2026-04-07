import { Request, Response } from "express";
import { sendOne, sendError } from "../../../lib/admin-response";
import * as service from "./support.service";

export async function createTicket(req: Request, res: Response) {
  try {
    const userId = req.auth!.sub;
    const body = req.body as Record<string, unknown>;
    const ticket = await service.createTicketForUser(userId, {
      title: typeof body.title === "string" ? body.title : "",
      description: typeof body.description === "string" ? body.description : "",
      category: typeof body.category === "string" ? body.category : undefined,
      priority: typeof body.priority === "string" ? body.priority : undefined,
    });
    return sendOne(res, ticket);
  } catch (e: any) {
    const msg = e?.message || "Failed to create ticket";
    const code =
      msg === "User not found" ? 404 : msg.includes("required") ? 400 : 500;
    return sendError(res, code, msg, e?.message);
  }
}

export async function listMyTickets(req: Request, res: Response) {
  try {
    const userId = req.auth!.sub;
    const data = await service.listTicketsForUser(userId);
    return res.json({ success: true, data });
  } catch (e: any) {
    return sendError(res, 500, "Failed to load tickets", e?.message);
  }
}

export async function addReply(req: Request, res: Response) {
  try {
    const userId = req.auth!.sub;
    const { id } = req.params;
    const { content } = req.body as { content?: string };
    if (!id) return sendError(res, 400, "Ticket id is required");
    await service.addUserReply(userId, id, content ?? "");
    return res.json({ success: true });
  } catch (e: any) {
    const msg = e?.message || "Failed to send reply";
    const code =
      msg === "Ticket not found" ? 404 : msg.includes("required") ? 400 : 500;
    return sendError(res, code, msg, e?.message);
  }
}
