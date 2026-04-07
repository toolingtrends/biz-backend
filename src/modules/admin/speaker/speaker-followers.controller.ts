import { Request, Response } from "express";
import { sendError } from "../../../lib/admin-response";
import * as service from "./speaker-followers.service";

export async function list(req: Request, res: Response) {
  try {
    const data = await service.listSpeakerFollowersForAdmin();
    return res.json(data);
  } catch (e: any) {
    return sendError(res, 500, "Failed to list speaker followers", e?.message);
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const data = await service.getSpeakerFollowersById(req.params.id);
    if (!data) return sendError(res, 404, "Speaker not found");
    return res.json(data);
  } catch (e: any) {
    return sendError(res, 500, "Failed to get speaker followers", e?.message);
  }
}
