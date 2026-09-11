// src/types/index.ts
// Barrel export for all AU-CTS domain types.
// Import from "@/types" rather than individual files.

export type { UserRole, UserProfile, SessionClaims, SessionUser } from "./auth";
export { USER_ROLES } from "./auth";

export type {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  Complaint,
  AttachmentRef,
  ComplaintFeedback,
} from "./complaint";
export {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TERMINAL_STATUSES,
} from "./complaint";

export type { AuditAction, AuditEvent } from "./audit";
export { AUDIT_ACTIONS } from "./audit";

export type { RoutingRule, Department } from "./routing";
