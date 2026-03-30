import type { UploadApiResponse } from "cloudinary";
import type { Express } from "express";
import { uploadImage, uploadDocument } from "./cloudinary.service";

export interface UploadResult {
  url: string;
  publicId: string;
}

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB (align with organizer dashboard)
const MAX_DOCUMENT_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const MAX_MATERIAL_SIZE_BYTES = 20 * 1024 * 1024; // 20MB for presentation materials
const ALLOWED_MATERIAL_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "video/mp4",
]);

function ensureFilePresent(file: Express.Multer.File | undefined | null): asserts file is Express.Multer.File {
  if (!file) {
    throw new Error("FILE_MISSING");
  }
}

export function validateImageFile(file: Express.Multer.File): void {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    throw new Error("UNSUPPORTED_IMAGE_TYPE");
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("IMAGE_TOO_LARGE");
  }
}

export function validateDocumentFile(file: Express.Multer.File): void {
  if (!ALLOWED_DOCUMENT_MIME_TYPES.has(file.mimetype)) {
    throw new Error("UNSUPPORTED_DOCUMENT_TYPE");
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error("DOCUMENT_TOO_LARGE");
  }
}

function toUploadResult(result: UploadApiResponse): UploadResult {
  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

export async function handleImageUpload(file: Express.Multer.File): Promise<UploadResult> {
  ensureFilePresent(file);
  validateImageFile(file);
  const result = await uploadImage(file.buffer);
  return toUploadResult(result);
}

export async function handleDocumentUpload(file: Express.Multer.File): Promise<UploadResult> {
  ensureFilePresent(file);
  validateDocumentFile(file);
  const result = await uploadDocument(file.buffer);
  return toUploadResult(result);
}

export function validateMaterialFile(file: { mimetype: string; size: number } | null | undefined): void {
  if (!file) throw new Error("FILE_MISSING");
  if (!ALLOWED_MATERIAL_MIME_TYPES.has(file.mimetype)) {
    throw new Error("UNSUPPORTED_MATERIAL_TYPE");
  }
  if (file.size > MAX_MATERIAL_SIZE_BYTES) {
    throw new Error("MATERIAL_TOO_LARGE");
  }
}

