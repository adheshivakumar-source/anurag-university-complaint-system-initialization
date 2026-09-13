// src/lib/firebase/admin.ts
// ============================================================
// Server-only Firebase Admin SDK initialization.
//
// CRITICAL SECURITY BOUNDARY:
// This module must NEVER be imported in:
//   - Client Components ('use client')
//   - Pages rendered on the client
//   - Any file that could be bundled for the browser
//
// The 'server-only' package import enforces this at build time —
// Next.js will throw a build error if this module is accidentally
// imported in a Client Component.
//
// The Admin SDK bypasses Firestore Security Rules. All data access
// through this module must implement its own authorization checks.
// ============================================================

import "server-only";

import {
  initializeApp,
  getApps,
  cert,
  getApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

/**
 * Parse the service account from the environment variable.
 * The service account JSON should be minified to a single line in .env.local.
 * In production, load it from GCP Secret Manager / Vercel Environment Variables.
 */
function getServiceAccount() {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    // In development with emulators, we can run without credentials.
    // In production, this is a fatal misconfiguration.
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[AU-CTS] FIREBASE_SERVICE_ACCOUNT_KEY is required in production. " +
          "Set it in your environment variables.",
      );
    }
    return undefined;
  }

  try {
    return JSON.parse(serviceAccountKey);
  } catch {
    throw new Error(
      "[AU-CTS] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. " +
        "Ensure the service account JSON is properly minified to a single line.",
    );
  }
}

/**
 * Returns the Firebase Admin app instance (singleton).
 * Uses Application Default Credentials when no service account is provided
 * (e.g., running on Google Cloud infrastructure or with emulators).
 */
function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccount = getServiceAccount();

  return initializeApp({
    credential: serviceAccount
      ? cert(serviceAccount)
      : undefined, // Falls back to Application Default Credentials
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

/**
 * Firebase Admin Auth instance.
 * Use for: verifyIdToken, verifySessionCookie, setCustomUserClaims.
 */
export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

/**
 * Firestore Admin instance.
 * Bypasses security rules — implement authorization in Server Actions/Functions.
 * Use for: server-side reads/writes that require elevated access.
 */
export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}

/**
 * Firebase Admin Storage instance.
 * Use for: generating signed URLs for complaint attachments.
 * Signed URLs must be generated server-side and should have short expiry.
 */
export function getAdminStorage(): Storage {
  return getStorage(getAdminApp());
}
