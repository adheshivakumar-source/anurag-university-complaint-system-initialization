// src/lib/firebase/client.ts
// ============================================================
// Client-side Firebase SDK initialization.
//
// IMPORTANT: This module is safe to import in Client Components.
// It uses ONLY NEXT_PUBLIC_ environment variables.
// It must NEVER import firebase-admin or any server-only module.
//
// Uses the singleton pattern via getApps() to prevent re-initialization
// during React hot reloads in development.
// ============================================================

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

// Validate at module load time in development so misconfigured env vars
// are caught immediately rather than surfacing as cryptic Firebase errors.
if (process.env.NODE_ENV === "development") {
  const missingVars = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missingVars.length > 0) {
    console.warn(
      `[AU-CTS] Missing Firebase client environment variables:\n  ${missingVars.join("\n  ")}\n` +
        `  Check .env.local — see .env.example for required variable names.`,
    );
  }
}

/**
 * Returns the Firebase client app instance (singleton).
 * Safe to call multiple times — returns the existing app after first init.
 */
function getFirebaseApp(): FirebaseApp {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}

/**
 * Firebase Auth instance for client-side use.
 * Use this for sign-in, sign-out, and onAuthStateChanged listeners.
 */
export function getClientAuth(): Auth {
  return getAuth(getFirebaseApp());
}

/**
 * Firestore client instance.
 * Use for real-time listeners (onSnapshot) in Client Components.
 * Server-side Firestore reads/writes should use the Admin SDK instead.
 */
export function getClientFirestore(): Firestore {
  return getFirestore(getFirebaseApp());
}

/**
 * Firebase Storage client instance.
 * Use for file upload progress listeners in Client Components.
 * Signed URL generation must be done server-side via Admin SDK.
 */
export function getClientStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp());
}
