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

export async function getLanguage(_req: Request, res: Response) {
  try {
    const data = service.getLanguagePageData();
    return res.json(data);
  } catch (e: any) {
    return sendError(res, 500, "Failed to get language settings", e?.message);
  }
}

export async function patchLanguageLocale(req: Request, res: Response) {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const result = service.patchLanguageLocaleSettings(body);
    return res.json(result);
  } catch (e: any) {
    return sendError(res, 500, "Failed to save language settings", e?.message);
  }
}

export async function patchLanguageRow(req: Request, res: Response) {
  try {
    const { languageId } = req.params;
    const updates = (req.body ?? {}) as Record<string, unknown>;
    const result = service.patchLanguageRow(languageId, updates);
    return res.json(result);
  } catch (e: any) {
    return sendError(res, 500, "Failed to update language", e?.message);
  }
}

export async function patchTranslationRow(req: Request, res: Response) {
  try {
    const { translationId } = req.params;
    const translation = (req.body ?? {}) as Record<string, unknown>;
    const result = service.patchTranslationRow(translationId, translation);
    return res.json(result);
  } catch (e: any) {
    return sendError(res, 500, "Failed to update translation", e?.message);
  }
}

export async function deleteLanguageRow(req: Request, res: Response) {
  try {
    const { languageId } = req.params;
    const result = service.deleteLanguageRow(languageId);
    return res.json(result);
  } catch (e: any) {
    return sendError(res, 500, "Failed to delete language", e?.message);
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
