"use client";
// src/app/(auth)/register/RegisterForm.tsx
// Client Component — handles user registration via Firebase Auth
// and creates initial user profile via Server Action.

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getClientAuth } from "@/client/firebase/client";
import { registerAction } from "@/server/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { anuragEmailSchema } from "@/shared/validation/validation";
import { USER_ROLES } from "@/shared/types";
import type { UserRole } from "@/shared/types";

const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Name is too long"),
    email: anuragEmailSchema,
    role: z.enum(
      [USER_ROLES.STUDENT, USER_ROLES.FACULTY, USER_ROLES.STAFF] as const,
      { message: "Please select a valid role" },
    ),
    studentId: z.string().optional(),
    employeeId: z.string().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must include at least one uppercase letter")
      .regex(/[0-9]/, "Password must include at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use":
    "An account already exists with this email address. Please sign in instead.",
  "auth/invalid-email": "The email address is invalid.",
  "auth/weak-password": "The password is too weak.",
  "auth/operation-not-allowed":
    "Email/password accounts are not enabled. Contact IT support.",
};

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: USER_ROLES.STUDENT,
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);

    try {
      // Step 1: Create user with Firebase Auth Client SDK
      const auth = getClientAuth();
      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );

      // Step 2: Set displayName on Firebase User
      await updateProfile(credential.user, {
        displayName: data.displayName.trim(),
      });

      // Step 3: Get ID token
      const idToken = await credential.user.getIdToken(true);

      // Step 4: Register profile on server & create session
      const result = await registerAction(
        idToken,
        {
          displayName: data.displayName.trim(),
          role: data.role as UserRole,
          studentId: data.role === USER_ROLES.STUDENT ? data.studentId : null,
          employeeId:
            data.role === USER_ROLES.FACULTY || data.role === USER_ROLES.STAFF
              ? data.employeeId
              : null,
        },
        "/dashboard",
      );

      if (result?.error) {
        setServerError(result.error);
      }
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      const code = firebaseError.code ?? "";
      setServerError(
        FIREBASE_ERROR_MESSAGES[code] ??
          firebaseError.message ??
          "Registration failed. Please try again.",
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      {serverError && (
        <div
          role="alert"
          className="rounded border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]"
        >
          {serverError}
        </div>
      )}

      <Input
        label="Full Name"
        type="text"
        placeholder="e.g. Dr. Rajesh Kumar / Sneha Reddy"
        autoComplete="name"
        required
        error={errors.displayName?.message}
        {...register("displayName")}
      />

      <Input
        label="Institutional Email"
        type="email"
        placeholder="username@anurag.edu.in"
        autoComplete="email"
        required
        error={errors.email?.message}
        {...register("email")}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="role-select"
          className="text-xs font-semibold uppercase tracking-wider text-[#334155]"
        >
          Primary Role <span className="text-[#B91C1C]">*</span>
        </label>
        <select
          id="role-select"
          className="w-full rounded bg-white px-3 py-2 text-sm text-[#0F172A] border border-[#CBD5E1] transition-colors focus-visible:outline-none focus-visible:border-[#6B1724] focus-visible:shadow-[0_0_0_1px_#6B1724]"
          {...register("role")}
        >
          <option value={USER_ROLES.STUDENT}>Student</option>
          <option value={USER_ROLES.FACULTY}>Faculty</option>
          <option value={USER_ROLES.STAFF}>Administrative / Support Staff</option>
        </select>
        {errors.role && (
          <p role="alert" className="text-xs text-[#B91C1C] font-medium">
            {errors.role.message}
          </p>
        )}
      </div>

      {selectedRole === USER_ROLES.STUDENT && (
        <Input
          label="Student Roll / Registration ID"
          type="text"
          placeholder="e.g. 21AG1A0501"
          error={errors.studentId?.message}
          {...register("studentId")}
        />
      )}

      {(selectedRole === USER_ROLES.FACULTY ||
        selectedRole === USER_ROLES.STAFF) && (
        <Input
          label="Employee / Staff ID"
          type="text"
          placeholder="e.g. AU-EMP-408"
          error={errors.employeeId?.message}
          {...register("employeeId")}
        />
      )}

      <Input
        label="Password"
        type="password"
        placeholder="Minimum 8 characters (1 uppercase, 1 number)"
        autoComplete="new-password"
        required
        error={errors.password?.message}
        {...register("password")}
      />

      <Input
        label="Confirm Password"
        type="password"
        placeholder="Re-enter your password"
        autoComplete="new-password"
        required
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        className="w-full mt-2"
      >
        {isSubmitting ? "Creating Account…" : "Register Institutional Account"}
      </Button>

      <div className="text-center text-xs text-[#64748B] pt-2">
        Already have an institutional account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#6B1724] hover:underline"
        >
          Sign In here
        </Link>
      </div>
    </form>
  );
}
