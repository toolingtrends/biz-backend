import { Request, Response } from "express";
import { listSpeakers, getSpeakerById, getSpeakerEvents } from "./speakers.service";

export async function getSpeakersHandler(_req: Request, res: Response) {
  try {
    const speakers = await listSpeakers();
    return res.json({
      success: true,
      speakers,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching speakers (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

export async function getSpeakerHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const profile = await getSpeakerById(id);

    if (!profile) {
      return res.status(404).json({ success: false, error: "Speaker not found" });
    }

    return res.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching speaker (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

export async function getSpeakerEventsHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await getSpeakerEvents(id);

    return res.json(result);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching speaker events (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

