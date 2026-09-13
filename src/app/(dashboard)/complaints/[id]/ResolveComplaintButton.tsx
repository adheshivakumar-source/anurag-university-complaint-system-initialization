// src/app/(dashboard)/complaints/[id]/ResolveComplaintButton.tsx
// ============================================================
// Phase 4.2.2: Resolve Complaint Action Button & Modal (Client Component)
// Triggers in_review -> resolved status transition.
// Provides accessible resolution entry modal, character limits,
// duplicate-submission prevention, and error feedback.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { resolveComplaintAction } from "@/server/complaints/actions";

interface ResolveComplaintButtonProps {
  complaintId: string;
}

export function ResolveComplaintButton({
  complaintId,
}: ResolveComplaintButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setError(null);
    setResolution("");
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isPending) return;
    setIsOpen(false);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = resolution.trim();

    if (trimmed.length < 10) {
      setError("Resolution must be at least 10 characters.");
      return;
    }

    if (trimmed.length > 2000) {
      setError("Resolution details must not exceed 2000 characters.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const response = await resolveComplaintAction(complaintId, trimmed);
        if (!response.success) {
          setError(response.error || "Failed to resolve complaint.");
          return;
        }
        setIsOpen(false);
        router.refresh();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(message);
      }
    });
  };

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        onClick={handleOpen}
        className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm focus:ring-emerald-600"
        aria-label="Resolve this grievance"
      >
        <svg
          className="h-3.5 w-3.5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
        Resolve Complaint
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resolve-dialog-title"
        >
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-start justify-between border-b border-[#F1F5F9] pb-3">
              <div>
                <h3
                  id="resolve-dialog-title"
                  className="text-base font-semibold text-[#0F172A]"
                >
                  Resolve Grievance
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Provide official remediation notes for complaint {complaintId}.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="text-[#94A3B8] hover:text-[#475569] disabled:opacity-50 p-1 rounded focus:outline-none focus:ring-2 focus:ring-[#6B1724]"
                aria-label="Close dialog"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="resolution-input"
                  className="block text-xs font-semibold text-[#334155] uppercase tracking-wider mb-1"
                >
                  Official Resolution Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="resolution-input"
                  rows={4}
                  required
                  minLength={10}
                  maxLength={2000}
                  disabled={isPending}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe the remediation actions taken to resolve this grievance..."
                  className="w-full rounded-md border border-[#CBD5E1] p-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:bg-[#F8FAFC] disabled:cursor-not-allowed"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[11px] text-[#64748B]">
                    Minimum 10 characters required.
                  </span>
                  <span
                    className={`text-[11px] ${
                      resolution.trim().length > 2000
                        ? "text-red-600 font-semibold"
                        : "text-[#94A3B8]"
                    }`}
                  >
                    {resolution.trim().length} / 2000
                  </span>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2.5"
                >
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#F1F5F9]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isPending}
                  disabled={isPending || resolution.trim().length < 10}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white focus:ring-emerald-600"
                >
                  {isPending ? "Resolving..." : "Confirm Resolution"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
