import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from "cloudinary";

// Configure Cloudinary for the backend service
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

type UploadInput = Buffer | string;

async function uploadInternal(
  file: UploadInput,
  options: UploadApiOptions
): Promise<UploadApiResponse> {
  // If we get a Buffer, use upload_stream; if string, use upload directly
  if (Buffer.isBuffer(file)) {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error || !result) {
            return reject(error ?? new Error("Cloudinary upload returned no result"));
          }
          resolve(result);
        }
      );

      uploadStream.end(file);
    });
  }

  return new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader.upload(
      file,
      options,
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error("Cloudinary upload returned no result"));
        }
        resolve(result);
      }
    );
  });
}

export async function uploadImage(
  file: UploadInput,
  folder = "images"
): Promise<UploadApiResponse> {
  return uploadInternal(file, {
    folder,
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"],
  });
}

export async function uploadDocument(
  file: UploadInput,
  folder = "documents"
): Promise<UploadApiResponse> {
  return uploadInternal(file, {
    folder,
    resource_type: "raw",
  });
}

export async function uploadRaw(
  file: UploadInput,
  folder = "raw",
  options: UploadApiOptions = {}
): Promise<UploadApiResponse> {
  return uploadInternal(file, {
    folder,
    resource_type: options.resource_type ?? "raw",
    ...options,
  });
}

export async function deleteAsset(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<unknown> {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
}

// Helper to extract public ID from a Cloudinary URL
export function extractPublicId(url: string): string | null {
  try {
    if (!url.includes("cloudinary.com")) return null;

    const urlParts = url.split("/");
    const uploadIndex = urlParts.indexOf("upload");

    if (uploadIndex === -1) return null;

    // Get everything after the upload/version/ part
    const publicIdWithExtension = urlParts.slice(uploadIndex + 2).join("/");

    // Remove file extension
    const publicId = publicIdWithExtension.split(".")[0];

    return publicId;
  } catch {
    return null;
  }
}

