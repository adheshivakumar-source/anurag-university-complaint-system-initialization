// src/app/(dashboard)/complaints/[id]/ReopenComplaintButton.tsx
// ============================================================
// Phase 5.2: Reopen Complaint Action Button & Modal (Client Component)
// Triggers resolved -> reopened status transition with mandatory reason.
// Rejects incomplete/ineffective resolutions and returns complaint to triage.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { reopenComplaintAction } from "@/server/complaints/actions";

interface ReopenComplaintButtonProps {
  complaintId: string;
}

export function ReopenComplaintButton({
  complaintId,
}: ReopenComplaintButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setError(null);
    setReason("");
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isPending) return;
    setIsOpen(false);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();

    if (trimmed.length < 10) {
      setError("Please provide a reason of at least 10 characters.");
      return;
    }

    if (trimmed.length > 1000) {
      setError("Reason must not exceed 1000 characters.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const response = await reopenComplaintAction(complaintId, trimmed);
        if (!response.success) {
          setError(response.error || "Failed to reopen grievance.");
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
        variant="secondary"
        size="sm"
        onClick={handleOpen}
        className="border-amber-600 text-amber-800 bg-amber-50 hover:bg-amber-100 shadow-sm focus:ring-amber-500"
        aria-label="Reopen this grievance"
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
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Reopen Grievance
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reopen-dialog-title"
        >
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-start justify-between border-b border-[#F1F5F9] pb-3">
              <div>
                <h3
                  id="reopen-dialog-title"
                  className="text-base font-semibold text-[#0F172A]"
                >
                  Reopen Grievance
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Explain why the resolution was unsatisfactory for complaint {complaintId}.
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
                  htmlFor="reopen-reason-input"
                  className="block text-xs font-semibold text-[#334155] uppercase tracking-wider mb-1"
                >
                  Reason for Reopening <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="reopen-reason-input"
                  rows={4}
                  required
                  minLength={10}
                  maxLength={1000}
                  disabled={isPending}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe why the issue is not fixed or why further remediation is needed..."
                  className="w-full rounded-md border border-[#CBD5E1] p-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 disabled:bg-[#F8FAFC] disabled:cursor-not-allowed"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[11px] text-[#64748B]">
                    Minimum 10 characters required.
                  </span>
                  <span
                    className={`text-[11px] ${
                      reason.trim().length > 1000
                        ? "text-red-600 font-semibold"
                        : "text-[#94A3B8]"
                    }`}
                  >
                    {reason.trim().length} / 1000
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
                  disabled={isPending || reason.trim().length < 10}
                  className="bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500"
                >
                  {isPending ? "Submitting..." : "Confirm Reopen"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
