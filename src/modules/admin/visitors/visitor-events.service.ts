import prisma from "../../../config/prisma";
import type { UserRole } from "@prisma/client";

const ROLE: UserRole = "ATTENDEE";

export async function listVisitorEventsForAdmin() {
  const users = await prisma.user.findMany({
    where: { role: ROLE },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatar: true,
      registrations: {
        select: {
          id: true,
          eventId: true,
          status: true,
          registeredAt: true,
          ticketTypeId: true,
          totalAmount: true,
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      },
    },
  });

  return users.map((u) => {
    const regs = u.registrations ?? [];
    const totalRegistrations = regs.length;
    const confirmedEvents = regs.filter(
      (r) => r.status && ["CONFIRMED", "Confirmed", "confirmed"].includes(r.status)
    ).length;
    const pendingEvents = regs.filter(
      (r) => r.status && ["PENDING", "Pending", "pending"].includes(r.status)
    ).length;
    const cancelledEvents = regs.filter(
      (r) => r.status && ["CANCELLED", "Cancelled", "cancelled"].includes(r.status)
    ).length;

    return {
      id: u.id,
      visitor: {
        id: u.id,
        name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Visitor",
        email: u.email ?? "",
        phone: u.phone ?? null,
        avatar: u.avatar ?? null,
      },
      registrations: regs.map((r) => ({
        id: r.id,
        eventId: r.eventId,
        eventTitle: r.event?.title ?? "",
        eventDate: r.event?.startDate?.toISOString() ?? "",
        status: r.status ?? "PENDING",
        registeredAt: r.registeredAt.toISOString(),
        ticketType: r.ticketTypeId ?? "",
        totalAmount: r.totalAmount ?? 0,
      })),
      stats: {
        totalRegistrations,
        confirmedEvents,
        pendingEvents,
        cancelledEvents,
      },
    };
  });
}
