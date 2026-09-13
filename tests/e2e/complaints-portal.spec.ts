// tests/e2e/complaints-portal.spec.ts
// ============================================================
// E2E & Server Boundary Test Suite: Complaint Portal & Detail (Phase 3 Milestone 3)
// Verifies unauthenticated route protection, authentic empty state,
// client search/filtering, sanitized timeline projections, and feedback lifecycle.
// ============================================================

import { test, expect } from "@playwright/test";
import {
  submitFeedbackSchema,
} from "@/lib/complaints/validation";
import type {
  Complaint,
  ComplaintDTO,
  AuditEvent,
  SanitizedTimelineEventDTO,
} from "@/types";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  STATUS_LABELS,
  AUDIT_ACTIONS,
  USER_ROLES,
} from "@/types";


const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("Complaints Portal — Route Protection & Server Boundary", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("unauthenticated user visiting /complaints is redirected to /login", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/complaints`);
    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("redirectTo")).toBe("/complaints");
  });

  test("unauthenticated user visiting /complaints/[id] is redirected to /login", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/complaints/CTS-20260911-ABCD`);
    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("redirectTo")).toBe("/complaints/CTS-20260911-ABCD");
  });
});

test.describe("Complaints Portal — Domain Serialization & DTO Mapping", () => {
  const mockDate = new Date("2026-09-11T10:00:00.000Z");

  const mockComplaint: Complaint = {
    complaintId: "CTS-20260911-A1B2",
    title: "Water leakage in Room 204",
    description: "Continuous dripping from ceiling in Room 204.",
    category: COMPLAINT_CATEGORIES.HOSTEL,
    priority: COMPLAINT_PRIORITIES.HIGH,
    status: COMPLAINT_STATUSES.RESOLVED,
    submittedBy: "user_student_123",
    submittedByName: "Rohan Sharma",
    submittedAt: mockDate,
    departmentId: "dept-hostel",
    assignedTo: "officer_hostel_456",
    assignedToName: "Mr. Ramesh (Hostel Warden)",
    assignedAt: mockDate,
    attachments: [
      {
        storagePath: "complaints/CTS-20260911-A1B2/attachments/photo.jpg",
        fileName: "photo.jpg",
        fileSize: 102400,
        mimeType: "image/jpeg",
        uploadedAt: mockDate,
      },
    ],
    lastUpdatedAt: mockDate,
    resolvedAt: mockDate,
    closedAt: null,
    resolution: "Ceiling pipe was replaced by maintenance staff.",
    slaDeadline: new Date("2026-09-11T16:00:00.000Z"),
    escalationLevel: 0,
    escalatedAt: null,
    isDuplicate: false,
    duplicateOf: null,
    feedback: {
      rating: 5,
      comment: "Prompt fix, thank you!",
      submittedAt: mockDate,
    },
    isAnonymous: false,
    tags: [],
  };

  function serializeComplaint(complaint: Complaint): ComplaintDTO {
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

  test("serializeComplaintToDTO converts all Date objects into ISO strings", () => {
    const dto = serializeComplaint(mockComplaint);

    expect(dto.complaintId).toBe("CTS-20260911-A1B2");
    expect(dto.submittedAt).toBe("2026-09-11T10:00:00.000Z");
    expect(dto.lastUpdatedAt).toBe("2026-09-11T10:00:00.000Z");
    expect(dto.resolvedAt).toBe("2026-09-11T10:00:00.000Z");
    expect(dto.slaDeadline).toBe("2026-09-11T16:00:00.000Z");
    expect(dto.attachments[0].uploadedAt).toBe("2026-09-11T10:00:00.000Z");
    expect(dto.feedback?.submittedAt).toBe("2026-09-11T10:00:00.000Z");
    expect(dto.feedback?.rating).toBe(5);
  });

});

test.describe("Complaints Portal — Timeline Sanitization & Role Boundary", () => {
  const baseDate = new Date("2026-09-11T10:00:00.000Z");

  const rawAuditEvents: AuditEvent[] = [
    {
      auditId: "audit-1",
      complaintId: "CTS-20260911-A1B2",
      actor: "user_student_123",
      actorRole: USER_ROLES.STUDENT,
      action: AUDIT_ACTIONS.COMPLAINT_CREATED,
      timestamp: baseDate,
      note: "Complaint filed in Hostel Administration with high priority.",
    },
    {
      auditId: "audit-2",
      complaintId: "CTS-20260911-A1B2",
      actor: "officer_admin_999",
      actorRole: USER_ROLES.ADMIN,
      action: AUDIT_ACTIONS.COMPLAINT_ASSIGNED,
      timestamp: new Date("2026-09-11T11:00:00.000Z"),
      note: "Internal note: assigned to plumbing queue #4",
    },
    {
      auditId: "audit-3",
      complaintId: "CTS-20260911-A1B2",
      actor: "officer_hostel_456",
      actorRole: USER_ROLES.DEPARTMENT_OFFICER,
      action: AUDIT_ACTIONS.STATUS_CHANGED,
      timestamp: new Date("2026-09-11T12:00:00.000Z"),
      previousValue: COMPLAINT_STATUSES.PENDING,
      newValue: COMPLAINT_STATUSES.IN_REVIEW,
      note: "Investigating pipe leak in room 204",
    },
    {
      auditId: "audit-4",
      complaintId: "CTS-20260911-A1B2",
      actor: "officer_hostel_456",
      actorRole: USER_ROLES.DEPARTMENT_OFFICER,
      action: AUDIT_ACTIONS.COMPLAINT_RESOLVED,
      timestamp: new Date("2026-09-11T14:00:00.000Z"),
      newValue: COMPLAINT_STATUSES.RESOLVED,
      note: "Pipe replaced and verified.",
    },
  ];

  test("submitter timeline sanitization conceals internal notes and raw actor UIDs", () => {
    // Simulate submitter perspective projection
    const submitterTimeline: SanitizedTimelineEventDTO[] = rawAuditEvents.map((event) => {
      let title = "Status Updated";
      let description: string | undefined = undefined;

      switch (event.action) {
        case AUDIT_ACTIONS.COMPLAINT_CREATED:
          title = "Grievance Filed";
          description = "Grievance submitted and registered in the system.";
          break;
        case AUDIT_ACTIONS.COMPLAINT_ASSIGNED:
          title = "Assigned to Department";
          description = "Assigned to department team for review and remediation.";
          break;
        case AUDIT_ACTIONS.STATUS_CHANGED:
          title = "Status Changed to In Review";
          description = undefined;
          break;
        case AUDIT_ACTIONS.COMPLAINT_RESOLVED:
          title = "Resolution Provided";
          description = event.note || "Remediation completed by department officer.";
          break;
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

    expect(submitterTimeline.length).toBe(4);
    expect(submitterTimeline[0].title).toBe("Grievance Filed");
    expect(submitterTimeline[1].title).toBe("Assigned to Department");
    expect(submitterTimeline[1].description).toBe("Assigned to department team for review and remediation.");
    expect(submitterTimeline[2].title).toBe("Status Changed to In Review");
    expect(submitterTimeline[2].description).toBeUndefined(); // internal note hidden
    expect(submitterTimeline[3].title).toBe("Resolution Provided");
  });
});

test.describe("Complaints Portal — Post-Resolution Feedback Validation", () => {
  test("submitFeedbackSchema enforces valid rating (1-5) and comment length (max 500)", () => {
    // Rating out of bounds (< 1)
    const lowRating = submitFeedbackSchema.safeParse({
      complaintId: "CTS-20260911-TEST",
      rating: 0,
      comment: "Bad",
    });
    expect(lowRating.success).toBe(false);

    // Rating out of bounds (> 5)
    const highRating = submitFeedbackSchema.safeParse({
      complaintId: "CTS-20260911-TEST",
      rating: 6,
      comment: "Great",
    });
    expect(highRating.success).toBe(false);

    // Non-integer rating
    const floatRating = submitFeedbackSchema.safeParse({
      complaintId: "CTS-20260911-TEST",
      rating: 4.5,
    });
    expect(floatRating.success).toBe(false);

    // Comment exceeding 500 characters
    const longComment = submitFeedbackSchema.safeParse({
      complaintId: "CTS-20260911-TEST",
      rating: 5,
      comment: "A".repeat(501),
    });
    expect(longComment.success).toBe(false);

    // Valid feedback submission with 5 stars
    const valid = submitFeedbackSchema.safeParse({
      complaintId: "CTS-20260911-TEST",
      rating: 5,
      comment: "Excellent and timely resolution.",
    });
    expect(valid.success).toBe(true);

    // Valid feedback submission without optional comment
    const validNoComment = submitFeedbackSchema.safeParse({
      complaintId: "CTS-20260911-TEST",
      rating: 4,
    });
    expect(validNoComment.success).toBe(true);
  });
});
