import { Request, Response, Router } from "express";
import prisma from "../config/prisma";
import { requireUser } from "../middleware/auth.middleware";

const router = Router();

/**
 * GET /api/users/:id
 * Used by Next.js server to fetch any user by id (e.g. visitor dashboard).
 * Secured by X-Internal-Secret so only the Next.js app can call this.
 */
router.get("/users/:id", async (req: Request, res: Response) => {
  const secret = process.env.INTERNAL_API_SECRET;
  if (secret) {
    const provided = req.headers["x-internal-secret"];
    if (provided !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "User id required" });
  }

  try {
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
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = {
      ...user,
      interests: user.interests ?? [],
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString() ?? null,
      _count: { eventsAttended: 0, eventsOrganized: 0, connections: 0 },
    };

    return res.json({ user: userData });
  } catch (err) {
    console.error("Error fetching user by id:", err);
    return res.status(500).json({ error: "Internal server error" });
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
    return res.status(400).json({ error: "User id required" });
  }

  const auth = req.auth;
  if (!auth || auth.sub !== id) {
    return res.status(403).json({ error: "Forbidden" });
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
    return res.status(400).json({ error: "No fields to update" });
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

    const userData = {
      ...updated,
      interests: updated.interests ?? [],
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      lastLogin: updated.lastLogin?.toISOString() ?? null,
      _count: { eventsAttended: 0, eventsOrganized: 0, connections: 0 },
    };

    return res.json({ user: userData });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("Error updating user profile:", err);
    if (err.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: "Internal server error" });
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
    return res.status(400).json({ error: "User id required" });
  }

  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
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

    return res.json({ connections });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error fetching user connections:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
