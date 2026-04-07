import prisma from "../../../config/prisma";
import type { UserRole } from "@prisma/client";

const ROLE: UserRole = "ATTENDEE";

export async function listVisitorConnectionsForAdmin(_query: Record<string, unknown>) {
  const users = await prisma.user.findMany({
    where: { role: ROLE },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
      company: true,
      jobTitle: true,
      location: true,
    },
  });

  const userIds = users.map((u) => u.id);

  const [sent, received] = await Promise.all([
    prisma.connection.findMany({
      where: { requesterId: { in: userIds } },
      include: {
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
          },
        },
      },
    }),
    prisma.connection.findMany({
      where: { receiverId: { in: userIds } },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
          },
        },
      },
    }),
  ]);

  const sentByUser: Record<string, typeof sent> = {};
  const receivedByUser: Record<string, typeof received> = {};
  for (const id of userIds) {
    sentByUser[id] = sent.filter((c) => c.requesterId === id);
    receivedByUser[id] = received.filter((c) => c.receiverId === id);
  }

  const visitors = users.map((u) => {
    const sentList = sentByUser[u.id] ?? [];
    const receivedList = receivedByUser[u.id] ?? [];
    const acceptedSent = sentList.filter((c) => c.status === "ACCEPTED").length;
    const acceptedReceived = receivedList.filter((c) => c.status === "ACCEPTED").length;
    const pendingSent = sentList.filter((c) => c.status === "PENDING").length;
    const pendingReceived = receivedList.filter((c) => c.status === "PENDING").length;
    const rejectedSent = sentList.filter((c) => c.status === "REJECTED").length;
    const rejectedReceived = receivedList.filter((c) => c.status === "REJECTED").length;

    const connectionsSent = sentList.map((c) => ({
      id: c.id,
      senderId: c.requesterId,
      receiverId: c.receiverId,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      acceptedAt: null as string | null,
    }));
    const connectionsReceived = receivedList.map((c) => ({
      id: c.id,
      senderId: c.requesterId,
      receiverId: c.receiverId,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      acceptedAt: null as string | null,
    }));

    return {
      id: u.id,
      name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Visitor",
      email: u.email ?? "",
      avatar: u.avatar ?? null,
      company: u.company ?? null,
      jobTitle: u.jobTitle ?? null,
      location: u.location ?? null,
      totalConnections: acceptedSent + acceptedReceived,
      pendingRequests: pendingSent + pendingReceived,
      acceptedConnections: acceptedSent + acceptedReceived,
      rejectedRequests: rejectedSent + rejectedReceived,
      connectionsSent,
      connectionsReceived,
    };
  });

  return { visitors };
}
