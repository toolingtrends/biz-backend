import { Request, Response } from "express";
import {
  createMaterial,
  updateMaterial,
  getMaterialById,
  getMaterialForDownload,
  deleteMaterialById,
  recordMaterialView,
} from "./materials.service";

export async function postMaterialHandler(req: Request, res: Response) {
  try {
    const file = req.file;
    const sessionId = (req.body?.sessionId as string)?.trim();
    const speakerId = (req.body?.speakerId as string)?.trim();
    const auth = req.auth;
    if (!auth?.sub) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }
    if (auth.sub !== speakerId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    if (!file) {
      return res.status(400).json({ success: false, error: "File is required" });
    }
    if (!sessionId || !speakerId) {
      return res.status(400).json({ success: false, error: "sessionId and speakerId are required" });
    }

    const allowDownload = req.body?.allowDownload === "true" || req.body?.allowDownload === true;
    const description = req.body?.description as string | undefined;
    const status = (req.body?.status as string) || "DRAFT";

    const result = await createMaterial(file, sessionId, speakerId, {
      allowDownload,
      description,
      status,
    });
    return res.status(201).json(result);
  } catch (err: any) {
    if (err?.message === "Session not found or you are not the speaker") {
      return res.status(404).json({ success: false, error: err.message });
    }
    if (err?.message === "UNSUPPORTED_MATERIAL_TYPE" || err?.message === "MATERIAL_TOO_LARGE") {
      return res.status(400).json({ success: false, error: err.message });
    }
    console.error("Error creating material:", err);
    return res.status(500).json({ success: false, error: "Failed to upload material" });
  }
}

export async function patchMaterialHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const auth = req.auth;
    if (!auth?.sub) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }
    const body = req.body ?? {};
    const result = await updateMaterial(id, auth.sub, {
      allowDownload: body.allowDownload,
      status: body.status,
      description: body.description,
    });
    return res.json(result);
  } catch (err: any) {
    if (err?.message === "Material not found or access denied") {
      return res.status(404).json({ success: false, error: err.message });
    }
    console.error("Error updating material:", err);
    return res.status(500).json({ success: false, error: "Failed to update material" });
  }
}

export async function getMaterialDownloadHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const material = await getMaterialForDownload(id);
    if (!material) {
      return res.status(404).json({ success: false, error: "Material not found" });
    }
    return res.json({ fileUrl: material.fileUrl });
  } catch (err) {
    console.error("Error getting material download:", err);
    return res.status(500).json({ success: false, error: "Failed to get download URL" });
  }
}

export async function deleteMaterialHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const auth = req.auth;
    if (!auth?.sub) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }
    await deleteMaterialById(id, auth.sub);
    return res.json({ success: true, message: "Material deleted successfully" });
  } catch (err: any) {
    if (err?.message === "Material not found or access denied") {
      return res.status(404).json({ success: false, error: err.message });
    }
    console.error("Error deleting material:", err);
    return res.status(500).json({ success: false, error: "Failed to delete material" });
  }
}

export async function postMaterialViewHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const auth = req.auth;
    if (!auth?.sub) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }
    await recordMaterialView(id, auth.sub);
    return res.json({ success: true });
  } catch (err) {
    console.error("Error recording material view:", err);
    return res.status(500).json({ success: false, error: "Failed to record view" });
  }
}
