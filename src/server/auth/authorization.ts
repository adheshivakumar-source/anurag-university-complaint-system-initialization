// src/lib/auth/authorization.ts
// ============================================================
// Server-side Authorization Helpers for AU-CTS.
//
// These helpers enforce the authoritative security hierarchy:
// 1. Session Cookie verification (Admin SDK)
// 2. Authoritative Firestore User Profile check (/users/{uid})
// 3. Active status check (inactive users rejected immediately)
// 4. Role-based authorization decisions
//
// NEVER trust client-provided claims or headers for authorization.
// ============================================================

import "server-only";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAdminAuth } from "@/server/firebase/admin";
import { getSessionCookieName, destroySession } from "./session";
import { getUserProfile, getOrCreateUserProfile } from "@/server/users/service";
import type {
  AuthenticatedUserContext,
  SessionUser,
  UserRole,
} from "@/shared/types";
import { USER_ROLES } from "@/shared/types";

/**
 * Validates the current session and retrieves the authoritative user context.
 * Returns null if unauthenticated, session expired, or account is deactivated.
 */
export async function getAuthenticatedUser(
  checkRevoked = false,
): Promise<AuthenticatedUserContext | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(getSessionCookieName())?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifySessionCookie(
      sessionCookie,
      checkRevoked,
    );

    // Fetch authoritative user profile from Firestore
    let profile = await getUserProfile(decoded.uid);

    // Fallback: If document was missing, create with safe defaults
    if (!profile) {
      profile = await getOrCreateUserProfile(decoded.uid, {
        email: decoded.email || "",
        displayName: decoded.name || decoded.email || "AU User",
      });
    }

    // Account Deactivation Check: Reject inactive accounts immediately
    if (!profile.isActive) {
      await destroySession();
      return null;
    }

    const sessionUser: SessionUser = {
      uid: profile.uid,
      email: profile.email,
      displayName: profile.displayName,
      role: profile.role,
      departmentId: profile.departmentId,
      isActive: profile.isActive,
    };

    return {
      user: sessionUser,
      profile,
    };
  } catch (error) {
    console.error("[AU-CTS] Session verification failed:", error);
    return null;
  }
}

/**
 * Enforces that the user is authenticated and active.
 * Redirects unauthenticated or deactivated users to /login.
 */
export async function requireAuthenticatedUser(
  redirectTo = "/login",
): Promise<AuthenticatedUserContext> {
  const context = await getAuthenticatedUser();

  if (!context) {
    redirect(redirectTo);
  }

  return context;
}

/**
 * Enforces that the authenticated user has an exact specific role.
 * Redirects unauthorized users to /dashboard.
 */
export async function requireRole(
  requiredRole: UserRole,
): Promise<AuthenticatedUserContext> {
  const context = await requireAuthenticatedUser();

  if (context.profile.role !== requiredRole) {
    redirect("/dashboard?error=unauthorized");
  }

  return context;
}

/**
 * Enforces that the authenticated user has one of the allowed roles.
 * Redirects unauthorized users to /dashboard.
 */
export async function requireAnyRole(
  allowedRoles: readonly UserRole[],
): Promise<AuthenticatedUserContext> {
  const context = await requireAuthenticatedUser();

  if (!allowedRoles.includes(context.profile.role)) {
    redirect("/dashboard?error=unauthorized");
  }

  return context;
}

/**
 * Enforces that the user is an Administrator.
 */
export async function requireAdmin(): Promise<AuthenticatedUserContext> {
  return requireRole(USER_ROLES.ADMIN);
}

/**
 * Enforces that the user is a Department Officer (or Admin).
 * Optionally verifies department scoping.
 */
export async function requireDepartmentOfficer(
  expectedDepartmentId?: string,
): Promise<AuthenticatedUserContext> {
  const context = await requireAnyRole([
    USER_ROLES.DEPARTMENT_OFFICER,
    USER_ROLES.ADMIN,
  ]);

  if (
    expectedDepartmentId &&
    context.profile.role === USER_ROLES.DEPARTMENT_OFFICER &&
    context.profile.departmentId !== expectedDepartmentId
  ) {
    redirect("/dashboard?error=department_mismatch");
  }

  return context;
}
