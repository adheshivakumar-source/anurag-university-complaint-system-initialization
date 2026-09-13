"use client";
// src/app/(dashboard)/complaints/new/ComplaintForm.tsx
// Client Component — interactive complaint submission form for AU-CTS.
// Connects to the server-only service via createComplaintAction().

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  createComplaintSchema,
  type CreateComplaintFormData,
} from "@/shared/validation/validation";
import { createComplaintAction } from "@/server/complaints/actions";
import {
  DEPARTMENT_CONFIGS,
  PROVISIONAL_DEFAULT_SLA,
} from "@/server/complaints/routing";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  type ComplaintCategory,
  type ComplaintPriority,
} from "@/shared/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface SuccessReceipt {
  complaintId: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  departmentName: string;
  submittedAt: string;
}

export function ComplaintForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<SuccessReceipt | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateComplaintFormData>({
    resolver: zodResolver(createComplaintSchema),
    defaultValues: {
      category: COMPLAINT_CATEGORIES.MAINTENANCE,
      priority: COMPLAINT_PRIORITIES.MEDIUM,
      title: "",
      description: "",
      location: "",
      attachments: [],
    },
  });

  const selectedCategory = watch("category") || COMPLAINT_CATEGORIES.MAINTENANCE;
  const selectedPriority = watch("priority") || COMPLAINT_PRIORITIES.MEDIUM;
  const descriptionValue = watch("description") || "";

  const departmentConfig = DEPARTMENT_CONFIGS[selectedCategory];
  const provisionalHours =
    PROVISIONAL_DEFAULT_SLA[selectedCategory]?.[selectedPriority] ?? 24;

  const onSubmit = async (data: CreateComplaintFormData) => {
    setServerError(null);

    const result = await createComplaintAction(data);

    if (!result.success || !result.data) {
      setServerError(result.error || "Failed to submit grievance. Please try again.");
      return;
    }

    setReceipt({
      complaintId: result.data.complaintId,
      category: data.category,
      priority: data.priority,
      departmentName: departmentConfig?.departmentName || "General Department",
      submittedAt: new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    });
  };

  const handleResetForm = () => {
    reset();
    setReceipt(null);
    setServerError(null);
  };

  // ── Success State View (Option A) ──────────────────────────
  if (receipt) {
    return (
      <Card className="max-w-2xl mx-auto border-emerald-200 bg-white shadow-md">
        <CardHeader className="bg-emerald-50/70 border-b border-emerald-100 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-emerald-950 text-lg">
                Grievance Registered Successfully
              </CardTitle>
              <p className="text-xs text-emerald-800 mt-0.5">
                Your complaint has been queued for official department triage.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 flex flex-col gap-5">
          <div className="rounded-lg bg-[#F8FAFC] p-4 border border-[#E2E8F0] flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Complaint Tracking ID
              </span>
              <span className="font-mono text-base font-bold text-[#6B1724]">
                {receipt.complaintId}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-[#64748B] block font-medium uppercase">
                  Target Department
                </span>
                <p className="font-semibold text-[#0F172A]">{receipt.departmentName}</p>
              </div>

              <div>
                <span className="text-xs text-[#64748B] block font-medium uppercase">
                  Current Status
                </span>
                <div className="mt-0.5">
                  <Badge variant="submitted">Submitted</Badge>
                </div>
              </div>

              <div>
                <span className="text-xs text-[#64748B] block font-medium uppercase">
                  Priority Level
                </span>
                <div className="mt-0.5">
                  <Badge
                    variant={
                      receipt.priority === "critical"
                        ? "critical"
                        : receipt.priority === "high"
                        ? "high"
                        : receipt.priority === "low"
                        ? "low"
                        : "medium"
                    }
                  >
                    {PRIORITY_LABELS[receipt.priority]}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-xs text-[#64748B] block font-medium uppercase">
                  Submitted On
                </span>
                <p className="text-[#0F172A]">{receipt.submittedAt}</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-[#64748B] leading-relaxed bg-[#FFFDF5] p-3.5 rounded border border-[#FEF3C7]">
            <strong>Next Steps:</strong> The department officer will review your grievance and
            update the ticket to <em>In Review</em>. You can monitor progress and resolution
            milestones in your complaints dashboard.
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-end bg-[#F8FAFC] p-5">
          <Button variant="secondary" onClick={handleResetForm} className="w-full sm:w-auto">
            Submit Another Grievance
          </Button>
          <Link href="/complaints" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full sm:w-auto">
              View My Complaints →
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // ── Complaint Form View ────────────────────────────────────
  return (
    <Card className="max-w-2xl mx-auto bg-white shadow-sm border-[#CBD5E1]">
      <CardHeader className="border-b border-[#E2E8F0] p-6">
        <div>
          <CardTitle className="text-xl text-[#0F172A]">
            File an Institutional Grievance
          </CardTitle>
          <p className="text-xs text-[#64748B] mt-1">
            Submit an official grievance to Anurag University administration. Fields
            marked with <span className="text-[#B91C1C]">*</span> are required.
          </p>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="p-6 flex flex-col gap-6">
          {serverError && (
            <div
              role="alert"
              className="rounded border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]"
            >
              {serverError}
            </div>
          )}

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Complaint Category"
              required
              error={errors.category?.message}
              hint={`Routes to: ${departmentConfig?.departmentName || "Assigned Department"}`}
              {...register("category")}
            >
              {Object.values(COMPLAINT_CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </Select>

            <Select
              label="Priority Level"
              required
              error={errors.priority?.message}
              hint={`Provisional system target: ${provisionalHours} hours (subject to admin review)`}
              {...register("priority")}
            >
              {Object.values(COMPLAINT_PRIORITIES).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </Select>
          </div>

          {/* Title */}
          <Input
            label="Grievance Title"
            placeholder="Brief summary of the issue (e.g. AC malfunction in Block C Room 304)"
            required
            error={errors.title?.message}
            hint="10 to 120 characters"
            {...register("title")}
          />

          {/* Campus Location */}
          <Input
            label="Campus Location (Optional)"
            placeholder="e.g. Block B, 2nd Floor, Room 204 / Girls Hostel Wing A"
            error={errors.location?.message}
            hint="Specific building, floor, room number, or landmark"
            {...register("location")}
          />

          {/* Detailed Description */}
          <div className="flex flex-col gap-1">
            <Textarea
              label="Detailed Description"
              rows={5}
              placeholder="Provide a comprehensive description of the grievance, what occurred, when it was noticed, and any relevant details..."
              required
              error={errors.description?.message}
              {...register("description")}
            />
            <div className="flex justify-between text-[11px] text-[#64748B] px-0.5">
              <span>Minimum 20 characters</span>
              <span className={descriptionValue.length > 2000 ? "text-[#B91C1C] font-semibold" : ""}>
                {descriptionValue.length} / 2000 characters
              </span>
            </div>
          </div>

          {/* Informational Attachments Section (M2 Scope) */}
          <div className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 flex items-start gap-3">
            <div className="text-[#64748B] mt-0.5 flex-shrink-0" aria-hidden="true">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.373L8.552 18.32a1.5 1.5 0 01-2.122-2.122l8.76-8.76"
                />
              </svg>
            </div>
            <div className="text-xs text-[#475569]">
              <strong className="text-[#0F172A] block font-semibold mb-0.5">
                Attachments
              </strong>
              <span>
                File attachment upload (supporting PDF, JPEG, PNG documents under 10MB) will
                be available in a future update.
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-[#E2E8F0] bg-[#F8FAFC] p-5">
          <Link href="/complaints">
            <Button type="button" variant="ghost" size="sm">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registering Grievance…" : "Submit Grievance"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
