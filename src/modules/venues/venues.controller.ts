import { Request, Response } from "express";
import { listVenues, getVenueEvents } from "./venues.service";

export async function getVenuesHandler(req: Request, res: Response) {
  try {
    const search = (req.query.search as string | undefined) ?? "";
    const page = req.query.page ? Number.parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? Number.parseInt(req.query.limit as string, 10) : undefined;

    const { venues, pagination } = await listVenues({ search, page, limit });

    return res.json({
      success: true,
      data: venues,
      pagination,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching venues (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch venues",
    });
  }
}

export async function getVenueEventsHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Invalid venue ID" });
    }

    const result = await getVenueEvents(id);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("Invalid venue ID")) {
      return res.status(400).json({ success: false, error: "Invalid venue ID" });
    }
    // eslint-disable-next-line no-console
    console.error("Error fetching events by venue ID (backend):", error);
    return res.status(500).json({ success: false, error: "Server Error" });
  }
}

