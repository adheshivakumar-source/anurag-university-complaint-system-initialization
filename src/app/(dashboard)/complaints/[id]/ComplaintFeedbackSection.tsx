// src/app/(dashboard)/complaints/[id]/ComplaintFeedbackSection.tsx
// ============================================================
// Post-Resolution Feedback Component for AU-CTS Complaints
// Enforces server-side validation and duplicate submission protection.
// ============================================================

"use client";

import { useState } from "react";
import type { ComplaintDTO, ComplaintFeedbackDTO } from "@/types";
import { COMPLAINT_STATUSES } from "@/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { submitFeedbackAction } from "@/lib/complaints/actions";

interface ComplaintFeedbackSectionProps {
  complaint: ComplaintDTO;
  isSubmitter: boolean;
}

function formatFeedbackDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return isoString;
  }
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`h-6 w-6 transition-colors ${
        filled ? "text-amber-400 fill-amber-400" : "text-slate-300 fill-none"
      }`}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}

export function ComplaintFeedbackSection({
  complaint,
  isSubmitter,
}: ComplaintFeedbackSectionProps) {
  const [feedback, setFeedback] = useState<ComplaintFeedbackDTO | null>(
    complaint.feedback,
  );
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isResolvedOrClosed =
    complaint.status === COMPLAINT_STATUSES.RESOLVED ||
    complaint.status === COMPLAINT_STATUSES.CLOSED;

  // Case 1: Complaint is in active investigation/progress (not resolved or closed)
  if (!isResolvedOrClosed) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-5 text-center text-xs text-[#64748B]">
        <p className="font-medium text-[#475569]">
          Grievance Feedback
        </p>
        <p className="mt-1">
          Feedback and resolution satisfaction ratings become available once this grievance has been resolved by the department officer.
        </p>
      </div>
    );
  }

  // Case 2: Feedback already submitted (Read-Only Confirmed Display)
  if (feedback) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-[#0F172A]">
            Resolution Satisfaction & Feedback
          </h4>
          <span className="text-xs text-[#64748B]">
            Submitted {formatFeedbackDate(feedback.submittedAt)}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5" aria-label={`Rating: ${feedback.rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon key={star} filled={star <= feedback.rating} />
          ))}
          <span className="ml-2 text-sm font-bold text-[#0F172A]">
            {feedback.rating} / 5
          </span>
        </div>

        {feedback.comment && (
          <p className="mt-3 text-xs text-[#475569] bg-[#F8FAFC] p-3 rounded border border-[#F1F5F9] leading-relaxed">
            &ldquo;{feedback.comment}&rdquo;
          </p>
        )}
      </div>
    );
  }

  // Case 3: Submitter can now submit feedback
  if (!isSubmitter) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-5 text-xs text-[#64748B]">
        <p className="font-medium text-[#475569]">Submitter Feedback</p>
        <p className="mt-1">Awaiting post-resolution feedback from the original submitter.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await submitFeedbackAction({
        complaintId: complaint.complaintId,
        rating: rating as 1 | 2 | 3 | 4 | 5,
        comment: comment.trim() || undefined,
      });

      if (!response.success) {
        setErrorMessage(response.error || "Failed to submit feedback. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Switch directly to read-only confirmed state
      setFeedback({
        rating: rating as 1 | 2 | 3 | 4 | 5,
        comment: comment.trim() || undefined,
        submittedAt: new Date().toISOString(),
      });
    } catch {
      setErrorMessage("An unexpected network error occurred while submitting feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs">
      <h4
        className="text-base font-bold text-[#0F172A]"
        style={{ fontFamily: "'Source Serif 4', serif" }}
      >
        Rate Your Resolution Experience
      </h4>
      <p className="mt-1 text-xs text-[#64748B]">
        This grievance has been marked as resolved. Please provide your feedback on how effectively and promptly your issue was addressed.
      </p>

      {errorMessage && (
        <div className="mt-3 rounded-md bg-[#FFF0F0] border border-[#FECDD3] p-3 text-xs text-[#991B1B]">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        {/* Star Rating Controls */}
        <div>
          <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">
            Satisfaction Rating *
          </label>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Satisfaction rating">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = (hoverRating || rating) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none focus:ring-2 focus:ring-[#6B1724] rounded transition-transform hover:scale-110"
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                >
                  <StarIcon filled={isFilled} />
                </button>
              );
            })}
            <span className="ml-3 text-sm font-semibold text-[#0F172A]">
              {rating} / 5 Stars
            </span>
          </div>
        </div>

        {/* Feedback Comment */}
        <Textarea
          id="feedback-comment"
          label="Optional Comments / Remarks"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share additional remarks regarding the officer's remediation or service quality..."
          maxLength={500}
          rows={3}
        />


        <div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
          >
            Submit Feedback
          </Button>
        </div>
      </form>
    </div>
  );
}
