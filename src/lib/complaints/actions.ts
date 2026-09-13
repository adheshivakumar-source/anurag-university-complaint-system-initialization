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

import { getAuthenticatedUser } from "@/lib/auth/authorization";
import {
  createComplaint,
  updateComplaintStatus,
  assignComplaint,
  submitComplaintFeedback,
  getComplaintById,
} from "./service";
import type {
  CreateComplaintInput,
  CreateComplaintFormData,
  UpdateComplaintStatusInput,
  AssignComplaintInput,
  SubmitFeedbackInput,
} from "./validation";
import { USER_ROLES } from "@/types";
import { revalidatePath } from "next/cache";

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
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
