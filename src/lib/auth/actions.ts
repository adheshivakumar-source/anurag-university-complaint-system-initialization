// src/lib/auth/actions.ts
// ============================================================
// Server Actions for authentication operations.
// These run exclusively on the server — never in the browser.
//
// Pattern: Client obtains Firebase ID token → posts to Server Action
// → Server Action verifies with Admin SDK → sets session cookie.
// ============================================================

"use server";

import { createSession, destroySession } from "./session";
import { redirect } from "next/navigation";

/**
 * Establishes a server-side session after client-side Firebase sign-in.
 *
 * The client calls this with the Firebase ID token obtained from
 * user.getIdToken() after signInWithEmailAndPassword succeeds.
 *
 * @param idToken - Firebase ID token from the client-side auth SDK
 * @param redirectTo - Optional path to redirect after successful session creation
 */
export async function signInAction(
  idToken: string,
  redirectTo: string = "/dashboard",
): Promise<{ error: string } | null> {
  try {
    await createSession(idToken);
  } catch (error) {
    console.error("[AU-CTS] Session creation failed:", error);
    return { error: "Authentication failed. Please try again." };
  }

  // redirect() throws a special Next.js error — must be called outside try/catch
  redirect(redirectTo);
}

/**
 * Destroys the current session and redirects to the login page.
 * Safe to call from any Server Action or Server Component.
 */
export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
