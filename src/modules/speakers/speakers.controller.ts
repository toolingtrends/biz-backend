import { Request, Response } from "express";
import {
  listSpeakers,
  getSpeakerById,
  getSpeakerEvents,
  getSpeakerSessions,
  updateSpeakerProfile,
  createSpeaker,
} from "./speakers.service";
import { requireUser, optionalUser } from "../../middleware/auth.middleware";

export async function getSpeakersHandler(req: Request, res: Response) {
  try {
    const requireProfileImage =
      req.query.requireProfileImage === "1" || req.query.requireProfileImage === "true";
    const speakers = await listSpeakers({ requireProfileImage });
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
    const viewerId = req.auth?.domain === "USER" ? req.auth.sub : undefined;
    const profile = await getSpeakerById(id, viewerId);

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
    const viewerId = req.auth?.domain === "USER" ? req.auth.sub : undefined;
    const result = await getSpeakerEvents(id, viewerId);

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

export async function getSpeakerSessionsHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Speaker ID required" });
    }
    const sessions = await getSpeakerSessions(id);
    return res.json({ success: true, sessions });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching speaker sessions (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

export async function putSpeakerHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const auth = req.auth;
    if (!auth || auth.sub !== id) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    const profile = await updateSpeakerProfile(id, req.body ?? {});
    if (!profile) {
      return res.status(404).json({ success: false, error: "Speaker not found" });
    }
    return res.json({
      success: true,
      profile,
      message: "Speaker updated successfully",
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error updating speaker (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

export async function postSpeakerHandler(req: Request, res: Response) {
  try {
    const speaker = await createSpeaker(req.body ?? {});
    return res.status(201).json({
      success: true,
      speaker,
      message: "Speaker created successfully",
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error creating speaker (backend):", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg.includes("already exists")) {
      return res.status(409).json({ success: false, error: msg });
    }
    if (msg.includes("required")) {
      return res.status(400).json({ success: false, error: msg });
    }
    return res.status(500).json({ success: false, error: msg });
  }
}

