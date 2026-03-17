import prisma from "../../../config/prisma";
import { parseListQuery } from "../../../lib/admin-response";
import type { UserRole } from "@prisma/client";

const ROLE: UserRole = "ORGANIZER";

export async function listOrganizers(query: Record<string, unknown>) {
  const { page, limit, search, skip, sort, order } = parseListQuery(query);
  const where: any = { role: ROLE };
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort]: order },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        company: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        totalEvents: true,
        activeEvents: true,
      },
    }),
    prisma.user.count({ where }),
  ]);
  const data = items.map((u) => ({
    id: u.id,
    name: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    company: u.company,
    isActive: u.isActive,
    totalEvents: u.totalEvents,
    activeEvents: u.activeEvents,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getOrganizerById(id: string) {
  const user = await prisma.user.findFirst({
    where: { id, role: ROLE },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      company: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      totalEvents: true,
      activeEvents: true,
      description: true,
      website: true,
    },
  });
  if (!user) return null;
  return {
    ...user,
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function createOrganizer(body: Record<string, unknown>) {
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) throw new Error("Email is required");
  const existing = await prisma.user.findFirst({ where: { email, role: ROLE } });
  if (existing) throw new Error("Organizer with this email already exists");
  const user = await prisma.user.create({
    data: {
      email,
      role: ROLE,
      firstName: String(body.firstName ?? "").trim() || "Organizer",
      lastName: String(body.lastName ?? "").trim() || "",
      phone: body.phone != null ? String(body.phone) : null,
      company: body.company != null ? String(body.company) : null,
      isActive: body.isActive !== false,
    },
  });
  return getOrganizerById(user.id);
}

export async function updateOrganizer(id: string, body: Record<string, unknown>) {
  const existing = await prisma.user.findFirst({ where: { id, role: ROLE } });
  if (!existing) return null;
  const allowed = ["firstName", "lastName", "phone", "company", "isActive", "description", "website"];
  const data: Record<string, unknown> = {};
  for (const k of allowed) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  if (body.email !== undefined) data.email = String(body.email).trim().toLowerCase();
  await prisma.user.update({ where: { id }, data: data as any });
  return getOrganizerById(id);
}

export async function deleteOrganizer(id: string) {
  const existing = await prisma.user.findFirst({ where: { id, role: ROLE } });
  if (!existing) return null;
  await prisma.user.delete({ where: { id } });
  return { deleted: true };
}

// ---------- Organizer followers / connections (admin dashboard) ----------

type AdminOrganizerConnectionSummary = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatar: string | null;
  organizationName: string | null;
  totalFollowers: number;
  totalEvents: number;
  activeEvents: number;
  createdAt: string;
};

type AdminOrganizerFollower = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatar: string | null;
  role: string;
  followedAt: string;
};

export async function listOrganizerConnectionsForAdmin(): Promise<AdminOrganizerConnectionSummary[]> {
  const organizers = await prisma.user.findMany({
    where: { role: ROLE },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
      organizationName: true,
      createdAt: true,
    },
  });

  const followModel = (prisma as any).follow as {
    count: (args: any) => Promise<number>;
  };

  const withStats: AdminOrganizerConnectionSummary[] = [];

  const now = new Date();

  for (const org of organizers) {
    let followersCount = 0;
    if (followModel) {
      followersCount = await followModel.count({
        where: { followingId: org.id },
      });
    }

    const [totalEvents, activeEvents] = await Promise.all([
      prisma.event.count({ where: { organizerId: org.id } }),
      prisma.event.count({
        where: {
          organizerId: org.id,
          status: "PUBLISHED",
          endDate: { gte: now },
        },
      }),
    ]);

    withStats.push({
      id: org.id,
      firstName: org.firstName,
      lastName: org.lastName,
      email: org.email ?? "",
      avatar: org.avatar,
      organizationName: org.organizationName ?? null,
      totalFollowers: followersCount,
      totalEvents,
      activeEvents,
      createdAt: org.createdAt.toISOString(),
    });
  }

  return withStats;
}

export async function getOrganizerConnectionsDetailForAdmin(
  organizerId: string,
): Promise<{ organizer: AdminOrganizerConnectionSummary; followers: AdminOrganizerFollower[] } | null> {
  const organizer = await prisma.user.findFirst({
    where: { id: organizerId, role: ROLE },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
      organizationName: true,
      createdAt: true,
    },
  });

  if (!organizer) return null;

  const [totalEvents, activeEvents] = await Promise.all([
    prisma.event.count({ where: { organizerId: organizer.id } }),
    prisma.event.count({
      where: {
        organizerId: organizer.id,
        status: "PUBLISHED",
        endDate: { gte: new Date() },
      },
    }),
  ]);

  const followModel = (prisma as any).follow as {
    findMany: (args: any) => Promise<any[]>;
    count: (args: any) => Promise<number>;
  };

  const followersRaw = followModel
    ? await followModel.findMany({
        where: { followingId: organizer.id },
        include: {
          follower: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const followers: AdminOrganizerFollower[] = followersRaw
    .filter((f: any) => !!f.follower)
    .map((f: any) => ({
      id: f.follower.id,
      firstName: f.follower.firstName,
      lastName: f.follower.lastName,
      email: f.follower.email ?? "",
      avatar: f.follower.avatar,
      role: String(f.follower.role),
      followedAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : String(f.createdAt),
    }));

  const followersCount = followers.length;

  const organizerSummary: AdminOrganizerConnectionSummary = {
    id: organizer.id,
    firstName: organizer.firstName,
    lastName: organizer.lastName,
    email: organizer.email ?? "",
    avatar: organizer.avatar,
    organizationName: organizer.organizationName ?? null,
    totalFollowers: followersCount,
    totalEvents,
    activeEvents,
    createdAt: organizer.createdAt.toISOString(),
  };

  return { organizer: organizerSummary, followers };
}

// ---------- Venue bookings (admin dashboard) ----------

export type AdminVenueBookingItem = {
  id: string;
  venue: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    venueName: string | null;
    venueAddress: string | null;
    venueCity: string | null;
  };
  visitor?: { id: string; firstName: string | null; lastName: string | null; email: string | null };
  startDate: string;
  endDate: string;
  totalAmount: number;
  currency: string;
  status: string;
  purpose: string | null;
  specialRequests: string;
  meetingSpacesInterested: string[];
  requestedTime: string;
  duration: number;
  createdAt: string;
};

export async function listVenueBookingsForAdmin(): Promise<AdminVenueBookingItem[]> {
  const appointments = await prisma.venueAppointment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      venue: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          venueName: true,
          venueAddress: true,
          venueCity: true,
        },
      },
      visitor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return appointments.map((a) => {
    const start = new Date(a.requestedDate);
    const end = new Date(start.getTime() + (a.duration ?? 30) * 60 * 1000);
    return {
      id: a.id,
      venue: {
        id: a.venue.id,
        firstName: a.venue.firstName,
        lastName: a.venue.lastName,
        venueName: a.venue.venueName ?? null,
        venueAddress: a.venue.venueAddress ?? null,
        venueCity: a.venue.venueCity ?? null,
      },
      visitor: a.visitor
        ? {
            id: a.visitor.id,
            firstName: a.visitor.firstName,
            lastName: a.visitor.lastName,
            email: a.visitor.email ?? null,
          }
        : undefined,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalAmount: 0,
      currency: "USD",
      status: a.status,
      purpose: a.purpose ?? null,
      specialRequests: a.notes ?? "",
      meetingSpacesInterested: [],
      requestedTime: a.requestedTime,
      duration: a.duration ?? 30,
      createdAt: a.createdAt.toISOString(),
    };
  });
}
