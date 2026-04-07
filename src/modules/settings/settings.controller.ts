import { Request, Response } from "express";
import {
  getSettingsForUser,
  updateSettingsForUser,
  sendEmailChangeOtp,
  verifyEmailChangeOtp,
  requestAccountDeactivation,
  cancelPendingDeactivationRequest,
} from "./settings.service";

function userId(req: Request): string | null {
  return req.auth?.sub ?? null;
}

export async function getSettingsHandler(req: Request, res: Response) {
  try {
    const uid = userId(req);
    if (!uid) return res.status(401).json({ message: "Unauthorized" });
    const settings = await getSettingsForUser(uid);
    if (!settings) return res.status(404).json({ message: "User not found" });
    return res.json(settings);
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to load settings" });
  }
}

export async function patchSettingsHandler(req: Request, res: Response) {
  try {
    const uid = userId(req);
    if (!uid) return res.status(401).json({ message: "Unauthorized" });
    const updated = await updateSettingsForUser(uid, req.body || {});
    if (!updated) return res.status(404).json({ message: "User not found" });
    return res.json({
      message: "Settings updated successfully",
      settings: updated,
    });
  } catch (e: any) {
    const msg = e?.message || "Failed to update settings";
    return res.status(400).json({ error: msg, message: msg });
  }
}

export async function postVerifyEmailHandler(req: Request, res: Response) {
  try {
    const uid = userId(req);
    if (!uid) return res.status(401).json({ message: "Unauthorized" });
    const { email } = req.body as { email?: string };
    if (!email) return res.status(400).json({ error: "Email is required", message: "Email is required" });
    await sendEmailChangeOtp(uid, email);
    return res.json({ message: "Verification code sent successfully" });
  } catch (e: any) {
    const msg = e?.message || "Failed to send verification code";
    return res.status(400).json({ error: msg, message: msg });
  }
}

export async function putVerifyEmailHandler(req: Request, res: Response) {
  try {
    const uid = userId(req);
    if (!uid) return res.status(401).json({ message: "Unauthorized" });
    const { code, email } = req.body as { code?: string; email?: string };
    if (!code || !email) {
      return res.status(400).json({ error: "Code and email are required", message: "Code and email are required" });
    }
    const settings = await verifyEmailChangeOtp(uid, email, code);
    return res.json({
      message: "Email verified successfully",
      verified: true,
      settings,
    });
  } catch (e: any) {
    const msg = e?.message || "Verification failed";
    return res.status(400).json({ error: msg, message: msg });
  }
}

export async function patchAccountHandler(req: Request, res: Response) {
  try {
    const uid = userId(req);
    if (!uid) return res.status(401).json({ message: "Unauthorized" });
    const { action } = req.body as { action?: string };
    if (action === "requestDeactivation") {
      const { requestId } = await requestAccountDeactivation(uid);
      const settings = await getSettingsForUser(uid);
      return res.json({
        message:
          "Your request was sent to an administrator. After approval, your account will close 30 days later.",
        requestId,
        settings,
      });
    }
    if (action === "cancelDeactivationRequest") {
      await cancelPendingDeactivationRequest(uid);
      const settings = await getSettingsForUser(uid);
      return res.json({
        message: "Pending deactivation request cancelled.",
        settings,
      });
    }
    return res.status(400).json({
      error: "Invalid action",
      message: "Use requestDeactivation or cancelDeactivationRequest",
    });
  } catch (e: any) {
    const msg = e?.message || "Failed to manage account";
    return res.status(400).json({ error: msg, message: msg });
  }
}
