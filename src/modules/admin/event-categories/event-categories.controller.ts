import { Request, Response } from "express";
import { sendError } from "../../../lib/admin-response";
import * as service from "./event-categories.service";

export async function list(req: Request, res: Response) {
  try {
    const data = await service.listEventCategories();
    return res.json(data);
  } catch (e: any) {
    return sendError(res, 500, "Failed to list event categories", e?.message);
  }
}

export async function create(req: Request, res: Response) {
  try {
    const data = await service.createEventCategory(req.body);
    return res.status(201).json(data);
  } catch (e: any) {
    return sendError(res, 500, "Failed to create event category", e?.message);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = await service.updateEventCategory(id, req.body);
    return res.json(data);
  } catch (e: any) {
    return sendError(res, 500, "Failed to update event category", e?.message);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await service.deleteEventCategory(id);
    return res.status(204).send();
  } catch (e: any) {
    return sendError(res, 500, "Failed to delete event category", e?.message);
  }
}
