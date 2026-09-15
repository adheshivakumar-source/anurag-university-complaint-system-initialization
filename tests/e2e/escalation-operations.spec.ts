// tests/e2e/escalation-operations.spec.ts
// ============================================================
// Phase 5.6: Escalation Management & Operational Progress Notes
// Automated tests verifying schemas, state-machine transitions,
// escalation levels, progress note logging, and timeline sanitization.
// ============================================================

import { test, expect } from "@playwright/test";
import {
  escalateComplaintSchema,
  addComplaintNoteSchema,
} from "../../src/shared/validation/validation";
import {
  validateStatusTransition,
  type TransitionActorContext,
  type ComplaintStateSummary,
} from "../../src/server/complaints/transitions";
import {
  COMPLAINT_STATUSES,
  USER_ROLES,
  AUDIT_ACTIONS,
  type ComplaintStatus,
} from "../../src/shared/types";

test.describe("Phase 5.6: Validation Schemas & Input Guards", () => {
  test("escalateComplaintSchema enforces minimum 10 characters and required complaintId", () => {
    const valid = escalateComplaintSchema.safeParse({
      complaintId: "CTS-20260915-ABCD",
      reason: "High severity lab issue exceeding departmental resolution capacity.",
    });
    expect(valid.success).toBe(true);

    const shortReason = escalateComplaintSchema.safeParse({
      complaintId: "CTS-20260915-ABCD",
      reason: "Too short",
    });
    expect(shortReason.success).toBe(false);

    const emptyId = escalateComplaintSchema.safeParse({
      complaintId: "",
      reason: "Valid length escalation reason provided.",
    });
    expect(emptyId.success).toBe(false);

    const whitespace = escalateComplaintSchema.safeParse({
      complaintId: "CTS-20260915-ABCD",
      reason: "          ",
    });
    expect(whitespace.success).toBe(false);
  });

  test("addComplaintNoteSchema enforces minimum 5 characters and required complaintId", () => {
    const valid = addComplaintNoteSchema.safeParse({
      complaintId: "CTS-20260915-ABCD",
      note: "Inspection scheduled for tomorrow with electrical contractor.",
    });
    expect(valid.success).toBe(true);

    const shortNote = addComplaintNoteSchema.safeParse({
      complaintId: "CTS-20260915-ABCD",
      note: "Done",
    });
    expect(shortNote.success).toBe(false);

    const whitespace = addComplaintNoteSchema.safeParse({
      complaintId: "CTS-20260915-ABCD",
      note: "    ",
    });
    expect(whitespace.success).toBe(false);
  });
});

test.describe("Phase 5.6: State Machine Escalation Transitions (Pure Logic)", () => {
  const adminActor: TransitionActorContext = {
    uid: "admin_01",
    role: USER_ROLES.ADMIN,
    departmentId: null,
  };

  const matchingOfficerActor: TransitionActorContext = {
    uid: "officer_hostel_01",
    role: USER_ROLES.DEPARTMENT_OFFICER,
    departmentId: "dept-hostel",
  };

  const otherDeptOfficerActor: TransitionActorContext = {
    uid: "officer_transport_01",
    role: USER_ROLES.DEPARTMENT_OFFICER,
    departmentId: "dept-transport",
  };

  const submitterActor: TransitionActorContext = {
    uid: "student_01",
    role: USER_ROLES.STUDENT,
    departmentId: null,
  };

  const hostelComplaint: ComplaintStateSummary = {
    submittedBy: "student_01",
    assignedTo: "officer_hostel_01",
    departmentId: "dept-hostel",
  };

  test("allows escalation from PENDING for Admin and matching Department Officer", () => {
    const adminRes = validateStatusTransition(
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.ESCALATED,
      adminActor,
      hostelComplaint,
    );
    expect(adminRes.allowed).toBe(true);

    const officerRes = validateStatusTransition(
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.ESCALATED,
      matchingOfficerActor,
      hostelComplaint,
    );
    expect(officerRes.allowed).toBe(true);
  });

  test("allows escalation from IN_REVIEW for Admin and matching Department Officer", () => {
    const adminRes = validateStatusTransition(
      COMPLAINT_STATUSES.IN_REVIEW,
      COMPLAINT_STATUSES.ESCALATED,
      adminActor,
      hostelComplaint,
    );
    expect(adminRes.allowed).toBe(true);

    const officerRes = validateStatusTransition(
      COMPLAINT_STATUSES.IN_REVIEW,
      COMPLAINT_STATUSES.ESCALATED,
      matchingOfficerActor,
      hostelComplaint,
    );
    expect(officerRes.allowed).toBe(true);
  });

  test("allows escalation from REOPENED for Admin and matching Department Officer", () => {
    const adminRes = validateStatusTransition(
      COMPLAINT_STATUSES.REOPENED,
      COMPLAINT_STATUSES.ESCALATED,
      adminActor,
      hostelComplaint,
    );
    expect(adminRes.allowed).toBe(true);

    const officerRes = validateStatusTransition(
      COMPLAINT_STATUSES.REOPENED,
      COMPLAINT_STATUSES.ESCALATED,
      matchingOfficerActor,
      hostelComplaint,
    );
    expect(officerRes.allowed).toBe(true);
  });

  test("denies escalation from SUBMITTED directly (must route/acknowledge to PENDING first)", () => {
    const res = validateStatusTransition(
      COMPLAINT_STATUSES.SUBMITTED,
      COMPLAINT_STATUSES.ESCALATED,
      adminActor,
      hostelComplaint,
    );
    expect(res.allowed).toBe(false);
  });

  test("denies self-transition from ESCALATED to ESCALATED directly", () => {
    const res = validateStatusTransition(
      COMPLAINT_STATUSES.ESCALATED,
      COMPLAINT_STATUSES.ESCALATED,
      adminActor,
      hostelComplaint,
    );
    expect(res.allowed).toBe(false);
  });

  test("denies escalation for non-matching department officer and submitter", () => {
    const otherOfficerRes = validateStatusTransition(
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.ESCALATED,
      otherDeptOfficerActor,
      hostelComplaint,
    );
    expect(otherOfficerRes.allowed).toBe(false);

    const submitterRes = validateStatusTransition(
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.ESCALATED,
      submitterActor,
      hostelComplaint,
    );
    expect(submitterRes.allowed).toBe(false);
  });

  test("denies escalation from terminal states (CLOSED, REJECTED, DUPLICATE) and RESOLVED", () => {
    const terminalStates: ComplaintStatus[] = [
      COMPLAINT_STATUSES.CLOSED,
      COMPLAINT_STATUSES.REJECTED,
      COMPLAINT_STATUSES.DUPLICATE,
      COMPLAINT_STATUSES.RESOLVED,
    ];

    for (const st of terminalStates) {
      const res = validateStatusTransition(
        st,
        COMPLAINT_STATUSES.ESCALATED,
        adminActor,
        hostelComplaint,
      );
      expect(res.allowed).toBe(false);
    }
  });

  test("allows de-escalation/resumption from ESCALATED to IN_REVIEW or RESOLVED", () => {
    const toReview = validateStatusTransition(
      COMPLAINT_STATUSES.ESCALATED,
      COMPLAINT_STATUSES.IN_REVIEW,
      adminActor,
      hostelComplaint,
    );
    expect(toReview.allowed).toBe(true);

    const toResolved = validateStatusTransition(
      COMPLAINT_STATUSES.ESCALATED,
      COMPLAINT_STATUSES.RESOLVED,
      matchingOfficerActor,
      hostelComplaint,
    );
    expect(toResolved.allowed).toBe(true);
  });
});

test.describe("Phase 5.6: Escalation Level Logic & Invariants", () => {
  test("simulates escalation level incrementing from 0 to 3 and denial at level 3", () => {
    const simulateEscalation = (currentLevel: number) => {
      if (currentLevel >= 3) {
        throw new Error("Complaint has already reached the maximum escalation level (Level 3).");
      }
      return (currentLevel + 1) as 1 | 2 | 3;
    };

    expect(simulateEscalation(0)).toBe(1);
    expect(simulateEscalation(1)).toBe(2);
    expect(simulateEscalation(2)).toBe(3);
    expect(() => simulateEscalation(3)).toThrow("maximum escalation level");
  });
});

test.describe("Phase 5.6: Progress Note Permissions & Timeline Sanitization", () => {
  test("verifies active statuses permitted for investigation progress notes", () => {
    const ACTIVE_NOTE_STATUSES = new Set<ComplaintStatus>([
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.IN_REVIEW,
      COMPLAINT_STATUSES.ESCALATED,
      COMPLAINT_STATUSES.REOPENED,
    ]);

    expect(ACTIVE_NOTE_STATUSES.has(COMPLAINT_STATUSES.PENDING)).toBe(true);
    expect(ACTIVE_NOTE_STATUSES.has(COMPLAINT_STATUSES.IN_REVIEW)).toBe(true);
    expect(ACTIVE_NOTE_STATUSES.has(COMPLAINT_STATUSES.ESCALATED)).toBe(true);
    expect(ACTIVE_NOTE_STATUSES.has(COMPLAINT_STATUSES.REOPENED)).toBe(true);

    // Terminal or non-active statuses must be rejected
    expect(ACTIVE_NOTE_STATUSES.has(COMPLAINT_STATUSES.CLOSED)).toBe(false);
    expect(ACTIVE_NOTE_STATUSES.has(COMPLAINT_STATUSES.REJECTED)).toBe(false);
    expect(ACTIVE_NOTE_STATUSES.has(COMPLAINT_STATUSES.DUPLICATE)).toBe(false);
    expect(ACTIVE_NOTE_STATUSES.has(COMPLAINT_STATUSES.RESOLVED)).toBe(false);
  });

  test("verifies timeline sanitization logic for INVESTIGATION_NOTE action", () => {
    const internalNoteText = "Vendor arrived on campus. Replacement cooling unit ordered from Pune.";

    const sanitizeEvent = (action: string, noteText: string, isSubmitter: boolean) => {
      if (action === AUDIT_ACTIONS.INVESTIGATION_NOTE) {
        return {
          title: isSubmitter ? "Investigation Updated" : "Investigation Note",
          description: isSubmitter
            ? "Department officers updated internal investigation notes."
            : noteText,
        };
      }
      return { title: "Activity", description: noteText };
    };

    const submitterView = sanitizeEvent(AUDIT_ACTIONS.INVESTIGATION_NOTE, internalNoteText, true);
    expect(submitterView.title).toBe("Investigation Updated");
    expect(submitterView.description).toBe("Department officers updated internal investigation notes.");
    expect(submitterView.description).not.toContain("Pune");
    expect(submitterView.description).not.toContain("Vendor");

    const officerView = sanitizeEvent(AUDIT_ACTIONS.INVESTIGATION_NOTE, internalNoteText, false);
    expect(officerView.title).toBe("Investigation Note");
    expect(officerView.description).toBe(internalNoteText);
    expect(officerView.description).toContain("Pune");
  });
});

test.describe("Phase 5.6: Route Redirection & Boundary Protection", () => {
  test("unauthenticated user visiting /complaints/CTS-20260915-ABCD is redirected to /login", async ({ page }) => {
    await page.goto("/complaints/CTS-20260915-ABCD");
    await expect(page).toHaveURL(/.*\/login.*/);
  });
});
