// src/components/ui/Badge.tsx
// Status and priority badge component — AU-CTS design system
// Used for complaint status and priority display throughout the application

import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ComplaintStatus, ComplaintPriority } from "@/types";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/types";

const badgeVariants = cva(
  "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider border",
  {
    variants: {
      variant: {
        // Complaint statuses
        submitted: "bg-blue-50 text-blue-700 border-blue-200",
        pending: "bg-amber-50 text-amber-800 border-amber-200",
        in_review: "bg-blue-50 text-blue-800 border-blue-300",
        resolved: "bg-emerald-50 text-emerald-800 border-emerald-200",
        closed: "bg-slate-100 text-slate-600 border-slate-200",
        reopened: "bg-purple-50 text-purple-800 border-purple-200",
        escalated: "bg-red-50 text-[#991B1B] border-red-200",
        rejected: "bg-red-50 text-red-900 border-red-200",
        duplicate: "bg-amber-50 text-amber-700 border-amber-200",
        // Priorities
        low: "bg-emerald-50 text-emerald-800 border-emerald-200",
        medium: "bg-amber-50 text-amber-800 border-amber-200",
        high: "bg-orange-50 text-orange-800 border-orange-200",
        critical: "bg-red-50 text-red-900 border-red-300",
        // Generic
        default: "bg-slate-100 text-slate-700 border-slate-200",
        maroon: "bg-[#FFF0F0] text-[#6B1724] border-[#FECDD3]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}

/** Convenience component for rendering a complaint status badge */
function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <Badge variant={status as VariantProps<typeof badgeVariants>["variant"]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

/** Convenience component for rendering a complaint priority badge */
function PriorityBadge({ priority }: { priority: ComplaintPriority }) {
  return (
    <Badge variant={priority as VariantProps<typeof badgeVariants>["variant"]}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export { Badge, StatusBadge, PriorityBadge, badgeVariants };
