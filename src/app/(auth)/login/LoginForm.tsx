"use client";
// src/app/(auth)/login/LoginForm.tsx
// Client Component — handles Firebase Auth sign-in interaction.
// Obtains ID token from Firebase client SDK, then calls the
// server-side signInAction to create the session cookie.

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getClientAuth } from "@/client/firebase/client";
import { signInAction } from "@/server/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { anuragEmailSchema } from "@/shared/validation/validation";

const loginSchema = z.object({
  email: anuragEmailSchema,
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  redirectTo?: string;
  initialError?: string;
}

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/user-not-found": "No account found with this email address.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/invalid-credential": "Invalid email or password. Please check your credentials.",
  "auth/user-disabled": "This account has been disabled. Please contact the administrator.",
  "auth/too-many-requests":
    "Too many failed attempts. Please wait a moment before trying again.",
  "auth/network-request-failed":
    "Network error. Please check your connection and try again.",
  "auth/invalid-email": "The email address format is invalid.",
  "auth/operation-not-allowed":
    "Email/Password sign-in is not enabled for this project. Contact IT support.",
  "auth/configuration-not-found":
    "Authentication is not configured. Contact IT support.",
};

export function LoginForm({ redirectTo, initialError }: LoginFormProps) {
  const [serverError, setServerError] = useState<string | null>(initialError || null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      // Step 1: Sign in with Firebase client SDK
      const auth = getClientAuth();
      const credential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );

      // Step 2: Get the ID token (force refresh to ensure latest claims)
      const idToken = await credential.user.getIdToken(true);

      // Step 3: Exchange ID token for session cookie via Server Action
      const result = await signInAction(idToken, redirectTo ?? "/dashboard");

      if (result?.error) {
        setServerError(result.error);
      }
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      const code = firebaseError.code ?? "";
      // Dev-only diagnostic: logs error code or error message — never logs passwords or tokens
      if (process.env.NODE_ENV === "development") {
        console.error(
          "[AU-CTS Auth] Firebase sign-in error:",
          code || (error instanceof Error ? error.message : "unknown_error"),
        );
      }
      setServerError(
        (code ? FIREBASE_ERROR_MESSAGES[code] : undefined) ??
          firebaseError.message ??
          "Sign in failed. Please check your credentials and try again.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {serverError && (
        <div
          role="alert"
          className="rounded border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]"
        >
          {serverError}
        </div>
      )}

      <Input
        label="Institutional Email"
        type="email"
        placeholder="you@anurag.edu.in"
        autoComplete="email"
        required
        error={errors.email?.message}
        {...register("email")}
      />

      <div className="flex flex-col gap-1.5">
        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="flex justify-end">
          <button
            type="button"
            className="text-xs text-[#6B1724] hover:underline underline-offset-4 cursor-pointer"
            onClick={() => {
              alert(
                "Password reset link can be sent to your institutional email. Contact itsupport@anurag.edu.in for manual resets.",
              );
            }}
          >
            Forgot password?
          </button>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        className="w-full mt-1"
      >
        {isSubmitting ? "Signing in…" : "Sign In"}
      </Button>

      <div className="text-center text-xs text-[#64748B] pt-2">
        New to Anurag University?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#6B1724] hover:underline"
        >
          Register an Account
        </Link>
      </div>

      <p className="text-center text-xs text-[#64748B]">
        Having trouble? Contact the{" "}
        <a
          href="mailto:itsupport@anurag.edu.in"
          className="text-[#6B1724] hover:underline"
        >
          IT Help Desk
        </a>
      </p>
    </form>
  );
}
