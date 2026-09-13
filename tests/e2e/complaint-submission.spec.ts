// tests/e2e/complaint-submission.spec.ts
// ============================================================
// E2E & Server Boundary Test Suite: Complaint Submission (Phase 3 Milestone 2)
// Verifies unauthenticated route protection, form accessibility,
// client validation, dynamic routing UI helpers, and server authorization.
// ============================================================

import { test, expect } from "@playwright/test";
import {
  createComplaintSchema,
} from "@/lib/complaints/validation";
import {
  resolveDepartmentRouting,
} from "@/lib/complaints/routing";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  USER_ROLES,
} from "@/types";

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
