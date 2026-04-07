import { Request, Response } from "express";
import { sendList, sendError } from "../../../lib/admin-response";
import * as service from "./reports.service";

/** Full overview for admin Reports & Analytics UI */
export async function getOverview(_req: Request, res: Response) {
  try {
    const data = await service.getAdminReportsOverview();
    return res.json({ success: true, data });
  } catch (e: any) {
    return sendError(res, 500, "Failed to load reports overview", e?.message);
  }
}

export async function list(req: Request, res: Response) {
  try {
    const result = await service.listReports(req.query as Record<string, unknown>);
    return sendList(res, result.data, result.pagination);
  } catch (e: any) {
    return sendError(res, 500, "Failed to list reports", e?.message);
  }
}
