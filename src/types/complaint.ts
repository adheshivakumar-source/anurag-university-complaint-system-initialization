// src/types/complaint.ts
// ============================================================
// Complaint domain types for AU-CTS.
// Implements the controlled state machine defined in the
// project requirements. No arbitrary status strings.
// ============================================================

/**
 * All valid complaint categories.
 * Maps to automatic routing rules in Firestore /routingRules.
 */
export const COMPLAINT_CATEGORIES = {
  HOSTEL: "hostel",
  TRANSPORT: "transport",
  CLASSROOM: "classroom",
  LAB: "lab",
  MAINTENANCE: "maintenance",
  ACADEMIC: "academic",
} as const;

export type ComplaintCategory =
  (typeof COMPLAINT_CATEGORIES)[keyof typeof COMPLAINT_CATEGORIES];

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  hostel: "Hostel",
  transport: "Transport",
  classroom: "Classroom",
  lab: "Laboratory",
  maintenance: "Maintenance",
  academic: "Academic",
};

/**
 * All valid complaint priority levels.
 * Drives SLA deadlines computed at complaint creation time.
 */
export const COMPLAINT_PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export type ComplaintPriority =
  (typeof COMPLAINT_PRIORITIES)[keyof typeof COMPLAINT_PRIORITIES];

export const PRIORITY_LABELS: Record<ComplaintPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

/**
 * All valid complaint lifecycle states.
 *
 * Valid transitions (enforced in lib/complaints/transitions.ts):
 *   SUBMITTED  → PENDING
 *   PENDING    → IN_REVIEW | ESCALATED | REJECTED | DUPLICATE
 *   IN_REVIEW  → RESOLVED | ESCALATED | REJECTED
 *   RESOLVED   → CLOSED | REOPENED
 *   REOPENED   → IN_REVIEW | PENDING
 *   ESCALATED  → IN_REVIEW | RESOLVED
 *   CLOSED     → (terminal — no transitions allowed)
 *   REJECTED   → (terminal)
 *   DUPLICATE  → (terminal)
 */
export const COMPLAINT_STATUSES = {
  SUBMITTED: "submitted",
  PENDING: "pending",
  IN_REVIEW: "in_review",
  RESOLVED: "resolved",
  CLOSED: "closed",
  REOPENED: "reopened",
  ESCALATED: "escalated",
  REJECTED: "rejected",
  DUPLICATE: "duplicate",
} as const;

export type ComplaintStatus =
  (typeof COMPLAINT_STATUSES)[keyof typeof COMPLAINT_STATUSES];

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  submitted: "Submitted",
  pending: "Pending",
  in_review: "In Review",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Reopened",
  escalated: "Escalated",
  rejected: "Rejected",
  duplicate: "Duplicate",
};

/**
 * Terminal states — no further transitions are permitted.
 */
export const TERMINAL_STATUSES: ReadonlySet<ComplaintStatus> = new Set([
  COMPLAINT_STATUSES.CLOSED,
  COMPLAINT_STATUSES.REJECTED,
  COMPLAINT_STATUSES.DUPLICATE,
]);

/**
 * Reference to a file attachment stored in Firebase Storage.
 * The `storagePath` is used to generate signed URLs server-side.
 * Direct public URLs must never be stored or exposed.
 */
export interface AttachmentRef {
  storagePath: string; // e.g. complaints/{complaintId}/attachments/{fileName}
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

/**
 * Complaint feedback submitted by the original reporter after resolution.
 */
export interface ComplaintFeedback {
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  submittedAt: Date;
}

/**
 * The complaint document as stored in Firestore /complaints/{complaintId}.
 * This is the canonical complaint schema — see docs/FIRESTORE_SCHEMA.md
 * for the full specification.
 */
export interface Complaint {
  complaintId: string; // CTS-YYYYMMDD-XXXX format
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;

  // Ownership
  submittedBy: string; // Firebase Auth UID
  submittedByName: string; // Denormalized display name for rendering
  submittedAt: Date;

  // Routing & assignment
  departmentId: string;
  assignedTo: string | null; // Firebase Auth UID of assigned officer
  assignedToName: string | null; // Denormalized
  assignedAt: Date | null;

  // Attachments (Storage paths only — no public URLs)
  attachments: AttachmentRef[];

  // Timestamps
  lastUpdatedAt: Date;
  resolvedAt: Date | null;
  closedAt: Date | null;

  // Location
  location?: string | null;

  // Resolution
  resolution: string | null;

  // SLA
  slaDeadline: Date;
  escalationLevel: 0 | 1 | 2 | 3;
  escalatedAt: Date | null;

  // Duplicate tracking
  isDuplicate: boolean;
  duplicateOf: string | null; // complaintId

  // Feedback
  feedback: ComplaintFeedback | null;

  // Future use — implemented at data level, not UI level in MVP
  isAnonymous: boolean;
  tags: string[];
}

/**
 * Serializable DTO version of AttachmentRef safe to pass from Server Components to Client Components.
 */
export interface AttachmentRefDTO {
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

/**
 * Serializable DTO version of ComplaintFeedback.
 */
export interface ComplaintFeedbackDTO {
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  submittedAt: string;
}

/**
 * Serializable DTO version of Complaint safe to pass from Server Components to Client Components.
 */
export interface ComplaintDTO {
  complaintId: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  departmentId: string;
  assignedTo: string | null;
  assignedToName: string | null;
  assignedAt: string | null;
  location?: string | null;
  attachments: AttachmentRefDTO[];
  lastUpdatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  resolution: string | null;
  slaDeadline: string;
  escalationLevel: 0 | 1 | 2 | 3;
  escalatedAt: string | null;
  isDuplicate: boolean;
  duplicateOf: string | null;
  feedback: ComplaintFeedbackDTO | null;
  isAnonymous: boolean;
  tags: string[];
}


