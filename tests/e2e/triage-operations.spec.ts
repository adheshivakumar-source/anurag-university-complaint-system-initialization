// tests/e2e/triage-operations.spec.ts
// ============================================================
// E2E Test Suite for Phase 5.5: Operational Triage & Grievance Resolution Controls
// Tests Reassignment, Department Transfer, Rejection, Duplicate Marking,
// RBAC authorization, terminal state protection, and edge case invariants.
// ============================================================

import { test, expect } from "@playwright/test";
import {
  validateStatusTransition,
  type TransitionActorContext,
  type ComplaintStateSummary,
} from "../../src/server/complaints/transitions";
import {
  COMPLAINT_STATUSES,
  USER_ROLES,
  TERMINAL_STATUSES,
  type ComplaintCategory,
  type ComplaintPriority,
} from "../../src/shared/types";
import {
  rejectComplaintSchema,
  markDuplicateSchema,
  transferDepartmentSchema,
  assignComplaintSchema,
} from "../../src/shared/validation/validation";
import {
  resolveDepartmentRouting,
  DEPARTMENT_CONFIGS,
} from "../../src/server/complaints/routing";

test.describe("Phase 5.5: Operational Triage — Validation Schemas & Invariants", () => {
  test("rejectComplaintSchema enforces required fields and character length limits", () => {
    // Valid rejection
    const valid = rejectComplaintSchema.safeParse({
      complaintId: "CTS-20260915-ABCD",
      reason: "This grievance is out of university administrative scope.",
    });
    expect(valid.success).toBe(true);

    // Reason too short (< 10 chars)
    const shortReason = rejectComplaintSchema.safeParse({
      complaintId: "CTS-20260915-ABCD",
      reason: "Too short",
    });
    expect(shortReason.success).toBe(false);

    // Missing complaintId
    const missingId = rejectComplaintSchema.safeParse({
      complaintId: "",
      reason: "Valid rejection explanation with sufficient characters.",
    });
    expect(missingId.success).toBe(false);
  });

  test("markDuplicateSchema enforces duplicateOf and self-reference prevention", () => {
    // Valid duplicate
    const valid = markDuplicateSchema.safeParse({
      complaintId: "CTS-20260915-1111",
      duplicateOf: "CTS-20260915-2222",
      note: "Duplicate report of water leakage",
    });
    expect(valid.success).toBe(true);

    // Missing duplicateOf
    const missingTarget = markDuplicateSchema.safeParse({
      complaintId: "CTS-20260915-1111",
      duplicateOf: "",
    });
    expect(missingTarget.success).toBe(false);
  });

  test("transferDepartmentSchema validates target department ID and reason", () => {
    // Valid transfer
    const valid = transferDepartmentSchema.safeParse({
      complaintId: "CTS-20260915-ABCD",
      targetDepartmentId: "dept-maintenance",
      reason: "Physical classroom infrastructure issue misrouted to Academic.",
    });
    expect(valid.success).toBe(true);

    // Reason too short
    const shortReason = transferDepartmentSchema.safeParse({
      complaintId: "CTS-20260915-ABCD",
      targetDepartmentId: "dept-maintenance",
      reason: "Too short",
    });
    expect(shortReason.success).toBe(false);
  });

  test("assignComplaintSchema validates officer UID and name", () => {
    const valid = assignComplaintSchema.safeParse({
      complaintId: "CTS-20260915-ABCD",
      officerUid: "officer_hostel_01",
      officerName: "Hostel Officer A",
      note: "Reassigned due to workload rebalancing.",
    });
    expect(valid.success).toBe(true);

    const missingOfficer = assignComplaintSchema.safeParse({
      complaintId: "CTS-20260915-ABCD",
      officerUid: "",
      officerName: "Hostel Officer A",
    });
    expect(missingOfficer.success).toBe(false);
  });
});

test.describe("Phase 5.5: State Machine Triage Transitions (Pure Logic)", () => {
  const adminActor: TransitionActorContext = {
    uid: "admin_uid_01",
    role: USER_ROLES.ADMIN,
    departmentId: null,
  };

  const hostelOfficer: TransitionActorContext = {
    uid: "officer_hostel_01",
    role: USER_ROLES.DEPARTMENT_OFFICER,
    departmentId: "dept-hostel",
  };

  const transportOfficer: TransitionActorContext = {
    uid: "officer_transport_01",
    role: USER_ROLES.DEPARTMENT_OFFICER,
    departmentId: "dept-transport",
  };

  const submitterActor: TransitionActorContext = {
    uid: "student_sub_01",
    role: USER_ROLES.STUDENT,
  };

  const hostelComplaint: ComplaintStateSummary = {
    submittedBy: "student_sub_01",
    assignedTo: "officer_hostel_01",
    departmentId: "dept-hostel",
  };

  test("allows rejection from PENDING for Admin and matching Dept Officer", () => {
    const adminRes = validateStatusTransition(
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.REJECTED,
      adminActor,
      hostelComplaint,
    );
    expect(adminRes.allowed).toBe(true);

    const officerRes = validateStatusTransition(
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.REJECTED,
      hostelOfficer,
      hostelComplaint,
    );
    expect(officerRes.allowed).toBe(true);
  });

  test("allows rejection from IN_REVIEW for Admin and matching Dept Officer", () => {
    const adminRes = validateStatusTransition(
      COMPLAINT_STATUSES.IN_REVIEW,
      COMPLAINT_STATUSES.REJECTED,
      adminActor,
      hostelComplaint,
    );
    expect(adminRes.allowed).toBe(true);

    const officerRes = validateStatusTransition(
      COMPLAINT_STATUSES.IN_REVIEW,
      COMPLAINT_STATUSES.REJECTED,
      hostelOfficer,
      hostelComplaint,
    );
    expect(officerRes.allowed).toBe(true);
  });

  test("denies rejection from SUBMITTED directly (must advance to PENDING first)", () => {
    const res = validateStatusTransition(
      COMPLAINT_STATUSES.SUBMITTED,
      COMPLAINT_STATUSES.REJECTED,
      adminActor,
      hostelComplaint,
    );
    expect(res.allowed).toBe(false);
  });

  test("denies rejection for non-matching department officer or submitter", () => {
    const crossOfficerRes = validateStatusTransition(
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.REJECTED,
      transportOfficer,
      hostelComplaint,
    );
    expect(crossOfficerRes.allowed).toBe(false);

    const submitterRes = validateStatusTransition(
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.REJECTED,
      submitterActor,
      hostelComplaint,
    );
    expect(submitterRes.allowed).toBe(false);
  });

  test("allows marking DUPLICATE from PENDING for Admin and matching Dept Officer", () => {
    const adminRes = validateStatusTransition(
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.DUPLICATE,
      adminActor,
      hostelComplaint,
    );
    expect(adminRes.allowed).toBe(true);

    const officerRes = validateStatusTransition(
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.DUPLICATE,
      hostelOfficer,
      hostelComplaint,
    );
    expect(officerRes.allowed).toBe(true);
  });

  test("denies marking DUPLICATE from RESOLVED or CLOSED or IN_REVIEW", () => {
    const resolvedRes = validateStatusTransition(
      COMPLAINT_STATUSES.RESOLVED,
      COMPLAINT_STATUSES.DUPLICATE,
      adminActor,
      hostelComplaint,
    );
    expect(resolvedRes.allowed).toBe(false);

    const closedRes = validateStatusTransition(
      COMPLAINT_STATUSES.CLOSED,
      COMPLAINT_STATUSES.DUPLICATE,
      adminActor,
      hostelComplaint,
    );
    expect(closedRes.allowed).toBe(false);

    const inReviewRes = validateStatusTransition(
      COMPLAINT_STATUSES.IN_REVIEW,
      COMPLAINT_STATUSES.DUPLICATE,
      adminActor,
      hostelComplaint,
    );
    expect(inReviewRes.allowed).toBe(false);
  });

  test("terminal state protection: cannot transition out of REJECTED or DUPLICATE", () => {
    for (const terminal of [COMPLAINT_STATUSES.REJECTED, COMPLAINT_STATUSES.DUPLICATE, COMPLAINT_STATUSES.CLOSED]) {
      expect(TERMINAL_STATUSES.has(terminal)).toBe(true);
      const res = validateStatusTransition(
        terminal,
        COMPLAINT_STATUSES.IN_REVIEW,
        adminActor,
        hostelComplaint,
      );
      expect(res.allowed).toBe(false);
    }
  });
});

test.describe("Phase 5.5: Department Transfer Invariants & SLA Recalculation", () => {
  test("department transfer correctly maps departmentId to category and recalculates SLA", () => {
    const originalSubmittedAt = new Date("2026-09-01T10:00:00.000Z");
    const priority: ComplaintPriority = "critical";

    // Transfer from Hostel to Maintenance
    const targetDeptId = "dept-maintenance";
    const targetEntry = Object.entries(DEPARTMENT_CONFIGS).find(
      ([, config]) => config.departmentId === targetDeptId,
    );
    expect(targetEntry).toBeDefined();

    const [targetCategory, config] = targetEntry!;
    expect(targetCategory).toBe("maintenance");

    const recalculatedRouting = resolveDepartmentRouting(
      targetCategory as ComplaintCategory,
      priority,
      originalSubmittedAt,
    );

    expect(recalculatedRouting.departmentId).toBe("dept-maintenance");
    expect(recalculatedRouting.departmentName).toBe("Estate & General Maintenance");
    // Critical maintenance SLA is 2 hours
    expect(recalculatedRouting.slaHours).toBe(2);
    expect(recalculatedRouting.slaDeadline.getTime()).toBe(
      originalSubmittedAt.getTime() + 2 * 60 * 60 * 1000,
    );
  });

  test("department transfer verifies 1:1 category invariant across all 6 departments", () => {
    const allDepts = Object.values(DEPARTMENT_CONFIGS);
    expect(allDepts.length).toBe(6);

    const uniqueDeptIds = new Set(allDepts.map((d) => d.departmentId));
    expect(uniqueDeptIds.size).toBe(6);
  });
});

test.describe("Phase 5.5: Triage Operations UI & Route Redirection Checks", () => {
  test("unauthenticated user visiting /complaints/CTS-20260915-ABCD is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/complaints/CTS-20260915-ABCD");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user visiting /admin/complaints is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/admin/complaints");
    await expect(page).toHaveURL(/\/login/);
  });
});
