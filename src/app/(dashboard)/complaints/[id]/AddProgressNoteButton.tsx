"use client";
// src/app/(dashboard)/complaints/[id]/AddProgressNoteButton.tsx
// ============================================================
// Add Internal Progress Note Modal — AU-CTS (Phase 5.6)
// ============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { addComplaintNoteAction } from "@/server/complaints/actions";

interface AddProgressNoteButtonProps {
  complaintId: string;
}

export function AddProgressNoteButton({ complaintId }: AddProgressNoteButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    setError(null);
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
    if (note.trim().length < 5) {
      setError("Investigation note must be at least 5 characters.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await addComplaintNoteAction(complaintId, note.trim());
      if (!res.success) {
        setError(res.error || "Failed to add investigation note.");
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
        className="text-[#0E7490] border-[#A5F3FC] hover:bg-[#ECFEFF] hover:border-[#67E8F9] focus:ring-[#0891B2]"
      >
        <svg
          className="mr-1.5 h-4 w-4 text-[#0891B2]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Add Investigation Note
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-dialog-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-[#E2E8F0] space-y-4">
            <div>
              <div className="flex items-center gap-2 text-[#0E7490]">
                <svg
                  className="h-5 w-5 text-[#0891B2]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h2 id="note-dialog-title" className="text-lg font-bold text-[#0F172A]">
                  Add Investigation Note
                </h2>
              </div>
              <p className="mt-1 text-xs text-[#64748B]">
                Record an internal operational note or investigation update. This will be visible to department officers and administrators.
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
                  htmlFor="progress-note"
                  className="block text-xs font-semibold text-[#334155] mb-1"
                >
                  Progress Note & Findings <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="progress-note"
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Record investigation findings, vendor updates, inspection notes, or remediation progress..."
                  className="w-full rounded-lg border border-[#CBD5E1] p-2.5 text-sm text-[#0F172A] focus:border-[#0891B2] focus:outline-none focus:ring-1 focus:ring-[#0891B2]"
                  disabled={isPending}
                  required
                />
                <p className="mt-1 text-[11px] text-[#94A3B8]">
                  Minimum 5 characters. Character count: {note.trim().length}/1000
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
                  disabled={isPending || note.trim().length < 5}
                  className="bg-[#0891B2] hover:bg-[#0E7490] text-white focus:ring-[#0891B2]"
                >
                  {isPending ? "Recording Note..." : "Save Progress Note"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
