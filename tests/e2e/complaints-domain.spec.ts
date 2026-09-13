// tests/e2e/complaints-domain.spec.ts
// ============================================================
// Unit & Integration Test Suite for Complaint Domain (Phase 3 Milestone 1)
// Verifies Zod validation, deterministic routing, SLA calculation,
// state-machine transitions, and complaint ID generation.
// ============================================================

import { test, expect } from "@playwright/test";
import {
  createComplaintSchema,
  updateComplaintStatusSchema,
  attachmentRefSchema,
} from "@/shared/validation/validation";
import {
  resolveDepartmentRouting,
  DEPARTMENT_CONFIGS,
  PROVISIONAL_DEFAULT_SLA,
} from "@/server/complaints/routing";
import {
  validateStatusTransition,
  generateComplaintId,
} from "@/server/complaints/transitions";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  USER_ROLES,
} from "@/shared/types";

test.describe("Complaint Domain Validation (Zod Schemas)", () => {
  test("accepts valid complaint creation payload", () => {
    const validPayload = {
      title: "Broken AC in Block C Room 304",
      description: "The air conditioning unit in Room 304 has stopped working since yesterday morning.",
      category: COMPLAINT_CATEGORIES.MAINTENANCE,
      priority: COMPLAINT_PRIORITIES.HIGH,
      location: "Block C, Room 304",
      attachments: [],
    };

    const result = createComplaintSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  test("rejects title shorter than 10 characters", () => {
    const payload = {
      title: "Short",
      description: "The air conditioning unit in Room 304 has stopped working since yesterday morning.",
      category: COMPLAINT_CATEGORIES.MAINTENANCE,
      priority: COMPLAINT_PRIORITIES.MEDIUM,
    };

    const result = createComplaintSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/at least 10 characters/i);
    }
  });

  test("rejects description shorter than 20 characters", () => {
    const payload = {
      title: "Broken Projector in CSE Lab",
      description: "Too short desc",
      category: COMPLAINT_CATEGORIES.LAB,
      priority: COMPLAINT_PRIORITIES.LOW,
    };

    const result = createComplaintSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/at least 20 characters/i);
    }
  });

  test("rejects invalid complaint category", () => {
    const payload = {
      title: "Broken Projector in CSE Lab",
      description: "Projector lamp has burned out and requires replacement before the next class.",
      category: "invalid_category",
      priority: COMPLAINT_PRIORITIES.LOW,
    };

    const result = createComplaintSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  test("rejects invalid complaint priority", () => {
    const payload = {
      title: "Broken Projector in CSE Lab",
      description: "Projector lamp has burned out and requires replacement before the next class.",
      category: COMPLAINT_CATEGORIES.LAB,
      priority: "ultra_high",
    };

    const result = createComplaintSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  test("validates attachment metadata with allowed MIME types", () => {
    const validAttachment = {
      storagePath: "complaints/CTS-20260911-ABCD/attachments/photo.jpg",
      fileName: "photo.jpg",
      fileSize: 1024 * 500, // 500KB
      mimeType: "image/jpeg",
    };

    const result = attachmentRefSchema.safeParse(validAttachment);
    expect(result.success).toBe(true);
  });

  test("rejects attachment exceeding 10MB limit", () => {
    const oversizeAttachment = {
      storagePath: "complaints/CTS-20260911-ABCD/attachments/video.mp4",
      fileName: "video.mp4",
      fileSize: 15 * 1024 * 1024, // 15MB
      mimeType: "image/jpeg",
    };

    const result = attachmentRefSchema.safeParse(oversizeAttachment);
    expect(result.success).toBe(false);
  });

  test("rejects attachment with unsafe storage path", () => {
    const badPathAttachment = {
      storagePath: "etc/passwd",
      fileName: "passwd.txt",
      fileSize: 1024,
      mimeType: "text/plain",
    };

    const result = attachmentRefSchema.safeParse(badPathAttachment);
    expect(result.success).toBe(false);
  });
});

test.describe("Deterministic Category Routing & SLA Deadlines", () => {
  test("routes all 6 categories to their correct department IDs", () => {
    expect(DEPARTMENT_CONFIGS[COMPLAINT_CATEGORIES.HOSTEL].departmentId).toBe("dept-hostel");
    expect(DEPARTMENT_CONFIGS[COMPLAINT_CATEGORIES.TRANSPORT].departmentId).toBe("dept-transport");
    expect(DEPARTMENT_CONFIGS[COMPLAINT_CATEGORIES.CLASSROOM].departmentId).toBe("dept-classroom");
    expect(DEPARTMENT_CONFIGS[COMPLAINT_CATEGORIES.LAB].departmentId).toBe("dept-lab");
    expect(DEPARTMENT_CONFIGS[COMPLAINT_CATEGORIES.MAINTENANCE].departmentId).toBe("dept-maintenance");
    expect(DEPARTMENT_CONFIGS[COMPLAINT_CATEGORIES.ACADEMIC].departmentId).toBe("dept-academic");
  });

  test("computes correct SLA deadline based on priority", () => {
    const fixedBaseDate = new Date("2026-09-11T10:00:00.000Z");

    // Hostel Critical SLA = 2 hours
    const hostelCritical = resolveDepartmentRouting(
      COMPLAINT_CATEGORIES.HOSTEL,
      COMPLAINT_PRIORITIES.CRITICAL,
      fixedBaseDate,
    );
    expect(hostelCritical.slaHours).toBe(PROVISIONAL_DEFAULT_SLA.hostel.critical);
    expect(hostelCritical.slaDeadline.toISOString()).toBe("2026-09-11T12:00:00.000Z");

    // Academic Low SLA = 120 hours (5 days)
    const academicLow = resolveDepartmentRouting(
      COMPLAINT_CATEGORIES.ACADEMIC,
      COMPLAINT_PRIORITIES.LOW,
      fixedBaseDate,
    );
    expect(academicLow.slaHours).toBe(PROVISIONAL_DEFAULT_SLA.academic.low);
    expect(academicLow.slaDeadline.toISOString()).toBe("2026-09-16T10:00:00.000Z");
  });
});

test.describe("State Machine Transitions & Role Authorization", () => {
  const submitterUid = "user_student_123";
  const officerUid = "user_officer_456";
  const otherOfficerUid = "user_officer_789";

  const complaintState = {
    submittedBy: submitterUid,
    assignedTo: officerUid,
    departmentId: "dept-hostel",
  };

  test("allows Department Officer to advance PENDING to IN_REVIEW", () => {
    const result = validateStatusTransition(
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.IN_REVIEW,
      { uid: officerUid, role: USER_ROLES.DEPARTMENT_OFFICER, departmentId: "dept-hostel" },
      complaintState,
    );
    expect(result.allowed).toBe(true);
  });

  test("allows Department Officer to advance IN_REVIEW to RESOLVED", () => {
    const result = validateStatusTransition(
      COMPLAINT_STATUSES.IN_REVIEW,
      COMPLAINT_STATUSES.RESOLVED,
      { uid: officerUid, role: USER_ROLES.DEPARTMENT_OFFICER, departmentId: "dept-hostel" },
      complaintState,
    );
    expect(result.allowed).toBe(true);
  });

  test("allows Submitter to CLOSE a RESOLVED complaint", () => {
    const result = validateStatusTransition(
      COMPLAINT_STATUSES.RESOLVED,
      COMPLAINT_STATUSES.CLOSED,
      { uid: submitterUid, role: USER_ROLES.STUDENT },
      complaintState,
    );
    expect(result.allowed).toBe(true);
  });

  test("allows Submitter to REOPEN a RESOLVED complaint", () => {
    const result = validateStatusTransition(
      COMPLAINT_STATUSES.RESOLVED,
      COMPLAINT_STATUSES.REOPENED,
      { uid: submitterUid, role: USER_ROLES.STUDENT },
      complaintState,
    );
    expect(result.allowed).toBe(true);
  });

  test("denies Submitter from transitioning PENDING to IN_REVIEW directly", () => {
    const result = validateStatusTransition(
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.IN_REVIEW,
      { uid: submitterUid, role: USER_ROLES.STUDENT },
      complaintState,
    );
    expect(result.allowed).toBe(false);
  });

  test("denies Officer in different department from transitioning status", () => {
    const result = validateStatusTransition(
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.IN_REVIEW,
      { uid: otherOfficerUid, role: USER_ROLES.DEPARTMENT_OFFICER, departmentId: "dept-transport" },
      complaintState,
    );
    expect(result.allowed).toBe(false);
  });

  test("denies transitions from terminal state CLOSED", () => {
    const result = validateStatusTransition(
      COMPLAINT_STATUSES.CLOSED,
      COMPLAINT_STATUSES.IN_REVIEW,
      { uid: officerUid, role: USER_ROLES.DEPARTMENT_OFFICER, departmentId: "dept-hostel" },
      complaintState,
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/terminal status/i);
  });

  test("denies transitions from terminal state REJECTED", () => {
    const result = validateStatusTransition(
      COMPLAINT_STATUSES.REJECTED,
      COMPLAINT_STATUSES.IN_REVIEW,
      { uid: officerUid, role: USER_ROLES.ADMIN },
      complaintState,
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/terminal status/i);
  });
});

test.describe("Phase 4.2.1: Start Review (pending -> in_review) Full Authorization & State Matrix", () => {
  const submitterUid = "student_auth_01";
  const officerSameDeptUid = "officer_hostel_01";
  const officerDiffDeptUid = "officer_transport_01";
  const officerAssignedUid = "officer_assigned_01";
  const adminUid = "admin_super_01";
  const facultyUid = "faculty_prof_01";

  const pendingComplaint = {
    submittedBy: submitterUid,
    assignedTo: officerAssignedUid,
    departmentId: "dept-hostel",
  };

  test("allows Admin to start review on pending ticket", () => {
    const result = validateStatusTransition(
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.IN_REVIEW,
      { uid: adminUid, role: USER_ROLES.ADMIN },
      pendingComplaint,
    );
    expect(result.allowed).toBe(true);
  });

  test("allows Department Officer of the same department to start review", () => {
    const result = validateStatusTransition(
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.IN_REVIEW,
      { uid: officerSameDeptUid, role: USER_ROLES.DEPARTMENT_OFFICER, departmentId: "dept-hostel" },
      pendingComplaint,
    );
    expect(result.allowed).toBe(true);
  });

  test("allows assigned Officer to start review even if departmentId is not matched", () => {
    const result = validateStatusTransition(
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.IN_REVIEW,
      { uid: officerAssignedUid, role: USER_ROLES.DEPARTMENT_OFFICER, departmentId: "dept-other" },
      pendingComplaint,
    );
    expect(result.allowed).toBe(true);
  });

  test("denies Department Officer from a different department (unassigned) from starting review", () => {
    const result = validateStatusTransition(
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.IN_REVIEW,
      { uid: officerDiffDeptUid, role: USER_ROLES.DEPARTMENT_OFFICER, departmentId: "dept-transport" },
      pendingComplaint,
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/administrators or assigned department officers/i);
  });

  test("denies Student from starting review", () => {
    const result = validateStatusTransition(
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.IN_REVIEW,
      { uid: submitterUid, role: USER_ROLES.STUDENT },
      pendingComplaint,
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/administrators or assigned department officers/i);
  });

  test("denies Faculty from starting review", () => {
    const result = validateStatusTransition(
      COMPLAINT_STATUSES.PENDING,
      COMPLAINT_STATUSES.IN_REVIEW,
      { uid: facultyUid, role: USER_ROLES.FACULTY },
      pendingComplaint,
    );
    expect(result.allowed).toBe(false);
  });

  test("denies starting review if ticket is already in_review (no self-transition)", () => {
    const result = validateStatusTransition(
      COMPLAINT_STATUSES.IN_REVIEW,
      COMPLAINT_STATUSES.IN_REVIEW,
      { uid: adminUid, role: USER_ROLES.ADMIN },
      pendingComplaint,
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/already in status/i);
  });

  test("denies starting review when ticket is resolved", () => {
    const result = validateStatusTransition(
      COMPLAINT_STATUSES.RESOLVED,
      COMPLAINT_STATUSES.IN_REVIEW,
      { uid: adminUid, role: USER_ROLES.ADMIN },
      pendingComplaint,
    );
    expect(result.allowed).toBe(false);
  });

  test("denies starting review when ticket is rejected", () => {
    const result = validateStatusTransition(
      COMPLAINT_STATUSES.REJECTED,
      COMPLAINT_STATUSES.IN_REVIEW,
      { uid: officerSameDeptUid, role: USER_ROLES.DEPARTMENT_OFFICER, departmentId: "dept-hostel" },
      pendingComplaint,
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/terminal status/i);
  });

  test("denies starting review when ticket is duplicate", () => {
    const result = validateStatusTransition(
      COMPLAINT_STATUSES.DUPLICATE,
      COMPLAINT_STATUSES.IN_REVIEW,
      { uid: adminUid, role: USER_ROLES.ADMIN },
      pendingComplaint,
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/terminal status/i);
  });

  test("denies starting review when ticket is closed", () => {
    const result = validateStatusTransition(
      COMPLAINT_STATUSES.CLOSED,
      COMPLAINT_STATUSES.IN_REVIEW,
      { uid: adminUid, role: USER_ROLES.ADMIN },
      pendingComplaint,
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/terminal status/i);
  });
});

test.describe("Complaint ID Generator", () => {
  test("generates human-readable collision-resistant CTS ID format", () => {
    const id = generateComplaintId(new Date("2026-09-11"));
    expect(id).toMatch(/^CTS-20260911-[0-9A-F]{4}$/);
  });

  test("generates unique IDs across successive calls", () => {
    const id1 = generateComplaintId();
    const id2 = generateComplaintId();
    expect(id1).not.toBe(id2);
  });
});
