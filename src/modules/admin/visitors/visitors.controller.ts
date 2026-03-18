import { Request, Response } from "express";
import { sendOne, sendError } from "../../../lib/admin-response";
import * as service from "./visitors.service";
import * as eventsSvc from "./visitor-events.service";
import * as connectionsSvc from "./visitor-connections.service";
import * as appointmentsSvc from "./visitor-appointments.service";

export async function list(req: Request, res: Response) {
  try {
    const result = await service.listVisitors(req.query as Record<string, unknown>);
    return res.status(200).json({ success: true, data: result.data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return sendError(res, 500, "Failed to list visitors", msg);
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const item = await service.getVisitorById(req.params.id);
    if (!item) return sendError(res, 404, "Visitor not found");
    return sendOne(res, item);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return sendError(res, 500, "Failed to get visitor", msg);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const item = await service.updateVisitor(req.params.id, req.body as { isActive?: boolean });
    if (!item) return sendError(res, 404, "Visitor not found");
    return sendOne(res, item);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return sendError(res, 500, "Failed to update visitor", msg);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const ok = await service.deleteVisitor(req.params.id);
    if (!ok) return sendError(res, 404, "Visitor not found");
    return res.status(200).json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return sendError(res, 500, "Failed to delete visitor", msg);
  }
}

export async function listVisitorEvents(req: Request, res: Response) {
  try {
    const data = await eventsSvc.listVisitorEventsForAdmin();
    return res.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return sendError(res, 500, "Failed to list visitor events", msg);
  }
}

export async function listVisitorConnections(req: Request, res: Response) {
  try {
    const result = await connectionsSvc.listVisitorConnectionsForAdmin(req.query as Record<string, unknown>);
    return res.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return sendError(res, 500, "Failed to list visitor connections", msg);
  }
}

export async function listVisitorAppointments(req: Request, res: Response) {
  try {
    const result = await appointmentsSvc.listVisitorAppointmentsForAdmin();
    return res.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return sendError(res, 500, "Failed to list visitor appointments", msg);
  }
}
