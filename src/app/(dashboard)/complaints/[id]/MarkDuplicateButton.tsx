"use client";
// src/app/(dashboard)/complaints/[id]/MarkDuplicateButton.tsx
// ============================================================
// Mark Duplicate Modal — AU-CTS (Phase 5.5)
// ============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { markDuplicateAction } from "@/server/complaints/actions";

interface MarkDuplicateButtonProps {
  complaintId: string;
}

export function MarkDuplicateButton({ complaintId }: MarkDuplicateButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [duplicateOf, setDuplicateOf] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    setError(null);
    setDuplicateOf("");
    setNote("");
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isPending) return;
    setIsOpen(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicateOf.trim()) {
      setError("Original ticket ID is required.");
      return;
    }

    if (duplicateOf.trim() === complaintId) {
      setError("A complaint cannot be marked as a duplicate of itself.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await markDuplicateAction(
        complaintId,
        duplicateOf.trim(),
        note.trim() || undefined,
      );

      if (!res.success) {
        setError(res.error || "Failed to mark duplicate.");
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
        aria-label="Mark as duplicate"
      >
        Mark Duplicate
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-lg border border-[#CBD5E1] bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="duplicate-modal-title"
          >
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h3 id="duplicate-modal-title" className="text-base font-bold text-[#0F172A]">
                Mark as Duplicate
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

            <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <strong>Notice:</strong> Marking as duplicate will close this grievance in a terminal status and link it to the canonical original ticket.
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
                  htmlFor="duplicate-target-id"
                  className="block text-xs font-semibold text-[#334155] mb-1"
                >
                  Original Canonical Ticket ID:
                </label>
                <input
                  id="duplicate-target-id"
                  type="text"
                  placeholder="e.g. CTS-20260911-A8F2"
                  value={duplicateOf}
                  onChange={(e) => setDuplicateOf(e.target.value)}
                  className="w-full rounded border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#6B1724]"
                />
              </div>

              <div>
                <label
                  htmlFor="duplicate-note"
                  className="block text-xs font-semibold text-[#334155] mb-1"
                >
                  Additional Note (Optional):
                </label>
                <input
                  id="duplicate-note"
                  type="text"
                  placeholder="e.g. Same issue reported in Room 302"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#6B1724]"
                />
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
                  disabled={isPending || !duplicateOf.trim()}
                >
                  {isPending ? "Marking…" : "Confirm Duplicate"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
