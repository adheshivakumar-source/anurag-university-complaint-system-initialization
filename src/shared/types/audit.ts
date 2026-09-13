// src/types/audit.ts
// ============================================================
// Audit trail types for AU-CTS.
// Every significant complaint action must produce an AuditEvent.
// Audit events are stored in the /complaints/{id}/audit sub-collection.
// ============================================================

import type { UserRole } from "./auth";

/**
 * All auditable actions in the complaint lifecycle.
 * Only extend this list when a new auditable event is introduced.
 */
export const AUDIT_ACTIONS = {
  COMPLAINT_CREATED: "complaint_created",
  COMPLAINT_ASSIGNED: "complaint_assigned",
  STATUS_CHANGED: "status_changed",
  COMPLAINT_ESCALATED: "complaint_escalated",
  COMPLAINT_RESOLVED: "complaint_resolved",
  COMPLAINT_REOPENED: "complaint_reopened",
  COMPLAINT_CLOSED: "complaint_closed",
  COMPLAINT_REJECTED: "complaint_rejected",
  MARKED_DUPLICATE: "marked_duplicate",
  ATTACHMENT_ADDED: "attachment_added",
  FEEDBACK_SUBMITTED: "feedback_submitted",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/**
 * An individual audit trail record stored in Firestore.
 * Stored in: /complaints/{complaintId}/audit/{auditId}
 *
 * Security: Only admins and authorized officers may read audit records.
 * Submitters may not read their own complaint's audit trail.
 */
export interface AuditEvent {
  auditId: string;
  complaintId: string;
  actor: string; // Firebase Auth UID — resolve display name at render time
  actorRole: UserRole;
  action: AuditAction;
  timestamp: Date;
  previousValue?: unknown;
  newValue?: unknown;
  note?: string;
}

/**
 * Role-aware, sanitized timeline event DTO safe for client display.
 * Strips raw actor UIDs and internal notes for submitters.
 */
export interface SanitizedTimelineEventDTO {
  auditId: string;
  action: AuditAction;
  timestamp: string; // ISO string
  actorRole: UserRole;
  title: string;
  description?: string;
  badgeVariant?: string;
}

