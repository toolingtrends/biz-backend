import { Request, Response } from "express";
import {
  listExhibitors,
  getExhibitorById,
  getExhibitorAnalytics,
  getExhibitorEvents,
} from "./exhibitors.service";

export async function getExhibitorsHandler(_req: Request, res: Response) {
  try {
    const exhibitors = await listExhibitors();
    return res.json({ exhibitors });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching exhibitors (backend):", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getExhibitorHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const exhibitor = await getExhibitorById(id);

    if (!exhibitor) {
      return res.status(404).json({ success: false, error: "Exhibitor not found" });
    }

    return res.json({ success: true, exhibitor });
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("Invalid exhibitor ID")) {
      return res.status(400).json({ success: false, error: "Invalid exhibitor ID" });
    }
    // eslint-disable-next-line no-console
    console.error("Error fetching exhibitor (backend):", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function getExhibitorAnalyticsHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const analytics = await getExhibitorAnalytics(id);

    return res.json({
      success: true,
      analytics,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching exhibitor analytics (backend):", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getExhibitorEventsHandler(req: Request, res: Response) {
  try {
    const { exhibitorId } = req.params;
    if (!exhibitorId) {
      return res.status(400).json({ error: "exhibitorId is required" });
    }

    const events = await getExhibitorEvents(exhibitorId);
    return res.status(200).json({ events });
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("exhibitorId is required")) {
      return res.status(400).json({ error: "exhibitorId is required" });
    }
    // eslint-disable-next-line no-console
    console.error("Error fetching exhibitor events (backend):", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

