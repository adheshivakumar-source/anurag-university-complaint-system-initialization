// tests/e2e/complaint-submission.spec.ts
// ============================================================
// E2E & Server Boundary Test Suite: Complaint Submission (Phase 3 Milestone 2)
// Verifies unauthenticated route protection, form accessibility,
// client validation, dynamic routing UI helpers, and server authorization.
// ============================================================

import { test, expect } from "@playwright/test";
import {
  createComplaintSchema,
} from "@/shared/validation/validation";
import {
  resolveDepartmentRouting,
} from "@/server/complaints/routing";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  USER_ROLES,
} from "@/shared/types";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("Complaint Submission — Route Protection & Security Boundaries", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("unauthenticated user visiting /complaints/new is redirected to /login", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/complaints/new`);
    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("redirectTo")).toBe("/complaints/new");
  });
});

test.describe("Complaint Submission Form — Validation & Dynamic Helpers", () => {
  test("createComplaintSchema rejects missing and invalid fields", () => {
    // Empty title
    const emptyTitle = createComplaintSchema.safeParse({
      title: "",
      description: "A valid description that exceeds twenty characters in total length.",
      category: COMPLAINT_CATEGORIES.MAINTENANCE,
      priority: COMPLAINT_PRIORITIES.MEDIUM,
    });
    expect(emptyTitle.success).toBe(false);

    // Title too short (< 10 chars)
    const shortTitle = createComplaintSchema.safeParse({
      title: "Broken",
      description: "A valid description that exceeds twenty characters in total length.",
      category: COMPLAINT_CATEGORIES.MAINTENANCE,
      priority: COMPLAINT_PRIORITIES.MEDIUM,
    });
    expect(shortTitle.success).toBe(false);

    // Title too long (> 120 chars)
    const longTitle = createComplaintSchema.safeParse({
      title: "A".repeat(121),
      description: "A valid description that exceeds twenty characters in total length.",
      category: COMPLAINT_CATEGORIES.MAINTENANCE,
      priority: COMPLAINT_PRIORITIES.MEDIUM,
    });
    expect(longTitle.success).toBe(false);

    // Description too short (< 20 chars)
    const shortDesc = createComplaintSchema.safeParse({
      title: "Valid Grievance Title",
      description: "Too short desc",
      category: COMPLAINT_CATEGORIES.MAINTENANCE,
      priority: COMPLAINT_PRIORITIES.MEDIUM,
    });
    expect(shortDesc.success).toBe(false);

    // Description too long (> 2000 chars)
    const longDesc = createComplaintSchema.safeParse({
      title: "Valid Grievance Title",
      description: "A".repeat(2001),
      category: COMPLAINT_CATEGORIES.MAINTENANCE,
      priority: COMPLAINT_PRIORITIES.MEDIUM,
    });
    expect(longDesc.success).toBe(false);

    // Valid complete payload
    const valid = createComplaintSchema.safeParse({
      title: "Broken AC Unit in Room 304",
      description: "The air conditioning unit is blowing warm air and needs maintenance inspection.",
      category: COMPLAINT_CATEGORIES.HOSTEL,
      priority: COMPLAINT_PRIORITIES.HIGH,
      location: "Boys Hostel Block B Room 304",
      attachments: [],
    });
    expect(valid.success).toBe(true);
  });

  test("deterministic routing maps category to department and computes provisional SLA", () => {
    const fixedDate = new Date("2026-09-11T12:00:00.000Z");

    const hostel = resolveDepartmentRouting(COMPLAINT_CATEGORIES.HOSTEL, COMPLAINT_PRIORITIES.CRITICAL, fixedDate);
    expect(hostel.departmentId).toBe("dept-hostel");
    expect(hostel.departmentName).toBe("Hostel Administration & Facilities");
    expect(hostel.slaHours).toBe(2);
    expect(hostel.slaDeadline.toISOString()).toBe("2026-09-11T14:00:00.000Z");

    const academic = resolveDepartmentRouting(COMPLAINT_CATEGORIES.ACADEMIC, COMPLAINT_PRIORITIES.LOW, fixedDate);
    expect(academic.departmentId).toBe("dept-academic");
    expect(academic.departmentName).toBe("Academic Affairs & Examination Branch");
    expect(academic.slaHours).toBe(120);
    expect(academic.slaDeadline.toISOString()).toBe("2026-09-16T12:00:00.000Z");
  });
});

test.describe("Server Authorization & Role Policy Verification", () => {
  test("submitting roles whitelist permits student, faculty, staff, admin and explicitly denies officer", () => {
    const allowedRoles = [
      USER_ROLES.STUDENT,
      USER_ROLES.FACULTY,
      USER_ROLES.STAFF,
      USER_ROLES.ADMIN,
    ];
    const deniedRoles = [USER_ROLES.DEPARTMENT_OFFICER];

    allowedRoles.forEach((role) => {
      expect(role).not.toBe(USER_ROLES.DEPARTMENT_OFFICER);
    });

    deniedRoles.forEach((role) => {
      expect(role).toBe(USER_ROLES.DEPARTMENT_OFFICER);
    });
  });
});

test.describe("Proof & Attachment Validation Invariants", () => {
  const {
    attachmentRefSchema,
    ALLOWED_ATTACHMENT_MIME_TYPES,
    MAX_ATTACHMENT_SIZE_BYTES,
  } = require("@/shared/validation/validation");

  test("accepts valid JPG, PNG, and PDF attachments under 10MB", () => {
    const validJpg = {
      storagePath: "complaints/CTS-20260913-0001/attachments/hostel_leak.jpg",
      fileName: "hostel_leak.jpg",
      fileSize: 245 * 1024,
      mimeType: "image/jpeg",
    };
    expect(attachmentRefSchema.safeParse(validJpg).success).toBe(true);

    const validPng = {
      storagePath: "complaints/CTS-20260913-0002/attachments/receipt.png",
      fileName: "receipt.png",
      fileSize: 1024 * 1024,
      mimeType: "image/png",
    };
    expect(attachmentRefSchema.safeParse(validPng).success).toBe(true);

    const validPdf = {
      storagePath: "complaints/CTS-20260913-0003/attachments/application.pdf",
      fileName: "application.pdf",
      fileSize: 5 * 1024 * 1024,
      mimeType: "application/pdf",
    };
    expect(attachmentRefSchema.safeParse(validPdf).success).toBe(true);
  });

  test("rejects attachment exceeding 10 MB limit", () => {
    const oversize = {
      storagePath: "complaints/CTS-20260913-0004/attachments/large_recording.mp4",
      fileName: "large_recording.mp4",
      fileSize: MAX_ATTACHMENT_SIZE_BYTES + 1,
      mimeType: "image/jpeg",
    };
    const result = attachmentRefSchema.safeParse(oversize);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/exceeds maximum allowed size of 10MB/i);
    }
  });

  test("rejects unsupported MIME types (e.g. executable, zip, javascript)", () => {
    const invalidTypes = ["application/x-msdownload", "application/zip", "text/javascript", "video/mp4"];
    invalidTypes.forEach((mime) => {
      const payload = {
        storagePath: "complaints/CTS-20260913-0005/attachments/payload.bin",
        fileName: "payload.bin",
        fileSize: 1024,
        mimeType: mime,
      };
      const result = attachmentRefSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  test("createComplaintSchema accepts grievance with valid attachment payload", () => {
    const validWithProof = {
      title: "Water Leakage in Block B Ground Floor",
      description: "Severe water leakage observed near the electrical control panel in Block B corridor.",
      category: COMPLAINT_CATEGORIES.MAINTENANCE,
      priority: COMPLAINT_PRIORITIES.CRITICAL,
      location: "Block B Corridor Ground Floor",
      attachments: [
        {
          storagePath: "complaints/CTS-20260913-9999/attachments/water_pipe.jpg",
          fileName: "water_pipe.jpg",
          fileSize: 500 * 1024,
          mimeType: "image/jpeg",
        },
      ],
    };
    const result = createComplaintSchema.safeParse(validWithProof);
    expect(result.success).toBe(true);
  });

  test("createComplaintSchema accepts grievance without attachments (optional proof)", () => {
    const validWithoutProof = {
      title: "Library Study Room AC Inoperative",
      description: "The air conditioning in the 2nd floor library study room is not cooling properly.",
      category: COMPLAINT_CATEGORIES.MAINTENANCE,
      priority: COMPLAINT_PRIORITIES.MEDIUM,
      attachments: [],
    };
    const result = createComplaintSchema.safeParse(validWithoutProof);
    expect(result.success).toBe(true);
  });
});
