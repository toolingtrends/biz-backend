import { Request, Response } from "express";
import { sendList, sendOne } from "../../../lib/admin-response";
import { respondWithAdminError } from "../../../lib/prisma-admin-errors";
import * as service from "./role-definitions.service";

export async function list(req: Request, res: Response) {
  try {
    const result = await service.listRoleDefinitions(req.query as Record<string, unknown>);
    return sendList(res, result.data, result.pagination);
  } catch (e: unknown) {
    respondWithAdminError(res, e, "Failed to list role definitions");
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const item = await service.getRoleDefinitionById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: "Role not found" });
    }
    return sendOne(res, item);
  } catch (e: unknown) {
    respondWithAdminError(res, e, "Failed to get role");
  }
}

export async function create(req: Request, res: Response) {
  try {
    const item = await service.createRoleDefinition(req.body ?? {});
    return res.status(201).json({ success: true, data: item });
  } catch (e: unknown) {
    respondWithAdminError(res, e, "Failed to create role");
  }
}

export async function update(req: Request, res: Response) {
  try {
    const item = await service.updateRoleDefinition(req.params.id, req.body ?? {});
    if (!item) {
      return res.status(404).json({ success: false, error: "Role not found" });
    }
    return sendOne(res, item);
  } catch (e: unknown) {
    respondWithAdminError(res, e, "Failed to update role");
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const result = await service.deleteRoleDefinition(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, error: "Role not found" });
    }
    return sendOne(res, result);
  } catch (e: unknown) {
    respondWithAdminError(res, e, "Failed to delete role");
  }
}
