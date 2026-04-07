import { Request, Response } from "express";
import {
  listConferencesByEvent,
  getConferenceById,
  createConference,
  updateConference,
  deleteConference,
} from "./conferences.service";

export async function listConferencesHandler(req: Request, res: Response) {
  try {
    const eventId = req.query.eventId as string | undefined;
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }
    const conferences = await listConferencesByEvent(eventId);
    return res.json(conferences);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("Error listing conferences:", err);
    return res.status(500).json({ error: "Failed to fetch conferences" });
  }
}

export async function getConferenceHandler(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const conference = await getConferenceById(id);
    if (!conference) {
      return res.status(404).json({ error: "Conference not found" });
    }
    return res.json(conference);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching conference:", err);
    return res.status(500).json({ error: "Failed to fetch conference" });
  }
}

export async function createConferenceHandler(req: Request, res: Response) {
  try {
    const conference = await createConference(req.body ?? {});
    return res.status(201).json(conference);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("Error creating conference:", err);
    const message = err instanceof Error ? err.message : "Failed to create conference";
    if (message.includes("not found") || message.includes("Event not found")) {
      return res.status(404).json({ error: message });
    }
    if (message.includes("Missing required")) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
}

export async function updateConferenceHandler(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const conference = await updateConference(id, req.body ?? {});
    return res.json(conference);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("Error updating conference:", err);
    const message = err instanceof Error ? err.message : "Failed to update conference";
    if (message.includes("not found") || message.includes("Conference not found")) {
      return res.status(404).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
}

export async function deleteConferenceHandler(req: Request, res: Response) {
  try {
    const id = req.params.id;
    await deleteConference(id);
    return res.json({ message: "Conference deleted successfully" });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("Error deleting conference:", err);
    const message = err instanceof Error ? err.message : "Failed to delete conference";
    if (message.includes("not found") || message.includes("Conference not found")) {
      return res.status(404).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
}
