import type { AdminContentType, Prisma } from "@prisma/client";
import prisma from "../../../config/prisma";

const bannerSelect = {
  id: true,
  title: true,
  published: true,
  sortOrder: true,
  extras: true,
  createdAt: true,
  updatedAt: true,
} as const;

export function mapBannerRow(row: {
  id: string;
  title: string | null;
  published: boolean;
  sortOrder: number;
  extras: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const ex = (row.extras && typeof row.extras === "object" ? row.extras : {}) as Record<string, unknown>;
  const imageUrl = String(ex.imageUrl ?? "");
  const publicId = String(ex.publicId ?? "");
  const page = String(ex.page ?? "homepage");
  const position = String(ex.position ?? "hero");
  const width = Number(ex.width ?? 1200);
  const height = Number(ex.height ?? 400);
  const linkRaw = ex.link;
  const link =
    typeof linkRaw === "string" && linkRaw.trim()
      ? linkRaw.trim()
      : linkRaw != null && String(linkRaw).trim()
        ? String(linkRaw).trim()
        : undefined;
  return {
    id: row.id,
    title: row.title ?? "Banner",
    imageUrl,
    publicId,
    page,
    position,
    link,
    isActive: row.published,
    width,
    height,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listBannersAdmin() {
  const rows = await prisma.adminContent.findMany({
    where: { type: "BANNER" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: bannerSelect,
  });
  return rows.map(mapBannerRow);
}

export async function listBannersPublic(params: { page?: string; position?: string }) {
  const where: Prisma.AdminContentWhereInput = {
    type: "BANNER",
    published: true,
  };
  const rows = await prisma.adminContent.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: bannerSelect,
  });
  let mapped = rows.map(mapBannerRow);
  if (params.page) mapped = mapped.filter((b) => b.page === params.page);
  if (params.position) mapped = mapped.filter((b) => b.position === params.position);
  return mapped;
}

export async function createBanner(input: {
  title: string;
  page: string;
  position: string;
  imageUrl: string;
  publicId?: string;
  width?: number;
  height?: number;
  isActive?: boolean;
  link?: string;
}) {
  const extras = {
    page: input.page,
    position: input.position,
    imageUrl: input.imageUrl,
    publicId: input.publicId ?? "",
    width: input.width ?? 1200,
    height: input.height ?? 400,
    ...(input.link != null && String(input.link).trim() ? { link: String(input.link).trim() } : {}),
  };
  const row = await prisma.adminContent.create({
    data: {
      type: "BANNER",
      title: input.title,
      published: input.isActive !== false,
      extras: extras as Prisma.InputJsonValue,
    },
    select: bannerSelect,
  });
  return mapBannerRow(row);
}

export async function patchBanner(
  id: string,
  patch: Partial<{
    title: string;
    isActive: boolean;
    page: string;
    position: string;
    imageUrl: string;
    publicId: string;
    link: string;
  }>,
) {
  const existing = await prisma.adminContent.findFirst({
    where: { id, type: "BANNER" },
  });
  if (!existing) return null;
  const ex = (existing.extras && typeof existing.extras === "object" ? existing.extras : {}) as Record<string, unknown>;
  const nextExtras = { ...ex };
  if (patch.page !== undefined) nextExtras.page = patch.page;
  if (patch.position !== undefined) nextExtras.position = patch.position;
  if (patch.imageUrl !== undefined) nextExtras.imageUrl = patch.imageUrl;
  if (patch.publicId !== undefined) nextExtras.publicId = patch.publicId;
  if (patch.link !== undefined) {
    if (patch.link === "" || patch.link == null) delete nextExtras.link;
    else nextExtras.link = patch.link;
  }

  const row = await prisma.adminContent.update({
    where: { id },
    data: {
      title: patch.title !== undefined ? patch.title : undefined,
      published: patch.isActive !== undefined ? patch.isActive : undefined,
      extras: nextExtras as Prisma.InputJsonValue,
    },
    select: bannerSelect,
  });
  return mapBannerRow(row);
}

export async function deleteBanner(id: string) {
  const r = await prisma.adminContent.deleteMany({ where: { id, type: "BANNER" } });
  return r.count > 0;
}

function mapContentItem(row: {
  id: string;
  type: AdminContentType;
  title: string | null;
  slug: string | null;
  body: string | null;
  extras: Prisma.JsonValue | null;
  published: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    slug: row.slug,
    body: row.body,
    extras: row.extras,
    published: row.published,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listByType(type: AdminContentType) {
  const rows = await prisma.adminContent.findMany({
    where: { type },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(mapContentItem);
}

export async function createContentItem(input: {
  type: AdminContentType;
  title?: string;
  slug?: string;
  body?: string;
  extras?: Prisma.InputJsonValue;
  published?: boolean;
  sortOrder?: number;
}) {
  const row = await prisma.adminContent.create({
    data: {
      type: input.type,
      title: input.title,
      slug: input.slug,
      body: input.body,
      extras: input.extras ?? undefined,
      published: input.published ?? false,
      sortOrder: input.sortOrder ?? 0,
    },
  });
  return mapContentItem(row);
}

export async function patchContentItem(
  id: string,
  patch: Partial<{
    title: string;
    slug: string;
    body: string;
    extras: Prisma.InputJsonValue;
    published: boolean;
    sortOrder: number;
  }>,
) {
  try {
    const row = await prisma.adminContent.update({
      where: { id },
      data: {
        title: patch.title,
        slug: patch.slug,
        body: patch.body,
        extras: patch.extras,
        published: patch.published,
        sortOrder: patch.sortOrder,
      },
    });
    return mapContentItem(row);
  } catch {
    return null;
  }
}

export async function deleteContentItem(id: string) {
  try {
    await prisma.adminContent.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
