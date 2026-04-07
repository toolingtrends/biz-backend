import { Request, Response } from "express";
import {
  listPendingDeactivationRequests,
  listAllDeactivationRequestsForAdmin,
  approveDeactivationRequest,
  rejectDeactivationRequest,
  processDueAccountDeactivations,
} from "./account-deactivation.service";

function adminMeta(req: Request): { id: string; type: string } {
  const a = req.auth!;
  return { id: a.sub, type: a.role };
}

export async function getPendingDeactivationsHandler(_req: Request, res: Response) {
  try {
    const data = await listPendingDeactivationRequests();
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "Failed to list requests" });
  }
}

export async function getDeactivationsHandler(req: Request, res: Response) {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const data = await listAllDeactivationRequestsForAdmin(status);
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "Failed to list requests" });
  }
}

export async function postApproveDeactivationHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { id: adminId, type: adminType } = adminMeta(req);
    const { effectiveAt } = await approveDeactivationRequest(id, adminId, adminType);
    return res.json({
      success: true,
      message: "Deactivation approved. Account will be closed after the 30-day period.",
      deactivateEffectiveAt: effectiveAt.toISOString(),
    });
  } catch (e: any) {
    const msg = e?.message || "Failed to approve";
    return res.status(400).json({ success: false, message: msg });
  }
}

export async function postRejectDeactivationHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { id: adminId, type: adminType } = adminMeta(req);
    const { reason } = (req.body ?? {}) as { reason?: string };
    await rejectDeactivationRequest(id, adminId, adminType, reason);
    return res.json({ success: true, message: "Request rejected" });
  } catch (e: any) {
    const msg = e?.message || "Failed to reject";
    return res.status(400).json({ success: false, message: msg });
  }
}

/** Manual trigger (admin) — same as background job */
export async function postProcessDueDeactivationsHandler(_req: Request, res: Response) {
  try {
    const n = await processDueAccountDeactivations();
    return res.json({ success: true, processed: n });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "Failed" });
  }
}
