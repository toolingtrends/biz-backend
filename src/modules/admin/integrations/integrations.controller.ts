import { Request, Response } from "express";
import { sendOne, sendError } from "../../../lib/admin-response";
import * as service from "./integrations.service";

export async function getPayments(req: Request, res: Response) {
  try {
    const data = await service.getPayments();
    return sendOne(res, data);
  } catch (e: any) {
    return sendError(res, 500, "Failed to get payment integration", e?.message);
  }
}

export async function patchPaymentGateway(req: Request, res: Response) {
  try {
    const updated = await service.patchPaymentGateway(req.params.gatewayId, req.body ?? {});
    if (!updated) return sendError(res, 404, "Gateway not found");
    return sendOne(res, updated);
  } catch (e: any) {
    return sendError(res, 500, "Failed to update gateway", e?.message);
  }
}

export async function testPaymentGateway(req: Request, res: Response) {
  try {
    const result = await service.testPaymentGateway(req.params.gatewayId);
    return res.json({
      success: result.ok,
      message: result.message,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "Test failed" });
  }
}

export async function getCommunication(req: Request, res: Response) {
  try {
    const data = await service.getCommunication();
    return sendOne(res, data);
  } catch (e: any) {
    return sendError(res, 500, "Failed to get communication integration", e?.message);
  }
}

export async function patchCommunicationProvider(req: Request, res: Response) {
  try {
    const updated = await service.patchCommunicationProvider(req.params.id, req.body ?? {});
    if (!updated) return sendError(res, 404, "Provider not found");
    return sendOne(res, updated);
  } catch (e: any) {
    return sendError(res, 500, "Failed to update provider", e?.message);
  }
}

export async function testCommunicationProvider(req: Request, res: Response) {
  try {
    const result = await service.testCommunicationProvider(req.params.id, req.body ?? {});
    return res.json({
      success: result.ok,
      message: result.message,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "Test failed" });
  }
}

export async function getTravel(req: Request, res: Response) {
  try {
    const data = await service.getTravel();
    return sendOne(res, data);
  } catch (e: any) {
    return sendError(res, 500, "Failed to get travel integration", e?.message);
  }
}

export async function patchTravelPartner(req: Request, res: Response) {
  try {
    const updated = await service.patchTravelPartner(req.params.partnerId, req.body ?? {});
    if (!updated) return sendError(res, 404, "Partner not found");
    return sendOne(res, updated);
  } catch (e: any) {
    return sendError(res, 500, "Failed to update partner", e?.message);
  }
}

export async function syncTravelPartner(req: Request, res: Response) {
  try {
    const updated = await service.syncTravelPartner(req.params.partnerId);
    if (!updated) return sendError(res, 404, "Partner not found");
    return sendOne(res, updated);
  } catch (e: any) {
    return sendError(res, 500, "Failed to sync partner", e?.message);
  }
}

export async function createTravelPartner(req: Request, res: Response) {
  try {
    const created = await service.createTravelPartner(req.body ?? {});
    return res.status(201).json({ success: true, data: created });
  } catch (e: any) {
    return sendError(res, 500, "Failed to create partner", e?.message);
  }
}
