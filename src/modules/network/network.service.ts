import prisma from "../../config/prisma";

// Use string literals for status (Prisma enum may not be in generated client types in some setups)
const ACCEPTED = "ACCEPTED" as const;
const PENDING = "PENDING" as const;

export type ConnectionStatusValue =
  | "NOT_CONNECTED"
  | "PENDING_SENT"
  | "PENDING_RECEIVED"
  | "CONNECTED";

export interface NetworkUser {
  userId: string;
  name: string;
  avatar: string | null;
  company: string | null;
  role: string;
  connectionStatus: ConnectionStatusValue;
}

export interface EventNetworkResult {
  speakers: NetworkUser[];
  exhibitors: NetworkUser[];
  attendees: NetworkUser[];
  organizers: NetworkUser[];
}

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
  company: true,
  role: true,
} as const;

function toName(firstName: string, lastName: string): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "User";
}

function toNetworkUser(
  user: { id: string; firstName: string; lastName: string; avatar: string | null; company: string | null; role: string },
  connectionStatus: ConnectionStatusValue
): NetworkUser {
  return {
    userId: user.id,
    name: toName(user.firstName, user.lastName),
    avatar: user.avatar,
    company: user.company,
    role: user.role,
    connectionStatus,
  };
}

/**
 * Get networkable users for an event, grouped by role (speakers, exhibitors, attendees, organizers).
 * Excludes the current user. Includes connection status for each user relative to currentUser.
 * Optimized: single event lookup, bulk participant queries, single connection query.
 */
export async function getEventNetwork(eventId: string, currentUserId: string): Promise<EventNetworkResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, organizerId: true },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  const excludeIds = new Set<string>([currentUserId, event.organizerId].filter(Boolean));

  const [speakerRows, exhibitorRows, attendeeRows, connections] = await Promise.all([
    prisma.speakerSession.findMany({
      where: { eventId },
      select: { speakerId: true },
      distinct: ["speakerId"],
    }),
    prisma.exhibitorBooth.findMany({
      where: { eventId },
      select: { exhibitorId: true },
      distinct: ["exhibitorId"],
    }),
    prisma.eventRegistration.findMany({
      where: { eventId },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: currentUserId },
          { receiverId: currentUserId },
        ],
      },
      select: {
        requesterId: true,
        receiverId: true,
        status: true,
      },
    }),
  ]);

  const connectionMap = new Map<string, ConnectionStatusValue>();
  for (const c of connections) {
    const otherId = c.requesterId === currentUserId ? c.receiverId : c.requesterId;
    if (c.status === ACCEPTED) {
      connectionMap.set(otherId, "CONNECTED");
    } else if (c.status === PENDING) {
      const status: ConnectionStatusValue = c.requesterId === currentUserId ? "PENDING_SENT" : "PENDING_RECEIVED";
      connectionMap.set(otherId, status);
    } else {
      connectionMap.set(otherId, "NOT_CONNECTED");
    }
  }

  const speakerIds = new Set(speakerRows.map((r) => r.speakerId).filter((id) => !excludeIds.has(id)));
  const exhibitorIds = new Set(exhibitorRows.map((r) => r.exhibitorId).filter((id) => !excludeIds.has(id)));
  const attendeeIds = new Set(attendeeRows.map((r) => r.userId).filter((id) => !excludeIds.has(id)));

  const exhibitorIdsOnly = new Set([...exhibitorIds].filter((id) => !speakerIds.has(id)));
  const attendeeIdsOnly = new Set([...attendeeIds].filter((id) => !speakerIds.has(id) && !exhibitorIds.has(id)));

  const allUserIds = new Set<string>([
    event.organizerId,
    ...speakerIds,
    ...exhibitorIdsOnly,
    ...attendeeIdsOnly,
  ].filter((id): id is string => !!id && id !== currentUserId));

  if (allUserIds.size === 0) {
    const organizerUser =
      event.organizerId && event.organizerId !== currentUserId
        ? await prisma.user.findUnique({
            where: { id: event.organizerId },
            select: userSelect,
          })
        : null;
    const connectionStatus = organizerUser
      ? connectionMap.get(organizerUser.id) ?? "NOT_CONNECTED"
      : "NOT_CONNECTED";
    return {
      speakers: [],
      exhibitors: [],
      attendees: [],
      organizers: organizerUser ? [toNetworkUser(organizerUser, connectionStatus)] : [],
    };
  }

  const users = await prisma.user.findMany({
    where: { id: { in: [...allUserIds] } },
    select: userSelect,
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  type UserRow = { id: string; firstName: string; lastName: string; avatar: string | null; company: string | null; role: string };

  const organizers: NetworkUser[] = [];
  if (event.organizerId && event.organizerId !== currentUserId) {
    const u = userMap.get(event.organizerId as string);
    if (u) {
      organizers.push(toNetworkUser(u, connectionMap.get(u.id) ?? "NOT_CONNECTED"));
    }
  }

  const speakers: NetworkUser[] = [];
  for (const id of speakerIds) {
    const u = userMap.get(id) as UserRow | undefined;
    if (u) {
      speakers.push(toNetworkUser(u, connectionMap.get(u.id) ?? "NOT_CONNECTED"));
    }
  }

  const exhibitors: NetworkUser[] = [];
  for (const id of exhibitorIdsOnly) {
    const u = userMap.get(id) as UserRow | undefined;
    if (u) {
      exhibitors.push(toNetworkUser(u, connectionMap.get(u.id) ?? "NOT_CONNECTED"));
    }
  }

  const attendees: NetworkUser[] = [];
  for (const id of attendeeIdsOnly) {
    const u = userMap.get(id) as UserRow | undefined;
    if (u) {
      attendees.push(toNetworkUser(u, connectionMap.get(u.id) ?? "NOT_CONNECTED"));
    }
  }

  return {
    speakers,
    exhibitors,
    attendees,
    organizers,
  };
}
