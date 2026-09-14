// src/app/(dashboard)/complaints/[id]/CloseComplaintButton.tsx
// ============================================================
// Phase 5.2: Close Complaint Action Button & Modal (Client Component)
// Triggers resolved -> closed terminal status transition.
// Confirms submitter satisfaction and completes the grievance lifecycle.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { closeComplaintAction } from "@/server/complaints/actions";

interface CloseComplaintButtonProps {
  complaintId: string;
}

export function CloseComplaintButton({
  complaintId,
}: CloseComplaintButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setError(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isPending) return;
    setIsOpen(false);
    setError(null);
  };

  const handleConfirmClose = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await closeComplaintAction(complaintId);
        if (!response.success) {
          setError(response.error || "Failed to close grievance.");
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
        aria-label="Close this grievance"
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
        Close Grievance
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="close-dialog-title"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-start justify-between border-b border-[#F1F5F9] pb-3">
              <div>
                <h3
                  id="close-dialog-title"
                  className="text-base font-semibold text-[#0F172A]"
                >
                  Close Grievance
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Confirm resolution for complaint {complaintId}.
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

            <div className="text-sm text-[#334155] leading-relaxed">
              Are you satisfied with the resolution? Closing this grievance completes the ticket lifecycle. Once closed, this ticket cannot be reopened.
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
                type="button"
                variant="primary"
                size="sm"
                isLoading={isPending}
                disabled={isPending}
                onClick={handleConfirmClose}
                className="bg-emerald-700 hover:bg-emerald-800 text-white focus:ring-emerald-600"
              >
                {isPending ? "Closing..." : "Confirm Closure"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
