import prisma from "../../../config/prisma";
import { parseListQuery } from "../../../lib/admin-response";
import type { UserRole } from "@prisma/client";

const ROLE: UserRole = "EXHIBITOR";

export async function listExhibitors(query: Record<string, unknown>) {
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
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getExhibitorById(id: string) {
  const user = await prisma.user.findFirst({
    where: { id, role: ROLE },
  });
  if (!user) return null;
  return {
    id: user.id,
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    company: user.company,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function createExhibitor(body: Record<string, unknown>) {
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) throw new Error("Email is required");
  const existing = await prisma.user.findFirst({ where: { email, role: ROLE } });
  if (existing) throw new Error("Exhibitor with this email already exists");
  const user = await prisma.user.create({
    data: {
      email,
      role: ROLE,
      firstName: String(body.firstName ?? "").trim() || "Exhibitor",
      lastName: String(body.lastName ?? "").trim() || "",
      phone: body.phone != null ? String(body.phone) : null,
      company: body.company != null ? String(body.company) : null,
      isActive: body.isActive !== false,
    },
  });
  return getExhibitorById(user.id);
}

export async function updateExhibitor(id: string, body: Record<string, unknown>) {
  const existing = await prisma.user.findFirst({ where: { id, role: ROLE } });
  if (!existing) return null;
  const allowed = ["firstName", "lastName", "phone", "company", "isActive"];
  const data: Record<string, unknown> = {};
  for (const k of allowed) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  if (body.email !== undefined) data.email = String(body.email).trim().toLowerCase();
  await prisma.user.update({ where: { id }, data: data as any });
  return getExhibitorById(id);
}

export async function deleteExhibitor(id: string) {
  const existing = await prisma.user.findFirst({ where: { id, role: ROLE } });
  if (!existing) return null;
  await prisma.user.delete({ where: { id } });
  return { deleted: true };
}

export async function getExhibitorStats() {
  const [total, active] = await Promise.all([
    prisma.user.count({ where: { role: ROLE } }),
    prisma.user.count({ where: { role: ROLE, isActive: true } }),
  ]);
  return { total, active };
}

// ---------- Exhibitor feedback (admin dashboard: organizer feedback page) ----------

export type AdminExhibitorFeedbackItem = {
  id: string;
  organizer: { id: string; name: string; email: string };
  exhibitor: { id: string; name: string; email: string };
  event: { id: string | null; title: string | null };
  rating: number;
  title: string | null;
  comment: string | null;
  isApproved: boolean;
  isPublic: boolean;
  createdAt: string;
};

export async function listExhibitorFeedbackForAdmin(): Promise<AdminExhibitorFeedbackItem[]> {
  const reviews = await prisma.review.findMany({
    where: { exhibitorId: { not: null } },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      event: {
        select: {
          id: true,
          title: true,
          organizerId: true,
          organizer: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  });

  const exhibitorIds = [...new Set(reviews.map((r) => r.exhibitorId).filter(Boolean) as string[])];
  const exhibitors =
    exhibitorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: exhibitorIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];
  const exhibitorMap = new Map(exhibitors.map((e) => [e.id, e]));

  const name = (first: string | null, last: string | null, fallback: string) =>
    `${first ?? ""} ${last ?? ""}`.trim() || fallback;

  return reviews.map((r) => {
    const organizer = r.event?.organizer;
    const exhibitor = r.exhibitorId ? exhibitorMap.get(r.exhibitorId) : null;
    return {
      id: r.id,
      organizer: organizer
        ? {
            id: organizer.id,
            name: name(organizer.firstName, organizer.lastName, "Organizer"),
            email: organizer.email ?? "",
          }
        : { id: "", name: "—", email: "" },
      exhibitor: exhibitor
        ? {
            id: exhibitor.id,
            name: name(exhibitor.firstName, exhibitor.lastName, "Exhibitor"),
            email: exhibitor.email ?? "",
          }
        : { id: r.exhibitorId ?? "", name: "—", email: "" },
      event: r.event
        ? { id: r.event.id, title: r.event.title }
        : { id: null, title: null },
      rating: r.rating ?? 0,
      title: null,
      comment: r.comment ?? null,
      isApproved: true,
      isPublic: true,
      createdAt: r.createdAt.toISOString(),
    };
  });
}
