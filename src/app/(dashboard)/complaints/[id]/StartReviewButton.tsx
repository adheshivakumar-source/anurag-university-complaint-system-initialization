// src/app/(dashboard)/complaints/[id]/StartReviewButton.tsx
// ============================================================
// Phase 4.2.1: Start Review Action Button (Client Component)
// Triggers pending -> in_review status transition.
// Features loading state, duplicate submission prevention,
// error feedback, and accessible styling.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { startReviewComplaintAction } from "@/server/complaints/actions";

interface StartReviewButtonProps {
  complaintId: string;
}

export function StartReviewButton({ complaintId }: StartReviewButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleStartReview = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await startReviewComplaintAction(complaintId);
        if (!response.success) {
          setError(response.error || "Failed to start review.");
          return;
        }
        router.refresh();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(message);
      }
    });
  };

  return (
    <div className="inline-flex flex-col items-end">
      <Button
        variant="primary"
        size="sm"
        isLoading={isPending}
        disabled={isPending}
        onClick={handleStartReview}
        className="shadow-sm"
        aria-label="Start Review on this grievance"
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
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {isPending ? "Starting..." : "Start Review"}
      </Button>

      {error && (
        <div
          role="alert"
          className="mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 max-w-xs"
        >
          {error}
        </div>
      )}
    </div>
  );
}