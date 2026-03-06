import { Request, Response } from "express";
import {
  adminListEvents,
  adminGetEventById,
  adminUpdateEvent,
  adminDeleteEvent,
  adminApproveEvent,
  adminRejectEvent,
  adminListVenues,
  adminListVisitors,
  adminGetDashboardSummary,
} from "./admin.service";

export async function adminGetEventsHandler(req: Request, res: Response) {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const status = (req.query.status as string | undefined) ?? undefined;

    const result = await adminListEvents({ page, limit, status });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Admin get events error (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch events",
      details: error.message,
    });
  }
}

export async function adminGetEventByIdHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const event = await adminGetEventById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    return res.json({
      success: true,
      data: event,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Admin get event by id error (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch event",
      details: error.message,
    });
  }
}

export async function adminUpdateEventHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await adminUpdateEvent(id, req.body ?? {});

    if ("error" in result && result.error === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    return res.json({
      success: true,
      data: result.event,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Admin update event error (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update event",
      details: error.message,
    });
  }
}

export async function adminDeleteEventHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await adminDeleteEvent(id);

    if ("error" in result && result.error === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    return res.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Admin delete event error (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete event",
      details: error.message,
    });
  }
}

export async function adminApproveEventHandler(req: Request, res: Response) {
  try {
    const auth = req.auth!;
    const { eventId } = req.body as { eventId?: string };

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: "eventId is required",
      });
    }

    const result = await adminApproveEvent(eventId, auth.sub);

    if ("error" in result && result.error === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    return res.json({
      success: true,
      data: result.event,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Admin approve event error (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to approve event",
      details: error.message,
    });
  }
}

export async function adminRejectEventHandler(req: Request, res: Response) {
  try {
    const auth = req.auth!;
    const { eventId, reason } = req.body as { eventId?: string; reason?: string };

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: "eventId is required",
      });
    }

    const result = await adminRejectEvent(eventId, auth.sub, reason);

    if ("error" in result && result.error === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    return res.json({
      success: true,
      data: result.event,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Admin reject event error (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to reject event",
      details: error.message,
    });
  }
}

export async function adminGetVenuesHandler(_req: Request, res: Response) {
  try {
    const venues = await adminListVenues();

    return res.json({
      success: true,
      data: {
        venues,
        total: venues.length,
      },
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Admin get venues error (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch venues",
      details: error.message,
    });
  }
}

export async function adminGetVisitorsHandler(_req: Request, res: Response) {
  try {
    const visitors = await adminListVisitors();

    return res.json({
      success: true,
      data: {
        visitors,
        total: visitors.length,
      },
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Admin get visitors error (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch visitors",
      details: error.message,
    });
  }
}

export async function adminGetDashboardHandler(_req: Request, res: Response) {
  try {
    const summary = await adminGetDashboardSummary();

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Admin get dashboard error (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard data",
      details: error.message,
    });
  }
}

