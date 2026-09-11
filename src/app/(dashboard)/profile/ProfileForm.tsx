"use client";
// src/app/(dashboard)/profile/ProfileForm.tsx
// Client Component — allows users to update their display name,
// student roll ID, or employee ID.

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateSelfProfileAction } from "@/lib/users/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { UserProfileDTO } from "@/types";
import { USER_ROLES } from "@/types";

const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Name is too long"),
  studentId: z.string().optional(),
  employeeId: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialProfile: UserProfileDTO;
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [serverMessage, setServerMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: initialProfile.displayName,
      studentId: initialProfile.studentId || "",
      employeeId: initialProfile.employeeId || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setServerMessage(null);

    const result = await updateSelfProfileAction({
      displayName: data.displayName,
      studentId:
        initialProfile.role === USER_ROLES.STUDENT ? data.studentId : null,
      employeeId:
        initialProfile.role !== USER_ROLES.STUDENT ? data.employeeId : null,
    });

    if (result.error) {
      setServerMessage({ type: "error", text: result.error });
    } else {
      setServerMessage({
        type: "success",
        text: "Your profile details have been successfully updated.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverMessage && (
        <div
          role="alert"
          className={`rounded border px-4 py-3 text-sm ${
            serverMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {serverMessage.text}
        </div>
      )}

      <Input
        label="Full Name"
        type="text"
        required
        error={errors.displayName?.message}
        {...register("displayName")}
      />

      <Input
        label="Email Address (Institutional)"
        type="email"
        value={initialProfile.email}
        disabled
        hint="Email addresses are managed through central university IT directory."
      />

      {initialProfile.role === USER_ROLES.STUDENT && (
        <Input
          label="Student Roll / Registration ID"
          type="text"
          placeholder="e.g. 21AG1A0501"
          error={errors.studentId?.message}
          {...register("studentId")}
        />
      )}

      {initialProfile.role !== USER_ROLES.STUDENT && (
        <Input
          label="Employee / Staff ID"
          type="text"
          placeholder="e.g. AU-EMP-408"
          error={errors.employeeId?.message}
          {...register("employeeId")}
        />
      )}

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={!isDirty || isSubmitting}
        >
          {isSubmitting ? "Saving Changes…" : "Save Profile Changes"}
        </Button>
      </div>
    </form>
  );
}
