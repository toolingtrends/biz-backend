import prisma from "../../../config/prisma";
import { parseListQuery } from "../../../lib/admin-response";
import type { UserRole } from "@prisma/client";

const ROLE: UserRole = "VENUE_MANAGER";

async function syncLocationMasterFromVenue(input: {
  venueCountry?: unknown;
  venueState?: unknown;
  venueCity?: unknown;
}) {
  const countryName = String(input.venueCountry ?? "").trim();
  const stateName = String(input.venueState ?? "").trim();
  const cityName = String(input.venueCity ?? "").trim();
  if (!countryName) return;

  const normalizedCode = countryName.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "UNK";
  const country = await prisma.country.upsert({
    where: { name: countryName },
    update: {},
    create: {
      name: countryName,
      code: normalizedCode,
      timezone: "UTC",
      currency: "USD",
      isActive: true,
      isPermitted: false,
    },
  });
  if (stateName) {
    await (prisma as any).state.upsert({
      where: { name_countryId: { name: stateName, countryId: country.id } },
      update: {},
      create: {
        name: stateName,
        countryId: country.id,
        isActive: true,
        isPermitted: false,
      },
    });
  }

  if (!cityName || !stateName) return;

  const city = await prisma.city.findFirst({
    where: {
      countryId: country.id,
      name: { equals: cityName, mode: "insensitive" },
    },
  });
  if (!city) {
    await prisma.city.create({
      data: {
        name: cityName,
        state: stateName,
        countryId: country.id,
        timezone: country.timezone || "UTC",
        isActive: true,
        isPermitted: false,
      },
    });
  }
}

export async function listVenues(query: Record<string, unknown>) {
  const { page, limit, search, skip, sort, order } = parseListQuery(query);
  const where: any = { role: ROLE };
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { venueName: { contains: search, mode: "insensitive" } },
      { venueCity: { contains: search, mode: "insensitive" } },
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
        venueName: true,
        venueCity: true,
        venueState: true,
        venueCountry: true,
        venueAddress: true,
        maxCapacity: true,
        totalEvents: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { venueEvents: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  const data = items.map((u) => ({
    id: u.id,
    name: u.venueName || `${u.firstName || ""} ${u.lastName || ""}`.trim(),
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    venueName: u.venueName,
    venueCity: u.venueCity,
    venueState: u.venueState,
    venueCountry: u.venueCountry,
    venueAddress: u.venueAddress,
    maxCapacity: u.maxCapacity,
    totalEvents: (u._count?.venueEvents ?? 0) || (u as any).totalEvents || 0,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getVenueById(id: string) {
  const user = await prisma.user.findFirst({
    where: { id, role: ROLE },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      venueName: true,
      venueCity: true,
      venueState: true,
      venueCountry: true,
      venueAddress: true,
      maxCapacity: true,
      totalEvents: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { venueEvents: true } },
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    name: user.venueName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    venueName: user.venueName,
    venueCity: user.venueCity,
    venueState: user.venueState,
    venueCountry: user.venueCountry,
    venueAddress: user.venueAddress,
    maxCapacity: user.maxCapacity,
    totalEvents: (user._count?.venueEvents ?? 0) || (user as any).totalEvents || 0,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function createVenue(body: Record<string, unknown>) {
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) throw new Error("Email is required");
  // Prevent duplicate email across any role to avoid unique constraint error
  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) throw new Error("Venue with this email already exists");
  const user = await prisma.user.create({
    data: {
      email,
      role: ROLE,
      firstName: String(body.firstName ?? body.venueName ?? "").trim() || "Venue",
      lastName: String(body.lastName ?? "").trim() || "",
      phone: body.phone != null ? String(body.phone) : null,
      venueName: body.venueName != null ? String(body.venueName) : null,
      venueCity: body.venueCity != null ? String(body.venueCity) : null,
      venueState: body.venueState != null ? String(body.venueState) : null,
      venueCountry: body.venueCountry != null ? String(body.venueCountry) : null,
      venueAddress: body.venueAddress != null ? String(body.venueAddress) : null,
      maxCapacity: body.maxCapacity != null ? Number(body.maxCapacity) : null,
      isActive: body.isActive !== false,
    },
  });
  await syncLocationMasterFromVenue({
    venueCountry: body.venueCountry,
    venueState: body.venueState,
    venueCity: body.venueCity,
  });
  return getVenueById(user.id);
}

export async function updateVenue(id: string, body: Record<string, unknown>) {
  const existing = await prisma.user.findFirst({ where: { id, role: ROLE } });
  if (!existing) return null;
  const allowed = [
    "firstName", "lastName", "phone", "venueName", "venueCity", "venueState",
    "venueCountry", "venueAddress", "maxCapacity", "isActive",
  ];
  const data: Record<string, unknown> = {};
  for (const k of allowed) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  if (body.email !== undefined) data.email = String(body.email).trim().toLowerCase();
  await prisma.user.update({ where: { id }, data: data as any });
  await syncLocationMasterFromVenue({
    venueCountry: data.venueCountry,
    venueState: data.venueState,
    venueCity: data.venueCity,
  });
  return getVenueById(id);
}

export async function deleteVenue(id: string) {
  const existing = await prisma.user.findFirst({ where: { id, role: ROLE } });
  if (!existing) return null;
  await prisma.user.delete({ where: { id } });
  return { deleted: true };
}
