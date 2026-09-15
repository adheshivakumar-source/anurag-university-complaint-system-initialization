"use client";
// src/app/(dashboard)/complaints/[id]/RejectComplaintButton.tsx
// ============================================================
// Reject Complaint Modal — AU-CTS (Phase 5.5)
// ============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { rejectComplaintAction } from "@/server/complaints/actions";

interface RejectComplaintButtonProps {
  complaintId: string;
}

export function RejectComplaintButton({ complaintId }: RejectComplaintButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setError("Rejection reason must be at least 10 characters.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await rejectComplaintAction(complaintId, reason.trim());
      if (!res.success) {
        setError(res.error || "Failed to reject complaint.");
        return;
      }

      setIsOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleOpen}
        className="text-[#991B1B] hover:bg-[#FFF0F0]"
        aria-label="Reject grievance"
      >
        Reject Grievance
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-lg border border-[#CBD5E1] bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-modal-title"
          >
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h3 id="reject-modal-title" className="text-base font-bold text-[#991B1B]">
                Reject Grievance
              </h3>
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="text-[#94A3B8] hover:text-[#0F172A] disabled:opacity-50"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 rounded border border-[#FECDD3] bg-[#FFF0F0] p-3 text-xs text-[#991B1B]">
              <strong>Warning:</strong> Rejecting a grievance is a permanent terminal action. The submitter will be notified with your explanation.
            </div>

            {error && (
              <div
                role="alert"
                className="mt-3 rounded border border-[#FECDD3] bg-[#FFF0F0] p-3 text-xs text-[#991B1B]"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="reject-reason"
                  className="block text-xs font-semibold text-[#334155] mb-1"
                >
                  Mandatory Rejection Reason:
                </label>
                <textarea
                  id="reject-reason"
                  rows={4}
                  placeholder="Provide an official justification explaining why this grievance cannot be processed (min 10 characters)…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#991B1B]"
                />
                <span className="text-[11px] text-[#64748B]">
                  {reason.trim().length}/10 minimum characters
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F1F5F9]">
                <Button
                  type="button"
                  variant="ghost"
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
                  className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white"
                  disabled={isPending || reason.trim().length < 10}
                >
                  {isPending ? "Rejecting…" : "Confirm Rejection"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
