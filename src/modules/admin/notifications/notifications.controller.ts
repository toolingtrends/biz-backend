import { Request, Response } from "express";
import { sendList, sendOne, sendError } from "../../../lib/admin-response";
import * as service from "./notifications.service";

export async function list(req: Request, res: Response) {
  try {
    const result = await service.listNotifications(req.query as Record<string, unknown>);
    return sendList(res, result.data, result.pagination);
  } catch (e: any) {
    return sendError(res, 500, "Failed to list notifications", e?.message);
  }
}

export async function getCount(req: Request, res: Response) {
  try {
    const data = await service.getCount();
    return sendOne(res, data);
  } catch (e: any) {
    return sendError(res, 500, "Failed to get notification count", e?.message);
  }
}
