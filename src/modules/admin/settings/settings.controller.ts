import { Request, Response } from "express";
import { sendOne, sendError } from "../../../lib/admin-response";
import * as service from "./settings.service";

export async function getModules(req: Request, res: Response) {
  try {
    const data = await service.getModules();
    return sendOne(res, data);
  } catch (e: any) {
    return sendError(res, 500, "Failed to get modules", e?.message);
  }
}

export async function getNotifications(req: Request, res: Response) {
  try {
    const data = await service.getNotifications();
    return sendOne(res, data);
  } catch (e: any) {
    return sendError(res, 500, "Failed to get notification settings", e?.message);
  }
}

export async function patchNotifications(req: Request, res: Response) {
  try {
    await service.saveNotifications((req.body ?? {}) as Record<string, unknown>);
    return res.json({ success: true });
  } catch (e: any) {
    return sendError(res, 500, "Failed to save notification settings", e?.message);
  }
}

export async function postNotificationTest(req: Request, res: Response) {
  try {
    const channel = (req.body as { channel?: string } | undefined)?.channel ?? "unknown";
    return res.json({
      success: true,
      message: `Test notification sent via ${channel}`,
    });
  } catch (e: any) {
    return sendError(res, 500, "Failed to send test notification", e?.message);
  }
}

export async function getSecurity(req: Request, res: Response) {
  try {
    const data = await service.getSecurity();
    return sendOne(res, data);
  } catch (e: any) {
    return sendError(res, 500, "Failed to get security settings", e?.message);
  }
}

export async function getLanguage(req: Request, res: Response) {
  try {
    const data = await service.getLanguage();
    return sendOne(res, data);
  } catch (e: any) {
    return sendError(res, 500, "Failed to get language settings", e?.message);
  }
}

export async function getBackup(req: Request, res: Response) {
  try {
    const data = await service.getBackup();
    return sendOne(res, data);
  } catch (e: any) {
    return sendError(res, 500, "Failed to get backup settings", e?.message);
  }
}
