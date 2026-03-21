import { Request, Response, Router } from "express";
import prisma from "../config/prisma";
import { requireUser, optionalUser } from "../middleware/auth.middleware";
import { canUserViewOwnPrivateProfile, activePublicProfileUserWhere } from "../utils/public-profile";

const router = Router();

function serializeUser(user: any) {
  return {
    ...user,
    companyIndustry: user.companyIndustry ?? null,
    interests: user.interests ?? [],
    createdAt: user.createdAt?.toISOString?.() ?? user.createdAt,
    updatedAt: user.updatedAt?.toISOString?.() ?? user.updatedAt,
    lastLogin: user.lastLogin?.toISOString?.() ?? user.lastLogin ?? null,
    _count: { eventsAttended: 0, eventsOrganized: 0, connections: 0 },
  };
}

/** Map Prisma event (with venue, ticketTypes) to frontend dashboard shape. */
function toFrontendEvent(event: any): any {
  const venue = event?.venue;
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    shortDescription: event.shortDescription ?? "",
    startDate: event.startDate instanceof Date ? event.startDate.toISOString() : event.startDate,
    endDate: event.endDate instanceof Date ? event.endDate.toISOString() : event.endDate,
    location: venue?.venueName ?? null,
    city: venue?.venueCity ?? null,
    state: venue?.venueState ?? null,
    address: venue?.venueAddress ?? null,
    category: Array.isArray(event.category) ? event.category[0] : "Event",
    categories: event.category ?? [],
    status: event.status,
    type: Array.isArray(event.eventType) ? event.eventType[0] : "General",
    eventTypes: event.eventType ?? [],
    bannerImage: event.bannerImage ?? "",
    thumbnailImage: event.thumbnailImage ?? "",
    maxAttendees: event.maxAttendees ?? 0,
    organizer: event.organizer ?? null,
    venue: venue ?? null,
    ticketTypes: event.ticketTypes ?? [],
  };
}

/**
 * GET /api/users/search?q=...
 * User search for "Find people" / connections. Must be before /users/:id so "search" is not captured as id.
 */
router.get("/users/search", async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").trim();

  if (!q) {
    return res.json({ success: true, data: [], users: [] });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        ...activePublicProfileUserWhere(),
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
          { jobTitle: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        company: true,
        jobTitle: true,
      },
      take: 50,
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return res.json({
      success: true,
      data: users,
      users,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error searching users:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/users/:id
 * Public user profile by id (used by dashboards).
 * Private profiles return 404 unless the viewer is the same user (send Bearer token).
 */
router.get("/users/:id", optionalUser, async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res
      .status(400)
      .json({ success: false, error: "User id required" });
  }

  try {
    const viewerId = req.auth?.domain === "USER" ? req.auth.sub : undefined;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        bio: true,
        website: true,
        linkedin: true,
        twitter: true,
        instagram: true,
        company: true,
        companyIndustry: true,
        jobTitle: true,
        location: true,
        interests: true,
        isVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
        profileVisibility: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "User not found" });
    }

    if (
      !canUserViewOwnPrivateProfile(viewerId, id) &&
      (!user.isActive || user.profileVisibility === "private")
    ) {
      return res
        .status(404)
        .json({ success: false, error: "User not found" });
    }

    const { isActive: _ia, profileVisibility: _pv, ...publicUser } = user;
    const userData = serializeUser(publicUser);

    // Keep legacy { user } shape for frontend compatibility, but also expose
    // { success, data } for new consumers.
    return res.json({
      success: true,
      data: userData,
      user: userData,
    });
  } catch (err) {
    console.error("Error fetching user by id:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

/**
 * PUT /api/users/:id
 * Update basic user profile fields (self-service).
 * Protected by JWT via requireUser; only the user themself can update.
 */
router.put("/users/:id", requireUser, async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, error: "User id required" });
  }

  const auth = req.auth;
  if (!auth || auth.sub !== id) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  const {
    email,
    firstName,
    lastName,
    avatar,
    phone,
    bio,
    website,
    company,
    companyIndustry,
    jobTitle,
    linkedin,
    twitter,
    instagram,
    interests,
  } = req.body ?? {};

  const data: any = {};

  if (email !== undefined) data.email = email;
  if (firstName !== undefined) data.firstName = firstName;
  if (lastName !== undefined) data.lastName = lastName;
  if (avatar !== undefined) data.avatar = avatar;
  if (phone !== undefined) data.phone = phone;
  if (bio !== undefined) data.bio = bio;
  if (website !== undefined) data.website = website;
  if (company !== undefined) data.company = company;
  if (companyIndustry !== undefined) data.companyIndustry = companyIndustry;
  if (jobTitle !== undefined) data.jobTitle = jobTitle;
  if (linkedin !== undefined) data.linkedin = linkedin;
  if (twitter !== undefined) data.twitter = twitter;
  if (instagram !== undefined) data.instagram = instagram;
  if (interests !== undefined) {
    data.interests = Array.isArray(interests) ? interests : [];
  }

  if (Object.keys(data).length === 0) {
    return res
      .status(400)
      .json({ success: false, error: "No fields to update" });
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        bio: true,
        website: true,
        linkedin: true,
        twitter: true,
        instagram: true,
        company: true,
        companyIndustry: true,
        jobTitle: true,
        location: true,
        interests: true,
        isVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const userData = serializeUser(updated);

    return res.json({
      success: true,
      data: userData,
      user: userData,
    });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("Error updating user profile:", err);
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, error: "User not found" });
    }
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/users/:id/connections
 * Lightweight "connections" list used by dashboards (messaging sidebar, etc.).
 * Currently returns a curated list of active users (excluding self).
 */
router.get("/users/:id/connections", async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, error: "User id required" });
  }

  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "User not found" });
    }

    const others = await prisma.user.findMany({
      where: {
        AND: [{ id: { not: id } }, { isActive: true }],
      } as any,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        role: true,
        company: true,
        jobTitle: true,
        lastLogin: true,
      },
      orderBy: [
        { lastLogin: "desc" as const },
        { firstName: "asc" as const },
      ],
      take: 100,
    });

    const connections = others.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      avatar: u.avatar || "/placeholder.svg?height=40&width=40",
      role: u.role,
      company: u.company || "No Company",
      jobTitle: u.jobTitle || "No Title",
      lastLogin: u.lastLogin?.toISOString() ?? new Date().toISOString(),
      isOnline: false,
    }));

    return res.json({
      success: true,
      data: connections,
      connections,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error fetching user connections:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/users/:id/interested-events
 * Used by calendar, past-events, and events-section to show a user's saved (interested) events.
 */
router.get(
  "/users/:id/interested-events",
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "User id required" });
    }

    try {
      const saved = await prisma.savedEvent.findMany({
        where: { userId: id },
        include: {
          event: {
            include: {
              ticketTypes: true,
              venue: true,
              organizer: true,
            },
          },
        },
        orderBy: { savedAt: "desc" },
      });

      const rawEvents = saved
        .map((s) => s.event)
        .filter((e): e is NonNullable<typeof e> => Boolean(e));
      const events = rawEvents.map((e) => toFrontendEvent(e));

      return res.json({
        success: true,
        data: events,
        events,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error fetching interested events:", err);
      return res
        .status(500)
        .json({ success: false, error: "Internal server error" });
    }
  }
);

/**
 * GET /api/users/:id/saved-events
 * Saved events (wishlist) timeline in visitor dashboard. JWT required; user can only fetch own list.
 */
router.get("/users/:id/saved-events", requireUser, async (req: Request, res: Response) => {
  const { id } = req.params;
  const auth = req.auth;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, error: "User id required" });
  }
  if (!auth || auth.sub !== id) {
    return res
      .status(403)
      .json({ success: false, error: "You can only view your own saved events" });
  }

  try {
    const saved = await prisma.savedEvent.findMany({
      where: { userId: id },
      include: {
        event: {
          include: {
            ticketTypes: true,
            venue: true,
            organizer: true,
          },
        },
      },
      orderBy: { savedAt: "desc" },
    });

    const rawEvents = saved
      .map((s) => s.event)
      .filter((e): e is NonNullable<typeof e> => Boolean(e));
    const events = rawEvents.map((e) => toFrontendEvent(e));

    return res.json({
      success: true,
      data: events,
      events,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error fetching saved events:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/users/:id/events
 * Generic events list for a user – for now this mirrors "interested events".
 */
router.get("/users/:id/events", async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, error: "User id required" });
  }

  try {
    const registrations = await prisma.eventRegistration.findMany({
      where: { userId: id },
      include: {
        event: {
          include: {
            ticketTypes: true,
          },
        },
      },
      orderBy: { registeredAt: "desc" },
    });

    const events = registrations
      .map((r) => r.event)
      .filter((e): e is NonNullable<typeof e> => Boolean(e));

    return res.json({
      success: true,
      data: events,
      events,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error fetching user events:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/users/:id/appointments
 * Visitor "My Appointments" – currently stubbed until Appointment model exists.
 */
router.get("/users/:id/appointments", async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, error: "User id required" });
  }

  try {
    // TODO: implement real visitor appointments once Appointment model exists.
    const appointments: any[] = [];

    return res.json({
      success: true,
      data: appointments,
      appointments,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error fetching user appointments:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/users/:id/messages
 * Basic stub so visitor messaging UI does not crash.
 */
router.get("/users/:id/messages", async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, error: "User id required" });
  }

  try {
    // TODO: back this with a Message model/conversation system.
    const messages: any[] = [];
    return res.json({
      success: true,
      data: messages,
      messages,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error fetching user messages:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

/**
 * POST /api/users/:id/messages
 * Stub create endpoint – echoes the payload for now.
 */
router.post("/users/:id/messages", async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, error: "User id required" });
  }

  try {
    const body = req.body ?? {};
    const message = {
      id: "stub-message-id",
      userId: id,
      ...body,
      createdAt: new Date().toISOString(),
    };

    return res.status(201).json({
      success: true,
      data: message,
      message,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error creating user message:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/notifications
 * Global notifications feed for the current user – stubbed for now.
 */
router.get("/notifications", async (_req: Request, res: Response) => {
  try {
    const notifications: any[] = [];
    return res.json({
      success: true,
      data: notifications,
      notifications,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error fetching notifications:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/settings
 * Backend counterpart to user settings – returns safe defaults.
 */
router.get("/settings", async (req: Request, res: Response) => {
  try {
    const auth = req.auth;
    const userId = auth?.sub;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "User not found" });
    }

    const settings = {
      profileVisibility: "public",
      phoneNumber: user.phone ?? "",
      email: user.email ?? "",
      introduceMe: true,
      emailNotifications: true,
      eventReminders: true,
      newMessages: true,
      connectionRequests: true,
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      role: user.role,
    };

    return res.json({
      success: true,
      data: settings,
      settings,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error fetching settings (backend):", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

/**
 * PATCH /api/settings
 * Stub update – echoes merged settings back to the client.
 */
router.patch("/settings", async (req: Request, res: Response) => {
  try {
    const auth = req.auth;
    const userId = auth?.sub;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "User not found" });
    }

    const base = {
      profileVisibility: "public",
      phoneNumber: user.phone ?? "",
      email: user.email ?? "",
      introduceMe: true,
      emailNotifications: true,
      eventReminders: true,
      newMessages: true,
      connectionRequests: true,
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      role: user.role,
    };

    const body = req.body ?? {};
    const merged = {
      ...base,
      ...body,
    };

    return res.json({
      success: true,
      data: merged,
      settings: merged,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error updating settings (backend):", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

export default router;
