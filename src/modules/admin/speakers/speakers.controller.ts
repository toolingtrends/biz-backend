import { Request, Response } from "express";
import { sendList, sendOne, sendError } from "../../../lib/admin-response";
import * as service from "./speakers.service";

export async function list(req: Request, res: Response) {
  try {
    const result = await service.listSpeakers(req.query as Record<string, unknown>);
    return sendList(res, result.data, result.pagination);
  } catch (e: any) {
    return sendError(res, 500, "Failed to list speakers", e?.message);
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const item = await service.getSpeakerById(req.params.id);
    if (!item) return sendError(res, 404, "Speaker not found");
    return sendOne(res, item);
  } catch (e: any) {
    return sendError(res, 500, "Failed to get speaker", e?.message);
  }
}

export async function create(req: Request, res: Response) {
  try {
    const item = await service.createSpeaker(req.body ?? {});
    return res.status(201).json({ success: true, data: item });
  } catch (e: any) {
    if (e?.message?.includes("already exists")) return sendError(res, 400, e.message);
    return sendError(res, 500, "Failed to create speaker", e?.message);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const item = await service.updateSpeaker(req.params.id, req.body ?? {});
    if (!item) return sendError(res, 404, "Speaker not found");
    return sendOne(res, item);
  } catch (e: any) {
    return sendError(res, 500, "Failed to update speaker", e?.message);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const result = await service.deleteSpeaker(req.params.id);
    if (!result) return sendError(res, 404, "Speaker not found");
    return sendOne(res, result);
  } catch (e: any) {
    return sendError(res, 500, "Failed to delete speaker", e?.message);
  }
}
