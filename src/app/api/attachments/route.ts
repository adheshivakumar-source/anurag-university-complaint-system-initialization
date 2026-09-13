// src/app/api/attachments/route.ts
// ============================================================
// Secure Attachment Retrieval Endpoint.
// Authenticates user session, enforces complaint RBAC, and
// generates time-limited signed Cloudinary delivery URLs.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/server/auth/authorization";
import { getComplaintById } from "@/server/complaints/service";
import { generateSignedDeliveryUrl } from "@/server/storage/cloudinary";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const complaintId = searchParams.get("complaintId");
    const requestedPath = searchParams.get("path") || searchParams.get("file");

    if (!complaintId) {
      return NextResponse.json(
        { error: "Missing required parameter: complaintId" },
        { status: 400 },
      );
    }

    // 1. Authenticate user session
    const userContext = await getAuthenticatedUser();
    if (!userContext) {
      return NextResponse.json(
        { error: "Authentication required to view attachments." },
        { status: 401 },
      );
    }

    // 2. Fetch complaint and verify RBAC
    let complaint;
    try {
      complaint = await getComplaintById(complaintId, userContext);
    } catch (authError: unknown) {
      const message =
        authError instanceof Error
          ? authError.message
          : "You are not authorized to view attachments for this grievance.";
      return NextResponse.json({ error: message }, { status: 403 });
    }

    if (!complaint) {
      return NextResponse.json(
        { error: "Grievance not found." },
        { status: 404 },
      );
    }

    // 3. Find matching attachment in complaint metadata
    const attachments = complaint.attachments || [];
    if (attachments.length === 0) {
      return NextResponse.json(
        { error: "No attachments exist for this grievance." },
        { status: 404 },
      );
    }

    const attachment = requestedPath
      ? attachments.find(
          (a) => a.storagePath === requestedPath || a.fileName === requestedPath,
        )
      : attachments[0];

    if (!attachment) {
      return NextResponse.json(
        { error: "Requested attachment not found on this grievance." },
        { status: 404 },
      );
    }

    // 4. Generate short-lived signed delivery URL
    const isPdf = attachment.mimeType.toLowerCase() === "application/pdf";
    const resourceType: "image" | "raw" = isPdf ? "raw" : "image";
    const signedUrl = generateSignedDeliveryUrl(
      attachment.storagePath,
      resourceType,
      300, // 5 minutes validity
    );

    // 5. If JSON requested or redirect=false, return JSON response; otherwise 302 redirect
    const wantsJson =
      searchParams.get("redirect") === "false" ||
      request.headers.get("accept")?.includes("application/json");

    if (wantsJson) {
      return NextResponse.json({
        success: true,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        url: signedUrl,
      });
    }

    return NextResponse.redirect(signedUrl, { status: 302 });
  } catch (error: unknown) {
    console.error("[AU-CTS Attachments API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve attachment." },
      { status: 500 },
    );
  }
}
