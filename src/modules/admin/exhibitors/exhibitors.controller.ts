import { Request, Response } from "express";
import { sendList, sendOne, sendError } from "../../../lib/admin-response";
import * as service from "./exhibitors.service";

export async function list(req: Request, res: Response) {
  try {
    const result = await service.listExhibitors(req.query as Record<string, unknown>);
    return sendList(res, result.data, result.pagination);
  } catch (e: any) {
    return sendError(res, 500, "Failed to list exhibitors", e?.message);
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const item = await service.getExhibitorById(req.params.id);
    if (!item) return sendError(res, 404, "Exhibitor not found");
    return sendOne(res, item);
  } catch (e: any) {
    return sendError(res, 500, "Failed to get exhibitor", e?.message);
  }
}

export async function getStats(req: Request, res: Response) {
  try {
    const stats = await service.getExhibitorStats();
    return res.json({ success: true, data: stats });
  } catch (e: any) {
    return sendError(res, 500, "Failed to get exhibitor stats", e?.message);
  }
}

export async function create(req: Request, res: Response) {
  try {
    const item = await service.createExhibitor(req.body ?? {});
    return res.status(201).json({ success: true, data: item });
  } catch (e: any) {
    if (e?.message?.includes("already exists")) return sendError(res, 400, e.message);
    return sendError(res, 500, "Failed to create exhibitor", e?.message);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const item = await service.updateExhibitor(req.params.id, req.body ?? {});
    if (!item) return sendError(res, 404, "Exhibitor not found");
    return sendOne(res, item);
  } catch (e: any) {
    return sendError(res, 500, "Failed to update exhibitor", e?.message);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const result = await service.deleteExhibitor(req.params.id);
    if (!result) return sendError(res, 404, "Exhibitor not found");
    return sendOne(res, result);
  } catch (e: any) {
    return sendError(res, 500, "Failed to delete exhibitor", e?.message);
  }
}

export async function listExhibitorFeedback(req: Request, res: Response) {
  try {
    const items = await service.listExhibitorFeedbackForAdmin();
    return res.json(items);
  } catch (e: any) {
    return sendError(res, 500, "Failed to list exhibitor feedback", e?.message);
  }
}

export async function updateExhibitorFeedback(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { action } = req.body ?? {};
    if (!id) return sendError(res, 400, "Review id required");
    // Optional: persist approval state if Review gets isApproved/isPublic later
    return res.json({ success: true, id, action: action ?? "approved" });
  } catch (e: any) {
    return sendError(res, 500, "Failed to update feedback", e?.message);
  }
}
