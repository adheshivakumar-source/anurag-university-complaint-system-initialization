// src/utils/auth-errors.ts
// ============================================================
// Centralized authentication error message mapper for AU-CTS.
// Ensures user-friendly, secure, institutional error messages.
// Never exposes raw Firebase internals, credentials, or tokens.
// ============================================================

import { isRedirectError } from "next/dist/client/components/redirect-error";

export interface MappedAuthError {
  title?: string;
  message: string;
}

/**
 * Checks whether an error is a Next.js redirect signal/exception.
 * Ensures server action and navigation redirects are not incorrectly treated
 * as application or authentication errors.
 */
export function isNextRedirect(error: unknown): boolean {
  if (isRedirectError(error)) {
    return true;
  }
  if (typeof error === "object" && error !== null) {
    const err = error as { digest?: unknown; message?: unknown };
    if (typeof err.digest === "string" && err.digest.startsWith("NEXT_REDIRECT")) {
      return true;
    }
    if (typeof err.message === "string" && err.message.includes("NEXT_REDIRECT")) {
      return true;
    }
  }
  return false;
}

export function mapAuthError(codeOrMessage: string | undefined | null): MappedAuthError {
  if (!codeOrMessage) {
    return {
      message: "Something went wrong. Please try again.",
    };
  }

  const raw = codeOrMessage.trim();

  // Check for university email domain restriction
  if (
    raw.toLowerCase().includes("@anurag.edu.in") ||
    raw.toLowerCase().includes("university") ||
    raw.toLowerCase().includes("domain")
  ) {
    return {
      message: "Please enter a valid email address.",
    };
  }

  switch (raw) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return {
        message: "Invalid email or password. Please try again.",
      };

    case "auth/user-not-found":
      return {
        message: "Account not found. Please register before signing in.",
      };

    case "auth/email-already-in-use":
      return {
        message: "An account already exists with this email. Please sign in instead.",
      };

    case "auth/weak-password":
      return {
        message: "Please choose a stronger password.",
      };

    case "auth/too-many-requests":
      return {
        message: "Too many attempts. Please wait a moment and try again.",
      };

    case "auth/user-disabled":
      return {
        message: "This account has been disabled. Please contact the administrator.",
      };

    case "auth/network-request-failed":
      return {
        message: "Network connection error. Please check your connection.",
      };

    case "auth/invalid-email":
      return {
        message: "Please enter a valid email address.",
      };

    case "auth/operation-not-allowed":
      return {
        message: "Email/password accounts are not enabled. Contact IT support.",
      };

    default:
      if (raw.startsWith("auth/")) {
        return {
          message: "Authentication failed. Please check your credentials.",
        };
      }
      return {
        message: raw || "Something went wrong. Please try again.",
      };
  }
}
