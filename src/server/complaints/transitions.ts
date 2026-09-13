// src/lib/complaints/transitions.ts
// ============================================================
// State Machine & Transition Rules for AU-CTS Complaints.
// Pure, deterministic transition validator and identifier utilities.
// ============================================================

import crypto from "crypto";
import type {
  ComplaintStatus,
  UserRole,
} from "@/shared/types";
import {
  COMPLAINT_STATUSES,
  TERMINAL_STATUSES,
  USER_ROLES,
} from "@/shared/types";

export interface TransitionActorContext {
  uid: string;
  role: UserRole;
  departmentId?: string | null;
}

export interface ComplaintStateSummary {
  submittedBy: string;
  assignedTo: string | null;
  departmentId: string;
}

/**
 * Validates whether a requested status transition is legally permitted
 * by the state machine and authorized for the specific actor role.
 */
export function validateStatusTransition(
  currentStatus: ComplaintStatus,
  nextStatus: ComplaintStatus,
  actor: TransitionActorContext,
  complaint: ComplaintStateSummary,
): { allowed: boolean; reason?: string } {
  // Terminal state protection: terminal states cannot transition further
  if (TERMINAL_STATUSES.has(currentStatus)) {
    return {
      allowed: false,
      reason: `Complaint is in terminal status '${currentStatus}' and cannot be transitioned.`,
    };
  }

  // Self-transition is a no-op / invalid
  if (currentStatus === nextStatus) {
    return {
      allowed: false,
      reason: `Complaint is already in status '${currentStatus}'.`,
    };
  }

  const isAdmin = actor.role === USER_ROLES.ADMIN;
  const isOfficer = actor.role === USER_ROLES.DEPARTMENT_OFFICER;
  const isSubmitter = actor.uid === complaint.submittedBy;
  const isDeptMatch =
    isOfficer &&
    (actor.departmentId === complaint.departmentId ||
      actor.uid === complaint.assignedTo);

  // Transition mapping rules based on docs/COMPLAINT_WORKFLOW.md & types/complaint.ts
  switch (currentStatus) {
    case COMPLAINT_STATUSES.SUBMITTED:
      if (nextStatus === COMPLAINT_STATUSES.PENDING) {
        if (isAdmin || isDeptMatch) return { allowed: true };
        return {
          allowed: false,
          reason:
            "Only administrators or department officers can route/acknowledge submitted tickets.",
        };
      }
      break;

    case COMPLAINT_STATUSES.PENDING:
      if (
        (
          [
            COMPLAINT_STATUSES.IN_REVIEW,
            COMPLAINT_STATUSES.REJECTED,
            COMPLAINT_STATUSES.DUPLICATE,
            COMPLAINT_STATUSES.ESCALATED,
          ] as readonly ComplaintStatus[]
        ).includes(nextStatus)
      ) {
        if (isAdmin || isDeptMatch) return { allowed: true };
        return {
          allowed: false,
          reason:
            "Only administrators or assigned department officers can review, reject, or mark duplicates.",
        };
      }
      break;

    case COMPLAINT_STATUSES.IN_REVIEW:
      if (
        (
          [
            COMPLAINT_STATUSES.RESOLVED,
            COMPLAINT_STATUSES.ESCALATED,
            COMPLAINT_STATUSES.REJECTED,
          ] as readonly ComplaintStatus[]
        ).includes(nextStatus)
      ) {
        if (isAdmin || isDeptMatch) return { allowed: true };
        return {
          allowed: false,
          reason:
            "Only administrators or assigned department officers can resolve, escalate, or reject tickets.",
        };
      }
      break;

    case COMPLAINT_STATUSES.RESOLVED:
      if (
        nextStatus === COMPLAINT_STATUSES.CLOSED ||
        nextStatus === COMPLAINT_STATUSES.REOPENED
      ) {
        if (isSubmitter || isAdmin) return { allowed: true };
        return {
          allowed: false,
          reason:
            "Only the original submitter or an administrator can close or reopen resolved tickets.",
        };
      }
      break;

    case COMPLAINT_STATUSES.REOPENED:
      if (
        (
          [
            COMPLAINT_STATUSES.IN_REVIEW,
            COMPLAINT_STATUSES.PENDING,
            COMPLAINT_STATUSES.ESCALATED,
          ] as readonly ComplaintStatus[]
        ).includes(nextStatus)
      ) {
        if (isAdmin || isDeptMatch) return { allowed: true };
        return {
          allowed: false,
          reason:
            "Only administrators or department officers can triage reopened tickets.",
        };
      }
      break;

    case COMPLAINT_STATUSES.ESCALATED:
      if (
        (
          [
            COMPLAINT_STATUSES.IN_REVIEW,
            COMPLAINT_STATUSES.RESOLVED,
          ] as readonly ComplaintStatus[]
        ).includes(nextStatus)
      ) {
        if (isAdmin || isDeptMatch) return { allowed: true };
        return {
          allowed: false,
          reason:
            "Only administrators or department authorities can resolve escalated tickets.",
        };
      }
      break;
  }

  return {
    allowed: false,
    reason: `Invalid transition from '${currentStatus}' to '${nextStatus}' for actor role '${actor.role}'.`,
  };
}

/**
 * Generates a collision-resistant, human-readable complaint tracking identifier.
 * Format: CTS-YYYYMMDD-XXXX (e.g. CTS-20260911-A8F2)
 */
export function generateComplaintId(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const randomSuffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `CTS-${yyyy}${mm}${dd}-${randomSuffix}`;
}
