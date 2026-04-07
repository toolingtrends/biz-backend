import prisma from "../../config/prisma";
import { uploadDocument, deleteAsset } from "../../services/cloudinary.service";
import { validateMaterialFile } from "../../services/upload.service";

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  size: number;
  mimetype: string;
}

const MATERIAL_FILE_TYPES: Record<string, string> = {
  "application/pdf": "DOCUMENT",
  "application/vnd.ms-powerpoint": "PRESENTATION",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PRESENTATION",
  "application/msword": "DOCUMENT",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCUMENT",
  "image/jpeg": "IMAGE",
  "image/png": "IMAGE",
  "video/mp4": "VIDEO",
};

export async function createMaterial(
  file: UploadedFile,
  sessionId: string,
  speakerId: string,
  options?: { allowDownload?: boolean; description?: string; status?: string }
) {
  validateMaterialFile(file);
  const session = await prisma.speakerSession.findFirst({
    where: { id: sessionId, speakerId },
    select: { id: true },
  });
  if (!session) {
    throw new Error("Session not found or you are not the speaker");
  }

  const uploadResult = await uploadDocument(file.buffer, `materials/${sessionId}`);
  const fileType = MATERIAL_FILE_TYPES[file.mimetype] || "OTHER";

  const material = await prisma.sessionMaterial.create({
    data: {
      sessionId,
      speakerId,
      fileName: file.originalname,
      fileUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id ?? null,
      fileSize: file.size,
      fileType,
      mimeType: file.mimetype,
      status: options?.status ?? "DRAFT",
      allowDownload: options?.allowDownload ?? true,
      description: options?.description ?? null,
    },
    include: {
      session: {
        select: {
          title: true,
          event: { select: { title: true } },
        },
      },
    },
  });

  return {
    material: {
      id: material.id,
      fileName: material.fileName,
      fileUrl: material.fileUrl,
      fileSize: material.fileSize,
      fileType: material.fileType,
      mimeType: material.mimeType,
      status: material.status,
      allowDownload: material.allowDownload,
      uploadedAt: material.uploadedAt.toISOString(),
      downloadCount: material.downloadCount,
      viewCount: material.viewCount,
    },
  };
}

export async function updateMaterial(
  materialId: string,
  userId: string,
  data: { allowDownload?: boolean; status?: string; description?: string }
) {
  const material = await prisma.sessionMaterial.findFirst({
    where: { id: materialId, speakerId: userId },
  });
  if (!material) {
    throw new Error("Material not found or access denied");
  }

  const updated = await prisma.sessionMaterial.update({
    where: { id: materialId },
    data: {
      ...(typeof data.allowDownload === "boolean" && { allowDownload: data.allowDownload }),
      ...(data.status && { status: data.status }),
      ...(data.description !== undefined && { description: data.description }),
    },
  });

  return {
    material: {
      id: updated.id,
      fileName: updated.fileName,
      fileUrl: updated.fileUrl,
      fileSize: updated.fileSize,
      fileType: updated.fileType,
      mimeType: updated.mimeType,
      status: updated.status,
      allowDownload: updated.allowDownload,
      uploadedAt: updated.uploadedAt.toISOString(),
      downloadCount: updated.downloadCount,
      viewCount: updated.viewCount,
    },
  };
}

export async function getMaterialById(materialId: string, userId: string) {
  const material = await prisma.sessionMaterial.findFirst({
    where: { id: materialId, speakerId: userId },
  });
  if (!material) return null;
  return material;
}

export async function getMaterialForDownload(materialId: string) {
  const material = await prisma.sessionMaterial.findUnique({
    where: { id: materialId },
  });
  if (!material) return null;
  await prisma.sessionMaterial.update({
    where: { id: materialId },
    data: { downloadCount: { increment: 1 } },
  });
  return material;
}

export async function deleteMaterialById(materialId: string, userId: string) {
  const material = await prisma.sessionMaterial.findFirst({
    where: { id: materialId, speakerId: userId },
  });
  if (!material) {
    throw new Error("Material not found or access denied");
  }
  if (material.publicId) {
    await deleteAsset(material.publicId, "raw");
  }
  await prisma.sessionMaterial.delete({
    where: { id: materialId },
  });
  return { success: true };
}

export async function recordMaterialView(materialId: string, userId: string) {
  const material = await prisma.sessionMaterial.findFirst({
    where: { id: materialId, speakerId: userId },
  });
  if (!material) return null;
  await prisma.sessionMaterial.update({
    where: { id: materialId },
    data: { viewCount: { increment: 1 } },
  });
  return { success: true };
}
