import { Request, Response } from "express";
import { uploadImage } from "../../../services/cloudinary.service";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function adminUpload(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: "No file provided" });
    }
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: "Invalid file type",
        details: `Allowed: ${ALLOWED_TYPES.join(", ")}`,
      });
    }
    if (file.size > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        error: "File too large",
        details: "Max 10MB",
      });
    }
    const folder = (req.body?.folder as string)?.trim() || "flags";
    const result = await uploadImage(file.buffer, folder);
    return res.json({
      success: true,
      secure_url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (e: any) {
    console.error("Admin upload error:", e);
    return res.status(500).json({
      success: false,
      error: "Upload failed",
      details: e?.message || "Unknown error",
    });
  }
}
