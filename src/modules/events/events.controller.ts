import { Request, Response } from "express";
import {
  listEvents,
  getEventByIdentifier,
  getFeaturedEvents,
  getCategoryStats,
  getEventStats,
  searchEntities,
  saveEvent,
  unsaveEvent,
  isEventSaved,
  getEventPromotions,
  createPromotion,
  listRecentEvents,
  listVipEvents,
  listEventLeads,
  listEventExhibitors,
  listEventSpeakers,
  getEventBrochureAndDocuments,
  updateEventLayoutPlan,
  listEventSpaceCosts,
} from "./events.service";
import { createEventAdmin } from "./events-writes.service";

export async function getEventsHandler(req: Request, res: Response) {
  try {
    const {
      page,
      limit,
      category,
      search,
      location,
      startDate,
      endDate,
      featured,
      sort,
      verified,
      stats,
    } = req.query;

    // If stats=true, return category stats (backward-compatible behavior)
    if (stats === "true") {
      const data = await getCategoryStats();
      return res.json({
        success: true,
        ...data,
      });
    }

    const pageNum = page ? parseInt(page as string, 10) : undefined;
    const limitNum = limit ? parseInt(limit as string, 10) : undefined;

    const result = await listEvents({
      page: pageNum,
      limit: limitNum,
      category: (category as string | undefined) ?? null,
      search: (search as string | undefined) ?? "",
      location: (location as string | undefined) ?? null,
      startDate: (startDate as string | undefined) ?? null,
      endDate: (endDate as string | undefined) ?? null,
      featured: featured === "true",
      sort: (sort as string | undefined) ?? "newest",
      verified: verified === "true",
    });

    return res.json({
      success: true,
      events: result.events,
      pagination: result.pagination,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching events (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch events",
      details: error.message,
    });
  }
}

export async function getEventByIdHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const event = await getEventByIdentifier(id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Note: we don't set cache headers here; that can be done at gateway/proxy level
    return res.json(event);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching event (backend):", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getFeaturedEventsHandler(_req: Request, res: Response) {
  try {
    const events = await getFeaturedEvents();
    return res.json(events);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch featured events (backend):", error);
    return res.status(500).json({ error: "Failed to fetch featured events" });
  }
}

export async function getRecentEventsHandler(_req: Request, res: Response) {
  try {
    const events = await listRecentEvents(10);
    return res.json(events);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch recent events (backend):", error);
    return res.status(500).json({ error: "Failed to fetch recent events" });
  }
}

export async function getVipEventsHandler(_req: Request, res: Response) {
  try {
    const events = await listVipEvents(10);
    return res.json(events);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch VIP events (backend):", error);
    return res.status(500).json({ error: "Failed to fetch VIP events" });
  }
}

// ----- Event sub-resources -----

export async function getEventLeadsHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const leads = await listEventLeads(id);
    return res.json({
      success: true,
      data: {
        leads,
      },
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching event leads (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch event leads",
      details: error.message,
    });
  }
}

export async function getEventExhibitorsHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const exhibitors = await listEventExhibitors(id);
    return res.json({
      success: true,
      data: {
        exhibitors,
      },
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching event exhibitors (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch event exhibitors",
      details: error.message,
    });
  }
}

export async function getEventSpeakersHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const speakers = await listEventSpeakers(id);
    return res.json({
      success: true,
      data: {
        speakers,
      },
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching event speakers (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch event speakers",
      details: error.message,
    });
  }
}

export async function getEventBrochureHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const event = await getEventBrochureAndDocuments(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }
    return res.json({
      success: true,
      data: {
        eventId: event.id,
        brochure: event.brochure,
        documents: event.documents,
      },
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching event brochure (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch event brochure",
      details: error.message,
    });
  }
}

export async function updateEventLayoutHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { layoutPlan } = req.body as { layoutPlan?: string | null };

    if (layoutPlan !== null && typeof layoutPlan !== "string") {
      return res.status(400).json({
        success: false,
        error: "layoutPlan must be a string or null",
      });
    }

    const updated = await updateEventLayoutPlan(id, layoutPlan ?? null);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error updating event layout (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update event layout",
      details: error.message,
    });
  }
}

export async function deleteEventLayoutHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updated = await updateEventLayoutPlan(id, null);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error deleting event layout (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete event layout",
      details: error.message,
    });
  }
}

export async function getEventSpaceCostsHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const spaces = await listEventSpaceCosts(id);
    return res.json({
      success: true,
      data: {
        spaces,
      },
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching event space costs (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch event space costs",
      details: error.message,
    });
  }
}

export async function getEventsStatsHandler(req: Request, res: Response) {
  try {
    const include = (req.query.include as string | undefined) ?? "";
    const includes = include ? include.split(",") : [];

    const includeCategories = includes.length === 0 || includes.includes("categories");
    const includeCities = includes.includes("cities");
    const includeCountries = includes.includes("countries");

    const result = await getEventStats({
      includeCategories,
      includeCities,
      includeCountries,
    });

    return res.json(result);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Error fetching stats (backend):", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch stats",
      details: error.message,
    });
  }
}

export async function searchHandler(req: Request, res: Response) {
  try {
    const q = (req.query.q as string | undefined) ?? "";
    const limit = req.query.limit ? Number(req.query.limit) : 5;

    const result = await searchEntities(q, limit);

    return res.json(result);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Search API error (backend):", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ----- Write handlers (requireUser for save/promotions) -----

export async function saveEventHandler(req: Request, res: Response) {
  try {
    const auth = req.auth!;
    if (auth.domain !== "USER") {
      return res.status(403).json({ error: "Only user accounts can save events" });
    }
    const userId = auth.sub;
    const eventId = req.params.id!;
    const result = await saveEvent(userId, eventId);
    if ("error" in result && result.error === "NOT_FOUND") {
      return res.status(404).json({ error: "Event not found" });
    }
    if ("alreadySaved" in result && result.alreadySaved) {
      return res.json({ message: "Event already saved", saved: true });
    }
    return res.json({
      message: "Event saved successfully",
      savedEvent: result.savedEvent,
    });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("Save event error (backend):", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function unsaveEventHandler(req: Request, res: Response) {
  try {
    const auth = req.auth!;
    if (auth.domain !== "USER") {
      return res.status(403).json({ error: "Only user accounts can unsave events" });
    }
    const userId = auth.sub;
    const eventId = req.params.id!;
    await unsaveEvent(userId, eventId);
    return res.json({ message: "Event removed from saved" });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("Unsave event error (backend):", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function isEventSavedHandler(req: Request, res: Response) {
  try {
    const auth = req.auth!;
    if (auth.domain !== "USER") {
      return res.json({ isSaved: false });
    }
    const userId = auth.sub;
    const eventId = req.params.id!;
    const saved = await isEventSaved(userId, eventId);
    return res.json({ isSaved: saved });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("Is event saved error (backend):", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getEventPromotionsHandler(req: Request, res: Response) {
  try {
    const eventId = req.params.id!;
    const data = await getEventPromotions(eventId);
    if (!data) {
      return res.status(404).json({ error: "Event not found" });
    }
    return res.json(data);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("Get event promotions error (backend):", err);
    return res.status(500).json({ error: "Failed to fetch promotion data" });
  }
}

export async function createPromotionHandler(req: Request, res: Response) {
  try {
    const eventId = req.params.id!;
    const body = req.body as {
      packageType?: string;
      targetCategories?: string[];
      amount?: number;
      duration?: number;
    };
    const packageType = body.packageType ?? "";
    const targetCategories = Array.isArray(body.targetCategories) ? body.targetCategories : [];
    const amount = Number(body.amount) || 0;
    const duration = Number(body.duration) || 0;
    const result = await createPromotion(eventId, {
      packageType,
      targetCategories,
      amount,
      duration,
    });
    if ("error" in result && result.error === "NOT_FOUND") {
      return res.status(404).json({ error: "Event not found" });
    }
    return res.status(201).json(result.promotion);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("Create promotion error (backend):", err);
    return res.status(500).json({ error: "Failed to create promotion" });
  }
}

export async function createEventAdminHandler(req: Request, res: Response) {
  try {
    const auth = req.auth!;
    if (auth.domain !== "ADMIN" || (auth.role !== "SUPER_ADMIN" && auth.role !== "SUB_ADMIN")) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const result = await createEventAdmin({
      body: req.body,
      adminId: auth.sub,
      adminType: auth.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "SUB_ADMIN",
      ipAddress: req.headers["x-forwarded-for"] as string ?? req.socket?.remoteAddress,
      userAgent: req.headers["user-agent"],
    });
    if ("error" in result) {
      if (result.error === "MISSING_FIELDS") {
        return res.status(400).json({
          error: `Missing required fields: ${(result.missing ?? []).join(", ")}`,
        });
      }
      if (result.error === "ORGANIZER_REQUIRED") {
        return res.status(400).json({
          error: "organizerId or organizerEmail/organizerName is required",
        });
      }
      return res.status(400).json({ error: "Bad request" });
    }
    return res.status(201).json({
      success: result.success,
      message: result.message,
      event: result.event,
    });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("Create event (admin) error (backend):", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: err?.message,
    });
  }
}

