import { Request, Response } from "express";
import { uploadImage, uploadDocument } from "../../../services/cloudinary.service";

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif"];
const DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function adminUpload(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: "No file provided" });
    }

    const typeHint = (req.body?.type as string | undefined)?.toLowerCase();
    const isImage = typeHint === "image" || IMAGE_TYPES.includes(file.mimetype);
    const isDocument = typeHint === "document" || DOCUMENT_TYPES.includes(file.mimetype);

    if (!isImage && !isDocument) {
      return res.status(400).json({
        success: false,
        error: "Invalid file type",
        details: `Allowed images: ${IMAGE_TYPES.join(", ")}; documents: ${DOCUMENT_TYPES.join(", ")}`,
      });
    }

    if (file.size > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        error: "File too large",
        details: "Max 10MB",
      });
    }

    const folder = (req.body?.folder as string)?.trim() || (isDocument ? "documents" : "images");

    const result = isDocument
      ? await uploadDocument(file.buffer, folder)
      : await uploadImage(file.buffer, folder);

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
