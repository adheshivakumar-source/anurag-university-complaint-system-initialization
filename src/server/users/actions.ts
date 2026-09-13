// src/lib/users/actions.ts
// ============================================================
// Server Actions for User Management (Admin & User Self-Profile).
// All actions enforce server-side authentication and role checks.
// ============================================================

"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuthenticatedUser } from "@/server/auth/authorization";
import {
  adminUpdateUserRoleAndDept,
  adminToggleUserActiveStatus,
  updateUserSelfProfile,
  serializeUserProfile,
} from "./service";
import type { UserRole, UserProfileDTO } from "@/shared/types";
import { USER_ROLES } from "@/shared/types";

/**
 * Admin action: Update a user's role and department.
 */
export async function adminUpdateUserRoleAction(payload: {
  targetUid: string;
  role: UserRole;
  departmentId?: string | null;
}): Promise<{ success?: boolean; user?: UserProfileDTO; error?: string }> {
  try {
    // 1. Enforce admin role on the caller
    await requireAdmin();

    // 2. Validate role
    if (!Object.values(USER_ROLES).includes(payload.role)) {
      return { error: "Invalid role specified." };
    }

    // 3. Update Firestore + Custom Claims
    const updated = await adminUpdateUserRoleAndDept(payload.targetUid, {
      role: payload.role,
      departmentId: payload.departmentId,
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${payload.targetUid}`);

    return {
      success: true,
      user: serializeUserProfile(updated),
    };
  } catch (error) {
    console.error("[AU-CTS] Admin role update failed:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to update user role.",
    };
  }
}

/**
 * Admin action: Toggle user account activation status.
 */
export async function adminToggleUserStatusAction(payload: {
  targetUid: string;
  isActive: boolean;
}): Promise<{ success?: boolean; user?: UserProfileDTO; error?: string }> {
  try {
    const adminContext = await requireAdmin();

    const updated = await adminToggleUserActiveStatus(
      adminContext.profile.uid,
      payload.targetUid,
      payload.isActive,
    );

    revalidatePath("/admin/users");
    return {
      success: true,
      user: serializeUserProfile(updated),
    };
  } catch (error) {
    console.error("[AU-CTS] Admin status toggle failed:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to update user status.",
    };
  }
}

/**
 * User self-service action: Update display name and identity IDs.
 */
export async function updateSelfProfileAction(payload: {
  displayName?: string;
  studentId?: string | null;
  employeeId?: string | null;
}): Promise<{ success?: boolean; user?: UserProfileDTO; error?: string }> {
  try {
    const userContext = await requireAuthenticatedUser();

    const updated = await updateUserSelfProfile(userContext.profile.uid, {
      displayName: payload.displayName,
      studentId: payload.studentId,
      employeeId: payload.employeeId,
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");

    return {
      success: true,
      user: serializeUserProfile(updated),
    };
  } catch (error) {
    console.error("[AU-CTS] Profile update failed:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to update profile.",
    };
  }
}
