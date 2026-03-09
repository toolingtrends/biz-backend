import { Request, Response } from "express";
import {
  listVenueAppointments,
  createVenueAppointment,
  updateVenueAppointment,
} from "./appointments.service";

export async function getVenueAppointmentsHandler(_req: Request, res: Response) {
  try {
    const result = await listVenueAppointments();
    return res.json({
      success: true,
      data: result.appointments,
      total: result.total,
    });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("Error listing venue appointments:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to list venue appointments",
    });
  }
}

export async function createVenueAppointmentHandler(req: Request, res: Response) {
  try {
    const result = await createVenueAppointment(req.body ?? {});
    return res.status(201).json({
      success: true,
      message: result.message ?? "Appointment created (stub)",
    });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("Error creating venue appointment:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to create venue appointment",
    });
  }
}

export async function updateVenueAppointmentHandler(req: Request, res: Response) {
  try {
    const result = await updateVenueAppointment(req.body ?? {});
    return res.json({
      success: true,
      message: result.message ?? "Appointment updated (stub)",
    });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("Error updating venue appointment:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to update venue appointment",
    });
  }
}

