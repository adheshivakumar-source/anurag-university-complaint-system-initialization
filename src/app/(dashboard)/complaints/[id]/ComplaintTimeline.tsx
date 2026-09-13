// src/app/(dashboard)/complaints/[id]/ComplaintTimeline.tsx
// ============================================================
// Accessible Timeline Component for AU-CTS Complaint Lifecycle
// Rendered purely from authenticated, sanitized Firestore audit records.
// ============================================================

import type { SanitizedTimelineEventDTO } from "@/shared/types";
import { AUDIT_ACTIONS } from "@/shared/types";

interface ComplaintTimelineProps {
  events: SanitizedTimelineEventDTO[];
}

function formatTimelineDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return isoString;
  }
}

function getTimelineNodeStyles(action: string): {
  dotBg: string;
  dotBorder: string;
  iconColor: string;
  icon: React.ReactNode;
} {
  switch (action) {
    case AUDIT_ACTIONS.COMPLAINT_CREATED:
      return {
        dotBg: "bg-blue-100",
        dotBorder: "border-blue-400",
        iconColor: "text-blue-700",
        icon: (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        ),
      };
    case AUDIT_ACTIONS.COMPLAINT_ASSIGNED:
      return {
        dotBg: "bg-indigo-100",
        dotBorder: "border-indigo-400",
        iconColor: "text-indigo-700",
        icon: (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      };
    case AUDIT_ACTIONS.COMPLAINT_RESOLVED:
      return {
        dotBg: "bg-emerald-100",
        dotBorder: "border-emerald-500",
        iconColor: "text-emerald-700",
        icon: (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ),
      };
    case AUDIT_ACTIONS.COMPLAINT_CLOSED:
      return {
        dotBg: "bg-slate-100",
        dotBorder: "border-slate-400",
        iconColor: "text-slate-700",
        icon: (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ),
      };
    case AUDIT_ACTIONS.COMPLAINT_REOPENED:
      return {
        dotBg: "bg-purple-100",
        dotBorder: "border-purple-400",
        iconColor: "text-purple-700",
        icon: (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
      };
    case AUDIT_ACTIONS.COMPLAINT_ESCALATED:
      return {
        dotBg: "bg-red-100",
        dotBorder: "border-red-500",
        iconColor: "text-red-700",
        icon: (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
      };
    case AUDIT_ACTIONS.FEEDBACK_SUBMITTED:
      return {
        dotBg: "bg-amber-100",
        dotBorder: "border-amber-400",
        iconColor: "text-amber-700",
        icon: (
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ),
      };
    default:
      return {
        dotBg: "bg-slate-100",
        dotBorder: "border-slate-300",
        iconColor: "text-slate-600",
        icon: (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
  }
}

export function ComplaintTimeline({ events }: ComplaintTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-[#64748B]">
        No audit activity recorded yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      {/* Vertical Track Line */}
      <div
        className="absolute left-[17px] top-3 bottom-3 w-0.5 bg-[#E2E8F0]"
        aria-hidden="true"
      />

      <ol className="relative space-y-6" role="list">
        {events.map((event, index) => {
          const styles = getTimelineNodeStyles(event.action);
          const isLatest = index === events.length - 1;

          return (
            <li key={event.auditId || index} className="relative flex items-start gap-4">
              {/* Timeline Icon Node */}
              <div
                className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border ${styles.dotBg} ${styles.dotBorder} ${styles.iconColor} shadow-xs flex-shrink-0 -ml-[23px]`}
                aria-hidden="true"
              >
                {styles.icon}
              </div>

              {/* Event Content Box */}
              <div className="min-w-0 flex-1 rounded-md border border-[#F1F5F9] bg-[#F8FAFC] p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-sm font-semibold text-[#0F172A]">
                    {event.title}
                  </span>
                  <time
                    dateTime={event.timestamp}
                    className="text-xs text-[#64748B]"
                  >
                    {formatTimelineDate(event.timestamp)}
                  </time>
                </div>

                {event.description && (
                  <p className="mt-1 text-xs text-[#475569] leading-relaxed">
                    {event.description}
                  </p>
                )}

                {isLatest && (
                  <span className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                    Latest Activity
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
