// src/lib/complaints/service.ts
// ============================================================
// Server-only Complaint Domain Service Layer for AU-CTS.
//
// AUTHORIZATION & INTEGRITY PRINCIPLES:
// 1. All Firestore mutations run server-side via Firebase Admin SDK.
// 2. Caller identity is derived exclusively from verified server session context.
// 3. Status transitions are verified via pure state-machine validation before mutation.
// 4. Firestore transactions guarantee atomicity and prevent race conditions.
// 5. Audit events are recorded server-side for every significant state change.
// ============================================================

import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/server/firebase/admin";
import { resolveDepartmentRouting } from "./routing";
import {
  validateStatusTransition,
  generateComplaintId,
  type TransitionActorContext,
  type ComplaintStateSummary,
} from "./transitions";
export {
  validateStatusTransition,
  generateComplaintId,
  type TransitionActorContext,
  type ComplaintStateSummary,
};
import {
  createComplaintSchema,
  updateComplaintStatusSchema,
  assignComplaintSchema,
  submitFeedbackSchema,
  type CreateComplaintInput,
  type CreateComplaintFormData,
  type UpdateComplaintStatusInput,
  type AssignComplaintInput,
  type SubmitFeedbackInput,
} from "@/shared/validation/validation";
import type {
  Complaint,
  ComplaintDTO,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  AttachmentRef,
  AuditEvent,
  AuditAction,
  SanitizedTimelineEventDTO,
  AuthenticatedUserContext,
  UserRole,
} from "@/shared/types";
import {
  COMPLAINT_STATUSES,
  STATUS_LABELS,
  AUDIT_ACTIONS,
  USER_ROLES,
} from "@/shared/types";

const COMPLAINTS_COLLECTION = "complaints";
const AUDIT_SUBCOLLECTION = "audit";


// ── Domain Errors ─────────────────────────────────────────────

export class UnauthorizedComplaintAccessError extends Error {
  constructor(message = "You do not have permission to access or modify this complaint.") {
    super(message);
    this.name = "UnauthorizedComplaintAccessError";
  }
}

export class InvalidComplaintInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidComplaintInputError";
  }
}

export class InvalidStatusTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidStatusTransitionError";
  }
}

export class ComplaintNotFoundError extends Error {
  constructor(complaintId: string) {
    super(`Complaint ${complaintId} was not found.`);
    this.name = "ComplaintNotFoundError";
  }
}

export class ComplaintAlreadyAssignedError extends Error {
  constructor(message = "This complaint has already been assigned to another officer.") {
    super(message);
    this.name = "ComplaintAlreadyAssignedError";
  }
}

// ── Timestamp & Document Mapping Helpers ──────────────────────

function toDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") return new Date(val);
  return new Date();
}

function mapDocToComplaint(id: string, data: Record<string, unknown>): Complaint {
  const attachments: AttachmentRef[] = Array.isArray(data.attachments)
    ? data.attachments.map((att: Record<string, unknown>) => ({
        storagePath: (att.storagePath as string) || "",
        fileName: (att.fileName as string) || "attachment",
        fileSize: typeof att.fileSize === "number" ? att.fileSize : 0,
        mimeType: (att.mimeType as string) || "application/octet-stream",
        uploadedAt: toDate(att.uploadedAt),
      }))
    : [];

  const feedback =
    data.feedback && typeof data.feedback === "object"
      ? {
          rating: (data.feedback as { rating: 1 | 2 | 3 | 4 | 5 }).rating || 5,
          comment: (data.feedback as { comment?: string }).comment,
          submittedAt: toDate((data.feedback as { submittedAt?: unknown }).submittedAt),
        }
      : null;

  return {
    complaintId: id,
    title: (data.title as string) || "",
    description: (data.description as string) || "",
    category: (data.category as ComplaintCategory) || "maintenance",
    priority: (data.priority as ComplaintPriority) || "medium",
    status: (data.status as ComplaintStatus) || COMPLAINT_STATUSES.SUBMITTED,

    submittedBy: (data.submittedBy as string) || "",
    submittedByName: (data.submittedByName as string) || "Unknown Submitter",
    submittedAt: toDate(data.submittedAt || data.createdAt),

    departmentId: (data.departmentId as string) || "",
    assignedTo: (data.assignedTo as string) || null,
    assignedToName: (data.assignedToName as string) || null,
    assignedAt: data.assignedAt ? toDate(data.assignedAt) : null,

    attachments,

    location: (data.location as string) || null,

    lastUpdatedAt: toDate(data.lastUpdatedAt || data.updatedAt),
    resolvedAt: data.resolvedAt ? toDate(data.resolvedAt) : null,
    closedAt: data.closedAt ? toDate(data.closedAt) : null,

    resolution: (data.resolution as string) || null,

    slaDeadline: toDate(data.slaDeadline),
    escalationLevel: (data.escalationLevel as 0 | 1 | 2 | 3) || 0,
    escalatedAt: data.escalatedAt ? toDate(data.escalatedAt) : null,

    isDuplicate: Boolean(data.isDuplicate),
    duplicateOf: (data.duplicateOf as string) || null,

    feedback,

    isAnonymous: Boolean(data.isAnonymous),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
  };
}

function mapDocToAuditEvent(id: string, complaintId: string, data: Record<string, unknown>): AuditEvent {
  return {
    auditId: id,
    complaintId,
    actor: (data.actor as string) || "system",
    actorRole: (data.actorRole as UserRole) || USER_ROLES.STUDENT,
    action: (data.action as AuditAction) || AUDIT_ACTIONS.STATUS_CHANGED,
    timestamp: toDate(data.timestamp),
    previousValue: data.previousValue,
    newValue: data.newValue,
    note: (data.note as string) || undefined,
  };
}

/**
 * Serializes a Complaint domain object to a JSON-safe DTO.
 */
export function serializeComplaintToDTO(complaint: Complaint): ComplaintDTO {
  return {
    complaintId: complaint.complaintId,
    title: complaint.title,
    description: complaint.description,
    category: complaint.category,
    priority: complaint.priority,
    status: complaint.status,
    submittedBy: complaint.submittedBy,
    submittedByName: complaint.submittedByName,
    submittedAt: complaint.submittedAt.toISOString(),
    departmentId: complaint.departmentId,
    assignedTo: complaint.assignedTo,
    assignedToName: complaint.assignedToName,
    assignedAt: complaint.assignedAt ? complaint.assignedAt.toISOString() : null,
    location: complaint.location ?? null,
    attachments: complaint.attachments.map((att) => ({
      storagePath: att.storagePath,
      fileName: att.fileName,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
      uploadedAt: att.uploadedAt.toISOString(),
    })),
    lastUpdatedAt: complaint.lastUpdatedAt.toISOString(),
    resolvedAt: complaint.resolvedAt ? complaint.resolvedAt.toISOString() : null,
    closedAt: complaint.closedAt ? complaint.closedAt.toISOString() : null,
    resolution: complaint.resolution,
    slaDeadline: complaint.slaDeadline.toISOString(),
    escalationLevel: complaint.escalationLevel,
    escalatedAt: complaint.escalatedAt ? complaint.escalatedAt.toISOString() : null,
    isDuplicate: complaint.isDuplicate,
    duplicateOf: complaint.duplicateOf,

    feedback: complaint.feedback
      ? {
          rating: complaint.feedback.rating,
          comment: complaint.feedback.comment,
          submittedAt: complaint.feedback.submittedAt.toISOString(),
        }
      : null,
    isAnonymous: complaint.isAnonymous,
    tags: complaint.tags,
  };
}


// ── Service Operations ────────────────────────────────────────

/**
 * Creates a new complaint in Firestore.
 * Derives trusted fields, resolves department routing, computes provisional SLA,
 * and writes the initial audit record.
 */
export async function createComplaint(
  input: CreateComplaintFormData | CreateComplaintInput,
  userContext: AuthenticatedUserContext,
): Promise<Complaint> {
  const parseResult = createComplaintSchema.safeParse(input);
  if (!parseResult.success) {
    throw new InvalidComplaintInputError(parseResult.error.issues[0]?.message || "Invalid complaint input.");
  }
  const valid = parseResult.data;

  const { profile } = userContext;
  if (!profile.isActive) {
    throw new UnauthorizedComplaintAccessError("Inactive accounts cannot submit complaints.");
  }

  if (profile.role === USER_ROLES.DEPARTMENT_OFFICER) {
    throw new UnauthorizedComplaintAccessError("Department officers are not permitted to submit grievances.");
  }

  const db = getAdminFirestore();
  const complaintId = generateComplaintId();
  const now = new Date();

  // Deterministically resolve target department and provisional SLA
  const routing = resolveDepartmentRouting(valid.category, valid.priority, now);

  const newDocData: Record<string, unknown> = {
    complaintId,
    title: valid.title,
    description: valid.description,
    category: valid.category,
    priority: valid.priority,
    status: COMPLAINT_STATUSES.SUBMITTED,

    // Trusted ownership derivation
    submittedBy: profile.uid,
    submittedByName: profile.displayName,
    submittedByRole: profile.role,
    submittedAt: FieldValue.serverTimestamp(),

    // Routing resolution — initially unassigned to any specific officer
    departmentId: routing.departmentId,
    assignedTo: null,
    assignedToName: null,
    assignedAt: null,

    location: valid.location ?? null,
    attachments: valid.attachments.map((att) => ({
      storagePath: att.storagePath,
      fileName: att.fileName,
      fileSize: att.fileSize,
      mimeType: att.mimeType,
      uploadedAt: att.uploadedAt ?? now,
    })),

    lastUpdatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    resolvedAt: null,
    closedAt: null,
    resolution: null,

    slaDeadline: Timestamp.fromDate(routing.slaDeadline),
    escalationLevel: 0,
    escalatedAt: null,

    isDuplicate: false,
    duplicateOf: null,
    feedback: null,

    isAnonymous: false,
    tags: [],
  };

  const complaintRef = db.collection(COMPLAINTS_COLLECTION).doc(complaintId);
  const auditRef = complaintRef.collection(AUDIT_SUBCOLLECTION).doc();

  const initialAuditData = {
    auditId: auditRef.id,
    complaintId,
    actor: profile.uid,
    actorRole: profile.role,
    action: AUDIT_ACTIONS.COMPLAINT_CREATED,
    timestamp: FieldValue.serverTimestamp(),
    note: `Complaint filed in department ${routing.departmentName} with ${valid.priority} priority.`,
  };

  const batch = db.batch();
  batch.set(complaintRef, newDocData);
  batch.set(auditRef, initialAuditData);
  await batch.commit();

  return mapDocToComplaint(complaintId, {
    ...newDocData,
    submittedAt: now,
    lastUpdatedAt: now,
    createdAt: now,
    slaDeadline: routing.slaDeadline,
  });
}

/**
 * Retrieves a complaint by ID with strict server-side authorization checks.
 */
export async function getComplaintById(
  complaintId: string,
  userContext?: AuthenticatedUserContext,
): Promise<Complaint | null> {
  const db = getAdminFirestore();
  const docRef = db.collection(COMPLAINTS_COLLECTION).doc(complaintId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return null;
  }

  const complaint = mapDocToComplaint(snapshot.id, snapshot.data() || {});

  // If user context provided, enforce authorization boundaries
  if (userContext) {
    const { user } = userContext;
    const isAdmin = user.role === USER_ROLES.ADMIN;
    const isSubmitter = user.uid === complaint.submittedBy;
    const isDeptOfficer =
      user.role === USER_ROLES.DEPARTMENT_OFFICER &&
      (user.departmentId === complaint.departmentId || user.uid === complaint.assignedTo);

    if (!isAdmin && !isSubmitter && !isDeptOfficer) {
      throw new UnauthorizedComplaintAccessError("You are not authorized to view this complaint.");
    }
  }

  return complaint;
}

/**
 * Lists complaints submitted by a specific user (ordered by creation date).
 */
export async function listUserComplaints(
  userId: string,
  limitCount = 50,
): Promise<Complaint[]> {
  const db = getAdminFirestore();
  const query = db
    .collection(COMPLAINTS_COLLECTION)
    .where("submittedBy", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(limitCount);

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => mapDocToComplaint(doc.id, doc.data()));
}

export interface SubmitterMetricsDTO {
  totalFiled: number;
  activeCount: number;
  inReviewCount: number;
  resolvedCount: number;
}

/**
 * Retrieves aggregate lifetime complaint metrics for a specific submitter.
 * Uses native Firestore server-side count aggregations for scalability and Spark quota efficiency.
 */
export async function getUserComplaintMetrics(
  userId: string,
): Promise<SubmitterMetricsDTO> {
  const db = getAdminFirestore();
  const baseQuery = db
    .collection(COMPLAINTS_COLLECTION)
    .where("submittedBy", "==", userId);

  const [totalSnap, activeSnap, inReviewSnap, resolvedSnap] = await Promise.all([
    baseQuery.count().get(),
    baseQuery
      .where("status", "in", [
        COMPLAINT_STATUSES.SUBMITTED,
        COMPLAINT_STATUSES.PENDING,
        COMPLAINT_STATUSES.IN_REVIEW,
        COMPLAINT_STATUSES.REOPENED,
        COMPLAINT_STATUSES.ESCALATED,
      ])
      .count()
      .get(),
    baseQuery
      .where("status", "==", COMPLAINT_STATUSES.IN_REVIEW)
      .count()
      .get(),
    baseQuery
      .where("status", "in", [
        COMPLAINT_STATUSES.RESOLVED,
        COMPLAINT_STATUSES.CLOSED,
      ])
      .count()
      .get(),
  ]);

  return {
    totalFiled: totalSnap.data().count,
    activeCount: activeSnap.data().count,
    inReviewCount: inReviewSnap.data().count,
    resolvedCount: resolvedSnap.data().count,
  };
}

/**
 * Lists complaints assigned to or routed to a specific department.
 */
export async function listDepartmentComplaints(
  departmentId: string,
  limitCount = 50,
): Promise<Complaint[]> {
  const db = getAdminFirestore();
  const query = db
    .collection(COMPLAINTS_COLLECTION)
    .where("departmentId", "==", departmentId)
    .orderBy("createdAt", "desc")
    .limit(limitCount);

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => mapDocToComplaint(doc.id, doc.data()));
}

/**
 * Lists all complaints with administrative filters.
 */
export async function listAllComplaints(filters?: {
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  departmentId?: string;
  limit?: number;
}): Promise<Complaint[]> {
  const db = getAdminFirestore();
  let query: FirebaseFirestore.Query = db.collection(COMPLAINTS_COLLECTION);

  if (filters?.status) {
    query = query.where("status", "==", filters.status);
  }
  if (filters?.category) {
    query = query.where("category", "==", filters.category);
  }
  if (filters?.departmentId) {
    query = query.where("departmentId", "==", filters.departmentId);
  }

  query = query.orderBy("createdAt", "desc").limit(filters?.limit ?? 50);

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => mapDocToComplaint(doc.id, doc.data()));
}

/**
 * Retrieves the audit trail for a complaint.
 * Accessible by:
 * - Admins (global)
 * - Department Officers (scoped to assigned department / ticket)
 * - Original Submitter (scoped to own complaint)
 */
export async function getComplaintAuditTrail(
  complaintId: string,
  userContext: AuthenticatedUserContext,
): Promise<AuditEvent[]> {
  const { user } = userContext;
  const complaint = await getComplaintById(complaintId, userContext);
  if (!complaint) {
    throw new ComplaintNotFoundError(complaintId);
  }

  const isAdmin = user.role === USER_ROLES.ADMIN;
  const isSubmitter = user.uid === complaint.submittedBy;
  const isDeptOfficer =
    user.role === USER_ROLES.DEPARTMENT_OFFICER &&
    (user.departmentId === complaint.departmentId || user.uid === complaint.assignedTo);

  if (!isAdmin && !isSubmitter && !isDeptOfficer) {
    throw new UnauthorizedComplaintAccessError("You are not authorized to access this complaint's audit trail.");
  }

  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COMPLAINTS_COLLECTION)
    .doc(complaintId)
    .collection(AUDIT_SUBCOLLECTION)
    .orderBy("timestamp", "asc")
    .get();

  return snapshot.docs.map((doc) => mapDocToAuditEvent(doc.id, complaintId, doc.data()));
}

/**
 * Retrieves and sanitizes the complaint timeline for presentation.
 * Enforces role-based data boundaries:
 * - Submitters: Sanitized lifecycle events, no raw actor UIDs, no internal officer notes.
 * - Admins / Officers: Full operational notes and audit details.
 */
export async function getSanitizedComplaintTimeline(
  complaintId: string,
  userContext: AuthenticatedUserContext,
): Promise<SanitizedTimelineEventDTO[]> {
  const rawEvents = await getComplaintAuditTrail(complaintId, userContext);
  const isSubmitter =
    userContext.user.role !== USER_ROLES.ADMIN &&
    userContext.user.role !== USER_ROLES.DEPARTMENT_OFFICER;

  return rawEvents.map((event) => {
    let title = "Status Updated";
    let description: string | undefined = undefined;

    switch (event.action) {
      case AUDIT_ACTIONS.COMPLAINT_CREATED:
        title = "Grievance Filed";
        description = "Grievance submitted and registered in the system.";
        break;
      case AUDIT_ACTIONS.COMPLAINT_ASSIGNED:
        title = "Assigned to Department";
        description = isSubmitter
          ? "Assigned to department team for review and remediation."
          : (event.note || "Complaint assigned to officer.");
        break;
      case AUDIT_ACTIONS.STATUS_CHANGED: {
        const nextStatus = typeof event.newValue === "string" ? event.newValue : "updated";
        const formatted = STATUS_LABELS[nextStatus as ComplaintStatus] || nextStatus;
        title = `Status Changed to ${formatted}`;
        description = isSubmitter ? undefined : event.note;
        break;
      }
      case AUDIT_ACTIONS.COMPLAINT_RESOLVED:
        title = "Resolution Provided";
        description = event.note || "Remediation completed by department officer.";
        break;
      case AUDIT_ACTIONS.COMPLAINT_CLOSED:
        title = "Grievance Closed";
        description = "Grievance lifecycle successfully completed.";
        break;
      case AUDIT_ACTIONS.COMPLAINT_REOPENED:
        title = "Grievance Reopened";
        description = event.note || "Grievance returned for further investigation.";
        break;
      case AUDIT_ACTIONS.COMPLAINT_ESCALATED:
        title = "Grievance Escalated";
        description = isSubmitter
          ? "Escalated to higher administrative authority for resolution."
          : (event.note || "Complaint SLA breached or escalated.");
        break;
      case AUDIT_ACTIONS.COMPLAINT_REJECTED:
        title = "Grievance Rejected";
        description = event.note || "Grievance could not be processed.";
        break;
      case AUDIT_ACTIONS.MARKED_DUPLICATE:
        title = "Marked as Duplicate";
        description = isSubmitter
          ? "Identified as duplicate of an existing grievance."
          : (event.note || "Flagged as duplicate.");
        break;
      case AUDIT_ACTIONS.FEEDBACK_SUBMITTED:
        title = "Feedback Submitted";
        description = event.note || "Submitter submitted satisfaction rating.";
        break;
      default:
        title = "Activity Logged";
        description = isSubmitter ? undefined : event.note;
    }

    return {
      auditId: event.auditId,
      action: event.action,
      timestamp: event.timestamp.toISOString(),
      actorRole: event.actorRole,
      title,
      description,
      badgeVariant: event.action,
    };
  });
}


/**
 * Transitions a complaint status inside a transaction with state-machine validation.
 */
export async function updateComplaintStatus(
  params: UpdateComplaintStatusInput,
  userContext: AuthenticatedUserContext,
): Promise<Complaint> {
  const parseResult = updateComplaintStatusSchema.safeParse(params);
  if (!parseResult.success) {
    throw new InvalidComplaintInputError(parseResult.error.issues[0]?.message || "Invalid status transition input.");
  }
  const valid = parseResult.data;

  const db = getAdminFirestore();
  const complaintRef = db.collection(COMPLAINTS_COLLECTION).doc(valid.complaintId);

  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(complaintRef);
    if (!doc.exists) {
      throw new ComplaintNotFoundError(valid.complaintId);
    }

    const currentData = doc.data() || {};
    const currentComplaint = mapDocToComplaint(doc.id, currentData);

    const validation = validateStatusTransition(
      currentComplaint.status,
      valid.nextStatus,
      {
        uid: userContext.user.uid,
        role: userContext.user.role,
        departmentId: userContext.user.departmentId,
      },
      {
        submittedBy: currentComplaint.submittedBy,
        assignedTo: currentComplaint.assignedTo,
        departmentId: currentComplaint.departmentId,
      },
    );

    if (!validation.allowed) {
      throw new InvalidStatusTransitionError(validation.reason || "Transition not permitted.");
    }

    const updates: Record<string, unknown> = {
      status: valid.nextStatus,
      lastUpdatedAt: FieldValue.serverTimestamp(),
    };

    let auditAction: AuditAction = AUDIT_ACTIONS.STATUS_CHANGED;

    if (valid.nextStatus === COMPLAINT_STATUSES.RESOLVED) {
      updates.resolvedAt = FieldValue.serverTimestamp();
      if (valid.resolution) updates.resolution = valid.resolution;
      auditAction = AUDIT_ACTIONS.COMPLAINT_RESOLVED;
    } else if (valid.nextStatus === COMPLAINT_STATUSES.CLOSED) {
      updates.closedAt = FieldValue.serverTimestamp();
      auditAction = AUDIT_ACTIONS.COMPLAINT_CLOSED;
    } else if (valid.nextStatus === COMPLAINT_STATUSES.REOPENED) {
      auditAction = AUDIT_ACTIONS.COMPLAINT_REOPENED;
    } else if (valid.nextStatus === COMPLAINT_STATUSES.REJECTED) {
      auditAction = AUDIT_ACTIONS.COMPLAINT_REJECTED;
    } else if (valid.nextStatus === COMPLAINT_STATUSES.DUPLICATE) {
      updates.isDuplicate = true;
      if (valid.duplicateOf) updates.duplicateOf = valid.duplicateOf;
      auditAction = AUDIT_ACTIONS.MARKED_DUPLICATE;
    } else if (valid.nextStatus === COMPLAINT_STATUSES.ESCALATED) {
      updates.escalationLevel = (currentComplaint.escalationLevel + 1) as 1 | 2 | 3;
      updates.escalatedAt = FieldValue.serverTimestamp();
      auditAction = AUDIT_ACTIONS.COMPLAINT_ESCALATED;
    }

    const auditRef = complaintRef.collection(AUDIT_SUBCOLLECTION).doc();
    const auditData = {
      auditId: auditRef.id,
      complaintId: valid.complaintId,
      actor: userContext.user.uid,
      actorRole: userContext.user.role,
      action: auditAction,
      timestamp: FieldValue.serverTimestamp(),
      previousValue: currentComplaint.status,
      newValue: valid.nextStatus,
      note: valid.note || valid.resolution || undefined,
    };

    transaction.update(complaintRef, updates);
    transaction.set(auditRef, auditData);

    return mapDocToComplaint(valid.complaintId, {
      ...currentData,
      ...updates,
      lastUpdatedAt: new Date(),
    });
  });
}

/**
 * Assigns or reassigns an officer to a complaint inside a transaction.
 */
export async function assignComplaint(
  params: AssignComplaintInput,
  userContext: AuthenticatedUserContext,
  options?: { requireUnassigned?: boolean },
): Promise<Complaint> {
  const parseResult = assignComplaintSchema.safeParse(params);
  if (!parseResult.success) {
    throw new InvalidComplaintInputError(parseResult.error.issues[0]?.message || "Invalid assignment input.");
  }
  const valid = parseResult.data;

  const { user } = userContext;
  const isAdmin = user.role === USER_ROLES.ADMIN;
  const isOfficer = user.role === USER_ROLES.DEPARTMENT_OFFICER;

  if (!isAdmin && !isOfficer) {
    throw new UnauthorizedComplaintAccessError("Only administrators and department officers can assign complaints.");
  }

  const db = getAdminFirestore();
  const complaintRef = db.collection(COMPLAINTS_COLLECTION).doc(valid.complaintId);

  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(complaintRef);
    if (!doc.exists) {
      throw new ComplaintNotFoundError(valid.complaintId);
    }

    const currentData = doc.data() || {};
    const currentComplaint = mapDocToComplaint(doc.id, currentData);

    // Officers may only assign within their authorized department
    if (isOfficer && user.departmentId !== currentComplaint.departmentId) {
      throw new UnauthorizedComplaintAccessError("Officers cannot assign tickets outside their assigned department.");
    }

    // Pickup Concurrency Protection: If requireUnassigned is requested, verify ticket is unassigned
    if (options?.requireUnassigned && currentComplaint.assignedTo !== null) {
      throw new ComplaintAlreadyAssignedError(
        `Complaint ${valid.complaintId} has already been assigned to ${currentComplaint.assignedToName || "another officer"}.`,
      );
    }

    const updates: Record<string, unknown> = {
      assignedTo: valid.officerUid,
      assignedToName: valid.officerName,
      assignedAt: FieldValue.serverTimestamp(),
      lastUpdatedAt: FieldValue.serverTimestamp(),
    };

    // If still submitted, advance to pending on assignment
    if (currentComplaint.status === COMPLAINT_STATUSES.SUBMITTED) {
      updates.status = COMPLAINT_STATUSES.PENDING;
    }

    const auditRef = complaintRef.collection(AUDIT_SUBCOLLECTION).doc();
    const auditData = {
      auditId: auditRef.id,
      complaintId: valid.complaintId,
      actor: user.uid,
      actorRole: user.role,
      action: AUDIT_ACTIONS.COMPLAINT_ASSIGNED,
      timestamp: FieldValue.serverTimestamp(),
      previousValue: currentComplaint.assignedTo,
      newValue: valid.officerUid,
      note: valid.note || `Assigned to ${valid.officerName}`,
    };

    transaction.update(complaintRef, updates);
    transaction.set(auditRef, auditData);

    return mapDocToComplaint(valid.complaintId, {
      ...currentData,
      ...updates,
      lastUpdatedAt: new Date(),
    });
  });
}

/**
 * Submits post-resolution feedback by the original submitter.
 */
export async function submitComplaintFeedback(
  params: SubmitFeedbackInput,
  userContext: AuthenticatedUserContext,
): Promise<Complaint> {
  const parseResult = submitFeedbackSchema.safeParse(params);
  if (!parseResult.success) {
    throw new InvalidComplaintInputError(parseResult.error.issues[0]?.message || "Invalid feedback input.");
  }
  const valid = parseResult.data;

  const db = getAdminFirestore();
  const complaintRef = db.collection(COMPLAINTS_COLLECTION).doc(valid.complaintId);

  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(complaintRef);
    if (!doc.exists) {
      throw new ComplaintNotFoundError(valid.complaintId);
    }

    const currentData = doc.data() || {};
    const currentComplaint = mapDocToComplaint(doc.id, currentData);

    if (currentComplaint.submittedBy !== userContext.user.uid) {
      throw new UnauthorizedComplaintAccessError("Only the original submitter can submit feedback.");
    }

    if (currentComplaint.status !== COMPLAINT_STATUSES.RESOLVED && currentComplaint.status !== COMPLAINT_STATUSES.CLOSED) {
      throw new InvalidStatusTransitionError("Feedback can only be provided for resolved or closed complaints.");
    }

    if (currentComplaint.feedback !== null) {
      throw new InvalidStatusTransitionError("Feedback has already been submitted for this complaint.");
    }


    const feedbackData = {
      rating: valid.rating,
      comment: valid.comment || null,
      submittedAt: FieldValue.serverTimestamp(),
    };

    const updates: Record<string, unknown> = {
      feedback: feedbackData,
      lastUpdatedAt: FieldValue.serverTimestamp(),
    };

    const auditRef = complaintRef.collection(AUDIT_SUBCOLLECTION).doc();
    const auditData = {
      auditId: auditRef.id,
      complaintId: valid.complaintId,
      actor: userContext.user.uid,
      actorRole: userContext.user.role,
      action: AUDIT_ACTIONS.FEEDBACK_SUBMITTED,
      timestamp: FieldValue.serverTimestamp(),
      note: `Feedback submitted with rating ${valid.rating}/5`,
    };

    transaction.update(complaintRef, updates);
    transaction.set(auditRef, auditData);

    return mapDocToComplaint(valid.complaintId, {
      ...currentData,
      ...updates,
      feedback: {
        rating: valid.rating,
        comment: valid.comment,
        submittedAt: new Date(),
      },
      lastUpdatedAt: new Date(),
    });
  });
}
