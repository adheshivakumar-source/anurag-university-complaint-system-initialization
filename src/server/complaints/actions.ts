// src/lib/complaints/actions.ts
// ============================================================
// Server Actions for Complaint Operations.
// Thin adapters connecting Client Components to the backend service.
//
// AUTHORIZATION & VALIDATION FLOW:
// 1. Authenticate caller session via getAuthenticatedUser().
// 2. Validate input schema with Zod.
// 3. Delegate to complaint service layer.
// 4. Return serialized response or friendly error message.
// ============================================================

"use server";

import { getAuthenticatedUser } from "@/server/auth/authorization";
import { getAdminStorage } from "@/server/firebase/admin";
import {
  createComplaint,
  updateComplaintStatus,
  assignComplaint,
  submitComplaintFeedback,
  getComplaintById,
} from "./service";
import {
  resolveComplaintSchema,
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
  type CreateComplaintInput,
  type CreateComplaintFormData,
  type UpdateComplaintStatusInput,
  type AssignComplaintInput,
  type SubmitFeedbackInput,
} from "@/shared/validation/validation";
import { USER_ROLES, type AttachmentRefDTO } from "@/shared/types";
import { revalidatePath } from "next/cache";

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Uploads a supporting grievance attachment to Firebase Storage.
 * Enforces session authentication, file size limit (10MB), and MIME whitelist.
 */
export async function uploadComplaintAttachmentAction(
  formData: FormData,
): Promise<ActionResponse<AttachmentRefDTO>> {
  try {
    const userContext = await getAuthenticatedUser();
    if (!userContext) {
      return { success: false, error: "Authentication required to upload proof." };
    }

    if (!userContext.profile.isActive) {
      return { success: false, error: "Inactive accounts cannot upload attachments." };
    }

    if (userContext.profile.role === USER_ROLES.DEPARTMENT_OFFICER) {
      return { success: false, error: "Department officers are not permitted to submit grievances." };
    }

    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return { success: false, error: "No file provided for upload." };
    }

    const fileName = (file as File).name || "attachment";
    const fileSize = file.size;
    const mimeType = file.type || "application/octet-stream";

    // Validate size
    if (fileSize <= 0) {
      return { success: false, error: "The selected file is empty." };
    }
    if (fileSize > MAX_ATTACHMENT_SIZE_BYTES) {
      return { success: false, error: "File must be JPG, PNG, WEBP, or PDF and smaller than 10 MB." };
    }

    // Validate MIME type
    const isMimeAllowed = ALLOWED_ATTACHMENT_MIME_TYPES.includes(
      mimeType as (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number],
    );
    if (!isMimeAllowed) {
      return {
        success: false,
        error: "File must be JPG, PNG, WEBP, or PDF and smaller than 10 MB.",
      };
    }

    // Sanitize file name for safe storage path
    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 100);

    // Create unique folder segment adhering to storage path regex
    const folderId = `CTS-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;
    const storagePath = `complaints/${folderId}/attachments/${sanitizedFileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.save(buffer, {
      metadata: {
        contentType: mimeType,
        metadata: {
          uploadedBy: userContext.profile.uid,
          originalName: fileName,
        },
      },
    });

    const attachment: AttachmentRefDTO = {
      storagePath,
      fileName,
      fileSize,
      mimeType,
      uploadedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: attachment,
    };
  } catch (error: unknown) {
    console.error("[AU-CTS Complaint Action] uploadComplaintAttachment failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload attachment.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Create a new complaint.
 */
export async function createComplaintAction(
  input: CreateComplaintFormData | CreateComplaintInput,
): Promise<ActionResponse<{ complaintId: string }>> {
  try {
    const userContext = await getAuthenticatedUser();
    if (!userContext) {
      return { success: false, error: "Authentication required to submit a complaint." };
    }

    const complaint = await createComplaint(input, userContext);
    revalidatePath("/complaints");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: { complaintId: complaint.complaintId },
    };
  } catch (error: unknown) {
    console.error("[AU-CTS Complaint Action] createComplaint failed:", error);
    const message = error instanceof Error ? error.message : "Failed to create complaint.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Transition complaint status.
 */
export async function updateComplaintStatusAction(
  input: UpdateComplaintStatusInput,
): Promise<ActionResponse<{ complaintId: string; status: string }>> {
  try {
    const userContext = await getAuthenticatedUser();
    if (!userContext) {
      return { success: false, error: "Authentication required to update complaint status." };
    }

    const updated = await updateComplaintStatus(input, userContext);
    revalidatePath(`/complaints/${input.complaintId}`);
    revalidatePath("/complaints");
    revalidatePath("/officer");
    revalidatePath("/admin");

    return {
      success: true,
      data: { complaintId: updated.complaintId, status: updated.status },
    };
  } catch (error: unknown) {
    console.error("[AU-CTS Complaint Action] updateComplaintStatus failed:", error);
    const message = error instanceof Error ? error.message : "Failed to update complaint status.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Assign an officer to a complaint.
 */
export async function assignComplaintAction(
  input: AssignComplaintInput,
): Promise<ActionResponse<{ complaintId: string; assignedTo: string | null }>> {
  try {
    const userContext = await getAuthenticatedUser();
    if (!userContext) {
      return { success: false, error: "Authentication required to assign complaints." };
    }

    const updated = await assignComplaint(input, userContext);
    revalidatePath(`/complaints/${input.complaintId}`);
    revalidatePath("/officer");
    revalidatePath("/admin");

    return {
      success: true,
      data: { complaintId: updated.complaintId, assignedTo: updated.assignedTo },
    };
  } catch (error: unknown) {
    console.error("[AU-CTS Complaint Action] assignComplaint failed:", error);
    const message = error instanceof Error ? error.message : "Failed to assign complaint.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Pick up / self-assign an unassigned complaint.
 * Derives officer identity exclusively from server session context.
 * Enforces atomic pickup semantics (fails if already assigned).
 */
export async function pickupComplaintAction(
  complaintId: string,
): Promise<ActionResponse<{ complaintId: string; assignedTo: string }>> {
  try {
    const userContext = await getAuthenticatedUser();
    if (!userContext) {
      return { success: false, error: "Authentication required to pick up complaints." };
    }

    if (
      userContext.profile.role !== USER_ROLES.DEPARTMENT_OFFICER &&
      userContext.profile.role !== USER_ROLES.ADMIN
    ) {
      return { success: false, error: "Only department officers and administrators can pick up grievances." };
    }

    const updated = await assignComplaint(
      {
        complaintId,
        officerUid: userContext.profile.uid,
        officerName: userContext.profile.displayName,
        note: `Self-assigned by ${userContext.profile.displayName}`,
      },
      userContext,
      { requireUnassigned: true },
    );

    revalidatePath("/officer");
    revalidatePath(`/complaints/${complaintId}`);

    return {
      success: true,
      data: { complaintId: updated.complaintId, assignedTo: updated.assignedTo! },
    };
  } catch (error: unknown) {
    console.error("[AU-CTS Complaint Action] pickupComplaintAction failed:", error);
    const message = error instanceof Error ? error.message : "Failed to pick up complaint.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Start review on a pending complaint (Phase 4.2.1).
 * Transitions ticket from 'pending' to 'in_review'.
 * Derives actor identity strictly from the verified server session.
 */
export async function startReviewComplaintAction(
  complaintId: string,
  note?: string,
): Promise<ActionResponse<{ complaintId: string; status: string }>> {
  try {
    const userContext = await getAuthenticatedUser();
    if (!userContext) {
      return { success: false, error: "Authentication required to review complaints." };
    }

    const updated = await updateComplaintStatus(
      {
        complaintId,
        nextStatus: "in_review",
        note: note ? note.trim() : undefined,
      },
      userContext,
    );

    revalidatePath(`/complaints/${complaintId}`);
    revalidatePath("/complaints");
    revalidatePath("/officer");
    revalidatePath("/admin");

    return {
      success: true,
      data: { complaintId: updated.complaintId, status: updated.status },
    };
  } catch (error: unknown) {
    console.error("[AU-CTS Complaint Action] startReviewComplaintAction failed:", error);
    const message = error instanceof Error ? error.message : "Failed to start complaint review.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Resolve an in-review complaint (Phase 4.2.2).
 * Transitions ticket from 'in_review' (or 'escalated') to 'resolved'.
 * Derives actor identity strictly from the verified server session.
 */
export async function resolveComplaintAction(
  complaintId: string,
  resolution: string,
): Promise<ActionResponse<{ complaintId: string; status: string }>> {
  try {
    const userContext = await getAuthenticatedUser();
    if (!userContext) {
      return { success: false, error: "Authentication required to resolve complaints." };
    }

    const parseResult = resolveComplaintSchema.safeParse({
      complaintId,
      resolution,
    });
    if (!parseResult.success) {
      return {
        success: false,
        error:
          parseResult.error.issues[0]?.message || "Invalid resolution input.",
      };
    }

    const updated = await updateComplaintStatus(
      {
        complaintId: parseResult.data.complaintId,
        nextStatus: "resolved",
        resolution: parseResult.data.resolution,
      },
      userContext,
    );

    revalidatePath(`/complaints/${complaintId}`);
    revalidatePath("/complaints");
    revalidatePath("/officer");
    revalidatePath("/admin");

    return {
      success: true,
      data: { complaintId: updated.complaintId, status: updated.status },
    };
  } catch (error: unknown) {
    console.error("[AU-CTS Complaint Action] resolveComplaintAction failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to resolve complaint.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Submit feedback on a resolved complaint.
 */
export async function submitFeedbackAction(
  input: SubmitFeedbackInput,
): Promise<ActionResponse<{ complaintId: string }>> {
  try {
    const userContext = await getAuthenticatedUser();
    if (!userContext) {
      return { success: false, error: "Authentication required to submit feedback." };
    }

    const updated = await submitComplaintFeedback(input, userContext);
    revalidatePath(`/complaints/${input.complaintId}`);

    return {
      success: true,
      data: { complaintId: updated.complaintId },
    };
  } catch (error: unknown) {
    console.error("[AU-CTS Complaint Action] submitFeedback failed:", error);
    const message = error instanceof Error ? error.message : "Failed to submit feedback.";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Fetch a complaint by ID (for client lookup if needed).
 */
export async function getComplaintAction(
  complaintId: string,
): Promise<ActionResponse<unknown>> {
  try {
    const userContext = await getAuthenticatedUser();
    if (!userContext) {
      return { success: false, error: "Authentication required." };
    }

    const complaint = await getComplaintById(complaintId, userContext);
    if (!complaint) {
      return { success: false, error: "Complaint not found." };
    }

    return {
      success: true,
      data: complaint,
    };
  } catch (error: unknown) {
    console.error("[AU-CTS Complaint Action] getComplaint failed:", error);
    const message = error instanceof Error ? error.message : "Failed to retrieve complaint.";
    return { success: false, error: message };
  }
}
