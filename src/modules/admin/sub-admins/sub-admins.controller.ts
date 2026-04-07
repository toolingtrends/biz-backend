import { Request, Response } from "express";
import { sendList, sendOne, sendError } from "../../../lib/admin-response";
import * as service from "./sub-admins.service";

export async function list(req: Request, res: Response) {
  try {
    const adminId = req.auth?.sub;
    if (!adminId) return sendError(res, 401, "Unauthorized");
    const result = await service.listSubAdmins(req.query as Record<string, unknown>, adminId);
    return sendList(res, result.data, result.pagination);
  } catch (e: any) {
    return sendError(res, 500, "Failed to list sub-admins", e?.message);
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const item = await service.getSubAdminById(req.params.id);
    if (!item) return sendError(res, 404, "Sub-admin not found");
    return sendOne(res, item);
  } catch (e: any) {
    return sendError(res, 500, "Failed to get sub-admin", e?.message);
  }
}

export async function create(req: Request, res: Response) {
  try {
    const adminId = req.auth?.sub;
    if (!adminId) return sendError(res, 401, "Unauthorized");
    const item = await service.createSubAdmin(req.body ?? {}, adminId);
    return res.status(201).json({ success: true, data: item });
  } catch (e: any) {
    if (e?.message?.includes("already exists")) return sendError(res, 400, e.message);
    if (e?.message?.includes("Password")) return sendError(res, 400, e.message);
    return sendError(res, 500, "Failed to create sub-admin", e?.message);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const item = await service.updateSubAdmin(req.params.id, req.body ?? {});
    if (!item) return sendError(res, 404, "Sub-admin not found");
    return sendOne(res, item);
  } catch (e: any) {
    return sendError(res, 500, "Failed to update sub-admin", e?.message);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const result = await service.deleteSubAdmin(req.params.id);
    if (!result) return sendError(res, 404, "Sub-admin not found");
    return sendOne(res, result);
  } catch (e: any) {
    return sendError(res, 500, "Failed to delete sub-admin", e?.message);
  }
}
