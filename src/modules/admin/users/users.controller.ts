import { Request, Response } from "express";
import { sendList, sendOne, sendError } from "../../../lib/admin-response";
import * as service from "./users.service";

export async function list(req: Request, res: Response) {
  try {
    const result = await service.listUsers(req.query as Record<string, unknown>);
    return sendList(res, result.data, result.pagination);
  } catch (e: any) {
    return sendError(res, 500, "Failed to list users", e?.message);
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const item = await service.getUserById(req.params.id);
    if (!item) return sendError(res, 404, "User not found");
    return sendOne(res, item);
  } catch (e: any) {
    return sendError(res, 500, "Failed to get user", e?.message);
  }
}
