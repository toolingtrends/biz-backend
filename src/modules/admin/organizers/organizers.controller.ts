import { Request, Response } from "express";
import { sendList, sendOne, sendError } from "../../../lib/admin-response";
import * as service from "./organizers.service";

export async function list(req: Request, res: Response) {
  try {
    const result = await service.listOrganizers(req.query as Record<string, unknown>);
    return sendList(res, result.data, result.pagination);
  } catch (e: any) {
    return sendError(res, 500, "Failed to list organizers", e?.message);
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const item = await service.getOrganizerById(req.params.id);
    if (!item) return sendError(res, 404, "Organizer not found");
    return sendOne(res, item);
  } catch (e: any) {
    return sendError(res, 500, "Failed to get organizer", e?.message);
  }
}

export async function create(req: Request, res: Response) {
  try {
    const item = await service.createOrganizer(req.body ?? {});
    return res.status(201).json({ success: true, data: item });
  } catch (e: any) {
    if (e?.message?.includes("already exists")) return sendError(res, 400, e.message);
    return sendError(res, 500, "Failed to create organizer", e?.message);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const item = await service.updateOrganizer(req.params.id, req.body ?? {});
    if (!item) return sendError(res, 404, "Organizer not found");
    return sendOne(res, item);
  } catch (e: any) {
    return sendError(res, 500, "Failed to update organizer", e?.message);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const result = await service.deleteOrganizer(req.params.id);
    if (!result) return sendError(res, 404, "Organizer not found");
    return sendOne(res, result);
  } catch (e: any) {
    return sendError(res, 500, "Failed to delete organizer", e?.message);
  }
}

export async function listOrganizerConnections(req: Request, res: Response) {
  try {
    const items = await service.listOrganizerConnectionsForAdmin();
    // Frontend expects a plain array
    return res.json(items);
  } catch (e: any) {
    return sendError(res, 500, "Failed to list organizer connections", e?.message);
  }
}

export async function getOrganizerConnectionsDetail(req: Request, res: Response) {
  try {
    const detail = await service.getOrganizerConnectionsDetailForAdmin(req.params.id);
    if (!detail) return sendError(res, 404, "Organizer not found");
    return res.json(detail);
  } catch (e: any) {
    return sendError(res, 500, "Failed to get organizer connections detail", e?.message);
  }
}

export async function listVenueBookings(req: Request, res: Response) {
  try {
    const items = await service.listVenueBookingsForAdmin();
    return res.json({ data: items });
  } catch (e: any) {
    return sendError(res, 500, "Failed to list venue bookings", e?.message);
  }
}
