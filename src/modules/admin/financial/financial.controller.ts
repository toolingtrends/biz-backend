import { Request, Response } from "express";
import { sendList, sendError } from "../../../lib/admin-response";
import * as service from "./financial.service";

export async function transactions(req: Request, res: Response) {
  try {
    const result = await service.listTransactions(req.query as Record<string, unknown>);
    return sendList(res, result.data, result.pagination);
  } catch (e: any) {
    return sendError(res, 500, "Failed to list transactions", e?.message);
  }
}

export async function payments(req: Request, res: Response) {
  try {
    const result = await service.listPayments(req.query as Record<string, unknown>);
    return sendList(res, result.data, result.pagination);
  } catch (e: any) {
    return sendError(res, 500, "Failed to list payments", e?.message);
  }
}

export async function subscriptions(req: Request, res: Response) {
  try {
    const result = await service.listSubscriptions(req.query as Record<string, unknown>);
    return sendList(res, result.data, result.pagination);
  } catch (e: any) {
    return sendError(res, 500, "Failed to list subscriptions", e?.message);
  }
}

export async function invoices(req: Request, res: Response) {
  try {
    const result = await service.listInvoices(req.query as Record<string, unknown>);
    return sendList(res, result.data, result.pagination);
  } catch (e: any) {
    return sendError(res, 500, "Failed to list invoices", e?.message);
  }
}

export async function promotionPackages(req: Request, res: Response) {
  try {
    const result = await service.listPromotionPackages(req.query as Record<string, unknown>);
    return sendList(res, result.data, result.pagination);
  } catch (e: any) {
    return sendError(res, 500, "Failed to list promotion packages", e?.message);
  }
}
