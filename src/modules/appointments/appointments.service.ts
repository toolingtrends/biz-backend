export async function listVenueAppointments() {
  // TODO: implement with Prisma once Appointment model exists
  return {
    appointments: [],
    total: 0,
  };
}

export async function createVenueAppointment(_body: Record<string, unknown>) {
  // TODO: implement persistence with Prisma
  return {
    success: true,
    message: "Venue appointment creation not yet implemented",
  };
}

export async function updateVenueAppointment(_body: Record<string, unknown>) {
  // TODO: implement persistence with Prisma
  return {
    success: true,
    message: "Venue appointment update not yet implemented",
  };
}

