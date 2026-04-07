import prisma from "../../config/prisma";

export async function listConferencesByEvent(eventId: string) {
  const conferences = await prisma.conference.findMany({
    where: { eventId },
    include: {
      sessions: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return conferences;
}

export async function getConferenceById(id: string) {
  const conference = await prisma.conference.findUnique({
    where: { id },
    include: {
      sessions: {
        orderBy: { order: "asc" },
      },
    },
  });
  return conference;
}

export async function createConference(body: Record<string, any>) {
  const { eventId, date, day, theme, sessions } = body;

  if (!eventId || !date || !day || !theme) {
    throw new Error("Missing required fields: eventId, date, day, theme");
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });
  if (!event) {
    throw new Error("Event not found");
  }

  const sessionData = Array.isArray(sessions)
    ? sessions.map((session: any, index: number) => ({
        time: session.time ?? "",
        title: session.title ?? "",
        description: session.description ?? null,
        speaker: session.speaker ?? null,
        type: session.type ?? "SESSION",
        order: index,
      }))
    : [];

  const conference = await prisma.conference.create({
    data: {
      eventId,
      date: String(date),
      day: String(day),
      theme: String(theme),
      isPublished: false,
      sessions: {
        create: sessionData,
      },
    },
    include: {
      sessions: {
        orderBy: { order: "asc" },
      },
    },
  });

  return conference;
}

export async function updateConference(id: string, body: Record<string, any>) {
  const { date, day, theme, sessions, isPublished } = body;

  const existing = await prisma.conference.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    throw new Error("Conference not found");
  }

  await prisma.conferenceSession.deleteMany({
    where: { conferenceId: id },
  });

  const sessionData = Array.isArray(sessions)
    ? sessions.map((session: any, index: number) => ({
        time: session.time ?? "",
        title: session.title ?? "",
        description: session.description ?? null,
        speaker: session.speaker ?? null,
        type: session.type ?? "SESSION",
        order: index,
      }))
    : [];

  const conference = await prisma.conference.update({
    where: { id },
    data: {
      ...(date !== undefined && { date: String(date) }),
      ...(day !== undefined && { day: String(day) }),
      ...(theme !== undefined && { theme: String(theme) }),
      ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
      sessions: {
        create: sessionData,
      },
    },
    include: {
      sessions: {
        orderBy: { order: "asc" },
      },
    },
  });

  return conference;
}

export async function deleteConference(id: string) {
  const existing = await prisma.conference.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    throw new Error("Conference not found");
  }
  await prisma.conference.delete({
    where: { id },
  });
  return { deleted: true };
}
