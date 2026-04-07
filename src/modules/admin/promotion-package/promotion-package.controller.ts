import { Request, Response } from "express";
import * as service from "./promotion-package.service";

export async function listHandler(_req: Request, res: Response) {
  try {
    const packages = await service.listPromotionPackages();
    return res.json({ success: true, packages });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch promotion packages", details: error?.message });
  }
}

export async function createHandler(req: Request, res: Response) {
  try {
    const body = req.body ?? {};
    if (!body.name) {
      return res.status(400).json({ success: false, error: "name is required" });
    }
    const item = await service.createPromotionPackage(body);
    return res.status(201).json({ success: true, package: item });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: "Failed to create promotion package", details: error?.message });
  }
}

export async function patchHandler(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const item = await service.updatePromotionPackage(id, req.body ?? {});
    if (!item) return res.status(404).json({ success: false, error: "Promotion package not found" });
    return res.json({ success: true, package: item });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: "Failed to update promotion package", details: error?.message });
  }
}

export async function deleteHandler(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const deleted = await service.deletePromotionPackage(id);
    if (!deleted) return res.status(404).json({ success: false, error: "Promotion package not found" });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: "Failed to delete promotion package", details: error?.message });
  }
}
