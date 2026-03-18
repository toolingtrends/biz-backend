import prisma from "../../../config/prisma";

export async function listVenueBookingsForAdmin() {
  const appointments = await prisma.venueAppointment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      venue: {
        select: {
          id: true,
          venueName: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      visitor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          company: true,
        },
      },
    },
  });

  return {
    bookings: appointments.map((a) => ({
      id: a.id,
      venueId: a.venueId,
      venueName:
        (a.venue?.venueName ??
          `${a.venue?.firstName ?? ""} ${a.venue?.lastName ?? ""}`.trim()) ||
        "Venue",
      venuePhone: a.venue?.phone ?? "",
      venueEmail: a.venue?.email ?? "",
      requesterId: a.visitorId ?? "",
      requesterName: a.visitor
        ? `${a.visitor.firstName ?? ""} ${a.visitor.lastName ?? ""}`.trim() || "Visitor"
        : "",
      requesterEmail: a.visitor?.email ?? "",
      requesterPhone: a.visitor?.phone ?? "",
      requesterCompany: a.visitor?.company ?? "",
      title: a.type ?? "Venue appointment",
      description: a.purpose ?? "",
      type: a.type,
      status: a.status,
      priority: a.priority,
      requestedDate: a.requestedDate.toISOString().split("T")[0],
      requestedTime: a.requestedTime,
      duration: a.duration,
      confirmedDate: null,
      confirmedTime: null,
      meetingType: a.location ? "IN_PERSON" : "VIRTUAL",
      location: a.location ?? "",
      purpose: a.purpose ?? "",
      eventType: a.type,
      expectedAttendees: 0,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

export async function updateVenueBookingStatus(
  id: string,
  body: { status?: string; notes?: string }
) {
  const appointment = await prisma.venueAppointment.findUnique({ where: { id } });
  if (!appointment) return null;
  const status = body.status ?? appointment.status;
  const notes = body.notes != null ? body.notes : appointment.notes;
  await prisma.venueAppointment.update({
    where: { id },
    data: { status, notes },
  });
  return { updated: true };
}
