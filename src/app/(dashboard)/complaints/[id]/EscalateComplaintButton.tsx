"use client";
// src/app/(dashboard)/complaints/[id]/EscalateComplaintButton.tsx
// ============================================================
// Escalate Complaint Modal — AU-CTS (Phase 5.6)
// ============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { escalateComplaintAction } from "@/server/complaints/actions";

interface EscalateComplaintButtonProps {
  complaintId: string;
  currentEscalationLevel?: number;
}

export function EscalateComplaintButton({
  complaintId,
  currentEscalationLevel = 0,
}: EscalateComplaintButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nextLevel = Math.min(3, currentEscalationLevel + 1);

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
      setError("Escalation reason must be at least 10 characters.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await escalateComplaintAction(complaintId, reason.trim());
      if (!res.success) {
        setError(res.error || "Failed to escalate complaint.");
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
        className="text-[#991B1B] border-[#FCA5A5] hover:bg-[#FEF2F2] hover:border-[#F87171] focus:ring-[#DC2626]"
      >
        <svg
          className="mr-1.5 h-4 w-4 text-[#DC2626]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        Escalate Complaint
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="escalate-dialog-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-[#E2E8F0] space-y-4">
            <div>
              <div className="flex items-center gap-2 text-[#991B1B]">
                <svg
                  className="h-5 w-5 text-[#DC2626]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h2 id="escalate-dialog-title" className="text-lg font-bold text-[#0F172A]">
                  Escalate Complaint to Level {nextLevel}
                </h2>
              </div>
              <p className="mt-1 text-xs text-[#64748B]">
                Escalating will notify higher administrative authorities and mark this complaint as urgent.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-800 border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="escalation-reason"
                  className="block text-xs font-semibold text-[#334155] mb-1"
                >
                  Escalation Reason & Context <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="escalation-reason"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this complaint requires escalation (e.g. SLA breach, unresolvable at department level, high severity)..."
                  className="w-full rounded-lg border border-[#CBD5E1] p-2.5 text-sm text-[#0F172A] focus:border-[#DC2626] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                  disabled={isPending}
                  required
                />
                <p className="mt-1 text-[11px] text-[#94A3B8]">
                  Minimum 10 characters. Character count: {reason.trim().length}/1000
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-[#F1F5F9]">
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
                  size="sm"
                  disabled={isPending || reason.trim().length < 10}
                  className="bg-[#DC2626] hover:bg-[#B91C1C] text-white focus:ring-[#DC2626]"
                >
                  {isPending ? "Escalating..." : `Confirm Escalation (Level ${nextLevel})`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
