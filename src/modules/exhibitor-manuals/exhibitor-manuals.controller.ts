import { Request, Response } from "express";
import * as service from "./exhibitor-manuals.service";

export async function getByIdHandler(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const doc = await service.getById(id);
    if (!doc) return res.status(404).json({ error: "Exhibitor manual not found" });
    return res.json({ success: true, data: doc });
  } catch (e: any) {
    console.error("Exhibitor manual get error:", e);
    return res.status(500).json({ error: e?.message ?? "Failed to get exhibitor manual" });
  }
}

export async function listHandler(req: Request, res: Response) {
  try {
    const eventId = req.query.eventId as string | undefined;
    if (!eventId) {
      return res.status(400).json({ error: "eventId is required" });
    }
    const list = await service.listByEventId(eventId);
    return res.json({ success: true, data: list });
  } catch (e: any) {
    console.error("Exhibitor manuals list error:", e);
    return res.status(500).json({ error: e?.message ?? "Failed to list exhibitor manuals" });
  }
}

export async function createHandler(req: Request, res: Response) {
  try {
    const doc = await service.create(req.body ?? {});
    return res.status(201).json({ success: true, data: doc });
  } catch (e: any) {
    if (e?.message === "Event not found" || e?.message === "User not found") {
      return res.status(404).json({ error: e.message });
    }
    if (e?.message?.includes("Missing required")) {
      return res.status(400).json({ error: e.message });
    }
    console.error("Exhibitor manual create error:", e);
    return res.status(500).json({ error: e?.message ?? "Failed to create exhibitor manual" });
  }
}

export async function deleteHandler(req: Request, res: Response) {
  try {
    const id = req.params.id;
    await service.remove(id);
    return res.json({ success: true });
  } catch (e: any) {
    if (e?.message === "Exhibitor manual not found") {
      return res.status(404).json({ error: e.message });
    }
    console.error("Exhibitor manual delete error:", e);
    return res.status(500).json({ error: e?.message ?? "Failed to delete" });
  }
}

export async function updateHandler(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const doc = await service.update(id, req.body ?? {});
    return res.json({ success: true, data: doc });
  } catch (e: any) {
    if (e?.message === "Exhibitor manual not found") {
      return res.status(404).json({ error: e.message });
    }
    console.error("Exhibitor manual update error:", e);
    return res.status(500).json({ error: e?.message ?? "Failed to update" });
  }
}
