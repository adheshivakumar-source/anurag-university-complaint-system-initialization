// src/server/storage/cloudinary.ts
// ============================================================
// Server-only Cloudinary storage helper for AU-CTS attachments.
//
// CRITICAL SECURITY BOUNDARY:
// This module must NEVER be imported in Client Components.
// It uses server-only environment variables (CLOUDINARY_API_SECRET)
// and handles authenticated uploads and signed URL generation.
// ============================================================

import "server-only";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

/**
 * Configure Cloudinary singleton with server environment variables.
 */
function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "[AU-CTS] Cloudinary configuration is incomplete. " +
        "Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in environment variables.",
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return { cloudName, apiKey, apiSecret };
}

export interface CloudinaryUploadResult {
  publicId: string;
  bytes: number;
  format: string;
  resourceType: "image" | "raw";
  secureUrl: string;
}

/**
 * Uploads an attachment buffer to Cloudinary.
 * Explicitly treats PDFs as 'raw' resource_type and images as 'image'.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folderSegment: string,
  uploadedByUid: string,
): Promise<CloudinaryUploadResult> {
  getCloudinaryConfig();

  const isPdf = mimeType.toLowerCase() === "application/pdf";
  const resourceType: "image" | "raw" = isPdf ? "raw" : "image";

  // Sanitize file name for public_id
  const baseName = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_");
  const folder = `au-cts/complaints/${folderSegment}/attachments`;
  const publicId = `${folder}/${baseName}`;

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: baseName,
        folder: folder,
        resource_type: resourceType,
        overwrite: true,
        context: {
          originalName: fileName,
          uploadedBy: uploadedByUid,
          mimeType: mimeType,
        },
      },
      (error: unknown, result?: UploadApiResponse) => {
        if (error || !result) {
          console.error("[AU-CTS Cloudinary] Upload error:", error);
          reject(new Error("Failed to persist attachment to cloud storage."));
          return;
        }

        resolve({
          publicId: result.public_id || publicId,
          bytes: result.bytes,
          format: result.format || (isPdf ? "pdf" : "jpg"),
          resourceType: resourceType,
          secureUrl: result.secure_url,
        });
      },
    );

    uploadStream.end(buffer);
  });
}

/**
 * Generates a short-lived signed delivery URL for authorized viewers.
 * Expires by default in 5 minutes (300 seconds).
 */
export function generateSignedDeliveryUrl(
  publicId: string,
  resourceType: "image" | "raw" = "image",
  expiresInSeconds = 300,
): string {
  getCloudinaryConfig();

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  if (resourceType === "raw") {
    return cloudinary.utils.private_download_url(publicId, "pdf", {
      resource_type: "raw",
      type: "upload",
      expires_at: expiresAt,
    });
  }

  return cloudinary.url(publicId, {
    resource_type: "image",
    type: "upload",
    sign_url: true,
    expires_at: expiresAt,
    secure: true,
  });
}
