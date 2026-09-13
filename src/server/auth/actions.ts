// src/lib/auth/actions.ts
// ============================================================
// Server Actions for authentication operations.
// These run exclusively on the server — never in the browser.
//
// Pattern: Client obtains Firebase ID token → posts to Server Action
// → Server Action verifies with Admin SDK → checks active status
// → sets session cookie → redirects to dashboard.
// ============================================================

"use server";

import { redirect } from "next/navigation";
import { getAdminAuth } from "@/server/firebase/admin";
import { createSession, destroySession } from "./session";
import { getOrCreateUserProfile } from "@/server/users/service";
import { isAnuragEmail } from "@/shared/validation/validation";
import type { UserRole, SelfRegisterRole } from "@/shared/types";
import { USER_ROLES, SELF_REGISTER_ROLES } from "@/shared/types";

/**
 * Establishes a server-side session after client-side Firebase sign-in.
 * Validates active account status and authorized institutional email domain
 * before allowing session creation.
 */
export async function signInAction(
  idToken: string,
  redirectTo: string = "/dashboard",
): Promise<{ error: string } | null> {
  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(idToken);
    const verifiedEmail = decoded.email || "";

    // Security Gate: Ensure email strictly belongs to Anurag University domain
    if (!isAnuragEmail(verifiedEmail)) {
      return {
        error: "Only Anurag University (@anurag.edu.in) accounts are permitted.",
      };
    }

    // Retrieve or initialize the user profile in Firestore
    const profile = await getOrCreateUserProfile(decoded.uid, {
      email: verifiedEmail,
      displayName: decoded.name || decoded.email || undefined,
    });

    // Check account status: Reject deactivated accounts
    if (!profile.isActive) {
      return {
        error: "This account has been deactivated. Please contact the administrator.",
      };
    }

    // Create session cookie
    await createSession(idToken);
  } catch (error) {
    console.error("[AU-CTS] Sign-in session creation failed:", error);
    return { error: "Authentication failed. Please verify your credentials." };
  }

  // Next.js redirect must be called outside the try/catch block
  redirect(redirectTo);
}

/**
 * Handles initial user registration after client-side account creation.
 * Enforces institutional email domain and role whitelist.
 */
export async function registerAction(
  idToken: string,
  payload: {
    displayName: string;
    role: UserRole;
    studentId?: string | null;
    employeeId?: string | null;
  },
  redirectTo: string = "/dashboard",
): Promise<{ error: string } | null> {
  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(idToken);
    const verifiedEmail = decoded.email || "";

    // Security Gate: Ensure email strictly belongs to Anurag University domain
    if (!isAnuragEmail(verifiedEmail)) {
      // Clean up the unauthorized Firebase Auth account created by the client SDK
      try {
        await adminAuth.deleteUser(decoded.uid);
      } catch (cleanupError) {
        console.warn(
          "[AU-CTS] Failed to cleanup unauthorized auth user:",
          cleanupError,
        );
      }
      return {
        error: "Only Anurag University (@anurag.edu.in) accounts are permitted.",
      };
    }

    // Security Gate: Ensure role is restricted to non-privileged self-register roles
    let validatedRole: UserRole = USER_ROLES.STUDENT;
    if (SELF_REGISTER_ROLES.includes(payload.role as SelfRegisterRole)) {
      validatedRole = payload.role;
    } else {
      console.warn(`[AU-CTS] Attempted self-registration with unauthorized role: ${payload.role}`);
      return { error: "Invalid role selected for self-registration." };
    }

    // Initialize user profile in Firestore and assign custom claims
    await getOrCreateUserProfile(decoded.uid, {
      email: verifiedEmail,
      displayName: payload.displayName.trim(),
      requestedRole: validatedRole,
      studentId: payload.studentId ? payload.studentId.trim() : null,
      employeeId: payload.employeeId ? payload.employeeId.trim() : null,
    });

    // Create session cookie
    await createSession(idToken);
  } catch (error) {
    console.error("[AU-CTS] Registration session creation failed:", error);
    return { error: "Registration failed. Please try again." };
  }

  redirect(redirectTo);
}

/**
 * Destroys the current session and redirects to the login page.
 */
export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
