// src/lib/auth/session.ts
// ============================================================
// Server-side session management for AU-CTS.
//
// Authentication flow:
//   1. Client signs in with Firebase Auth (email/password)
//   2. Client obtains ID token from Firebase
//   3. Client POSTs ID token to /api/auth/session (Server Action)
//   4. Server verifies ID token with Admin SDK
//   5. Server creates a Firebase Session Cookie (up to 14 days)
//   6. Session cookie is set as HttpOnly, Secure, SameSite=Lax
//   7. Middleware reads cookie on every protected request
//   8. Server Components verify cookie independently for sensitive reads
//
// SECURITY: Session cookies are verified server-side on every protected
// request. The client cannot forge or tamper with the cookie.
// ============================================================

import "server-only";

import { cookies } from "next/headers";
import { getAdminAuth } from "@/server/firebase/admin";
import type { SessionUser } from "@/shared/types";
import type { UserRole } from "@/shared/types/auth";

const SESSION_COOKIE_NAME = "__session";
const SESSION_DURATION_MS = 60 * 60 * 24 * 7 * 1000; // 7 days
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Creates a Firebase session cookie from a verified ID token.
 * Called by the /api/auth/session Server Action after sign-in.
 *
 * @throws Error if ID token verification fails
 */
export async function createSession(idToken: string): Promise<void> {
  const adminAuth = getAdminAuth();

  // Verify the ID token before creating a session cookie.
  // This prevents forged tokens from creating sessions.
  await adminAuth.verifyIdToken(idToken);

  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION_MS,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
}

/**
 * Destroys the current session cookie.
 * Called on logout.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Verifies the current session cookie and returns the decoded user.
 * Returns null if no cookie, expired, or invalid.
 *
 * Use this in Server Components and Server Actions for defense-in-depth.
 * Middleware does a lightweight check; this does the full verification.
 *
 * @param checkRevoked - Set true to check if the token has been revoked.
 *   Slower (network request) but required for security-sensitive operations.
 */
export async function getVerifiedSession(
  checkRevoked = false,
): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifySessionCookie(
      sessionCookie,
      checkRevoked,
    );

    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      displayName: decoded.name ?? decoded.email ?? "",
      role: (decoded["role"] as UserRole) ?? "student",
      departmentId: (decoded["departmentId"] as string) ?? null,
      isActive: true,
    };
  } catch {
    // Token expired, revoked, or malformed — treat as unauthenticated
    return null;
  }
}

/**
 * Returns the session cookie value for lightweight Middleware checks.
 * Does NOT verify the signature — use getVerifiedSession() for that.
 */
export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}
