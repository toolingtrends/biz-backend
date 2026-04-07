import prisma from "../../config/prisma";

export async function listByEventId(eventId: string) {
  return prisma.exhibitorManual.findMany({
    where: { eventId },
    include: {
      uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getById(id: string) {
  return prisma.exhibitorManual.findUnique({
    where: { id },
    include: {
      uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(s: string | undefined): boolean {
  return typeof s === "string" && UUID_REGEX.test(s.trim());
}

export async function create(body: {
  eventId: string;
  uploadedById: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType?: string;
  description?: string;
  version?: string;
}) {
  const { eventId, uploadedById, fileName, fileUrl, fileSize, mimeType, description, version } = body;
  if (!eventId || !fileName || !fileUrl) {
    throw new Error("Missing required fields: eventId, fileName, fileUrl");
  }
  if (!uploadedById || uploadedById === "undefined" || !isValidUuid(uploadedById)) {
    throw new Error("Valid user ID (uploadedById) is required. Please sign in and try again.");
  }
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
  if (!event) throw new Error("Event not found");
  const user = await prisma.user.findUnique({ where: { id: uploadedById }, select: { id: true } });
  if (!user) throw new Error("User not found");

  return prisma.exhibitorManual.create({
    data: {
      eventId,
      uploadedById,
      fileName,
      fileUrl,
      fileSize: Number(fileSize),
      mimeType: mimeType ?? "application/pdf",
      description: description ?? null,
      version: version ?? "1.0",
    },
    include: {
      uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

export async function remove(id: string) {
  const existing = await prisma.exhibitorManual.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new Error("Exhibitor manual not found");
  await prisma.exhibitorManual.delete({ where: { id } });
  return { deleted: true };
}

export async function update(id: string, body: { description?: string; version?: string }) {
  const existing = await prisma.exhibitorManual.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new Error("Exhibitor manual not found");
  return prisma.exhibitorManual.update({
    where: { id },
    data: {
      ...(body.description !== undefined && { description: body.description }),
      ...(body.version !== undefined && { version: body.version }),
    },
    include: {
      uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}
