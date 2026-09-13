// src/types/index.ts
// Barrel export for all AU-CTS domain types.
// Import from "@/shared/types" rather than individual files.

export type {
  UserRole,
  SelfRegisterRole,
  UserProfile,
  UserProfileDTO,
  SessionClaims,
  SessionUser,
  AuthenticatedUserContext,
} from "./auth";
export { USER_ROLES, ROLE_LABELS, SELF_REGISTER_ROLES } from "./auth";

export type {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  Complaint,
  ComplaintDTO,
  AttachmentRef,
  AttachmentRefDTO,
  ComplaintFeedback,
  ComplaintFeedbackDTO,
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

export type { AuditAction, AuditEvent, SanitizedTimelineEventDTO } from "./audit";
export { AUDIT_ACTIONS } from "./audit";

export type { RoutingRule, Department } from "./routing";

