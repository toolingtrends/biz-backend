import { Request, Response } from "express";
import { sendError } from "../../../lib/admin-response";
import * as service from "./speaker-feedback.service";

export async function list(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const result = await service.listSpeakerFeedbackForAdmin(page, limit);
    return res.json(result);
  } catch (e: any) {
    return sendError(res, 500, "Failed to list speaker feedback", e?.message);
  }
}

export async function updateById(req: Request, res: Response) {
  try {
    const body = (req.body ?? {}) as { isApproved?: boolean; isPublic?: boolean };
    const item = await service.updateSpeakerFeedbackById(req.params.id, body);
    if (!item) return sendError(res, 404, "Feedback not found");
    return res.json({ success: true, data: item });
  } catch (e: any) {
    return sendError(res, 500, "Failed to update feedback", e?.message);
  }
}
