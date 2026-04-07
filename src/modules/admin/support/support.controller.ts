import { Request, Response } from "express";
import { sendList, sendError, sendOne } from "../../../lib/admin-response";
import * as service from "./support.service";

function staffDisplayName(req: Request): string {
  const a = req.auth!;
  if (a.displayName?.trim()) return a.displayName.trim();
  const parts = [a.firstName, a.lastName].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return a.email || "Admin";
}

export async function listTickets(req: Request, res: Response) {
  try {
    const result = await service.listTickets(req.query as Record<string, unknown>);
    return sendList(res, result.data, result.pagination);
  } catch (e: any) {
    return sendError(res, 500, "Failed to list support tickets", e?.message);
  }
}

export async function updateTicket(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: string };
    if (!id || !status) {
      return sendError(res, 400, "Ticket id and status are required");
    }
    await service.updateTicketStatus(id, status);
    return res.json({ success: true });
  } catch (e: any) {
    const msg = e?.message === "Invalid status" ? e.message : "Failed to update ticket";
    const code = e?.message === "Invalid status" ? 400 : 500;
    return sendError(res, code, msg, e?.message);
  }
}

export async function replyToTicket(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { content } = req.body as { content?: string; isInternal?: boolean };
    if (!id || !content?.trim()) {
      return sendError(res, 400, "Ticket id and content are required");
    }
    await service.addStaffReply(id, content, staffDisplayName(req));
    return res.json({ success: true });
  } catch (e: any) {
    const code = e?.message === "Ticket not found" ? 404 : 500;
    return sendError(res, code, e?.message || "Failed to reply", e?.message);
  }
}
