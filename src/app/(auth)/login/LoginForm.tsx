"use client";
// src/app/(auth)/login/LoginForm.tsx
// Client Component — handles Firebase Auth sign-in interaction.
// Obtains ID token from Firebase client SDK, then calls the
// server-side signInAction to create the session cookie.

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { signInAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  redirectTo?: string;
}

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/user-not-found": "No account found with this email address.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/invalid-credential": "Invalid email or password. Please try again.",
  "auth/user-disabled": "This account has been disabled. Contact your administrator.",
  "auth/too-many-requests":
    "Too many failed attempts. Please wait a moment before trying again.",
  "auth/network-request-failed":
    "Network error. Please check your connection and try again.",
  "auth/invalid-email": "The email address is not valid.",
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

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

      // Step 2: Get the ID token
      const idToken = await credential.user.getIdToken();

      // Step 3: Exchange ID token for session cookie via Server Action
      const result = await signInAction(idToken, redirectTo ?? "/dashboard");

      if (result?.error) {
        setServerError(result.error);
      }
      // On success, signInAction redirects — this line won't be reached
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      const code = firebaseError.code ?? "";
      setServerError(
        FIREBASE_ERROR_MESSAGES[code] ??
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
              // Placeholder — password reset to be implemented in Phase 2
              alert("Password reset will be available in the next update.");
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
