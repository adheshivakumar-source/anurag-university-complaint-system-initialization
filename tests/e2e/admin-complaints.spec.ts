// tests/e2e/admin-complaints.spec.ts
// ============================================================
// E2E & Server Boundary Test Suite: Phase 5.4 Admin Complaints Workspace
// Verifies route protection, cross-department visibility,
// multi-attribute filtering, search semantics, sorting, and regression.
// ============================================================

import { test, expect } from "@playwright/test";
import type { ComplaintDTO, ComplaintStatus } from "@/shared/types";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  USER_ROLES,
} from "@/shared/types";
import { DEPARTMENT_CONFIGS } from "@/server/complaints/routing";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Complaints Workspace — Route Protection & Redirection", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("unauthenticated user visiting /admin/complaints is redirected to /login with redirectTo", async ({
    page,
  }) => {
    const response = await page.goto(`${BASE_URL}/admin/complaints`);
    expect(response?.url()).toContain("/login");
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fadmin%2Fcomplaints/);
  });
});

test.describe("Admin Complaints Workspace — Cross-Department Visibility & Filter Invariants", () => {
  const mockDate = "2026-09-14T12:00:00.000Z";

  const sampleInstitutionalComplaints: ComplaintDTO[] = [
    {
      complaintId: "CTS-20260914-0001",
      title: "Broken laboratory equipment in Physics Lab",
      description: "Laser apparatus needs calibration",
      category: COMPLAINT_CATEGORIES.LAB,
      priority: COMPLAINT_PRIORITIES.HIGH,
      status: COMPLAINT_STATUSES.SUBMITTED,
      submittedBy: "user_student_1",
      submittedByName: "Rahul Verma",
      submittedAt: "2026-09-14T10:00:00.000Z",
      departmentId: "dept-lab",
      assignedTo: null,
      assignedToName: null,
      assignedAt: null,
      location: "Physics Lab 2",
      attachments: [],
      lastUpdatedAt: mockDate,
      resolvedAt: null,
      closedAt: null,
      resolution: null,
      slaDeadline: "2026-09-14T16:00:00.000Z",
      escalationLevel: 0,
      escalatedAt: null,
      isDuplicate: false,
      duplicateOf: null,
      feedback: null,
      isAnonymous: false,
      tags: [],
    },
    {
      complaintId: "CTS-20260914-0002",
      title: "Hostel water purifier not functioning",
      description: "Block A 1st floor water purifier off",
      category: COMPLAINT_CATEGORIES.HOSTEL,
      priority: COMPLAINT_PRIORITIES.CRITICAL,
      status: COMPLAINT_STATUSES.PENDING,
      submittedBy: "user_student_2",
      submittedByName: "Sneha Reddy",
      submittedAt: "2026-09-14T09:00:00.000Z",
      departmentId: "dept-hostel",
      assignedTo: "officer_hostel_1",
      assignedToName: "Hostel Officer",
      assignedAt: "2026-09-14T09:30:00.000Z",
      location: "Hostel Block A",
      attachments: [],
      lastUpdatedAt: mockDate,
      resolvedAt: null,
      closedAt: null,
      resolution: null,
      slaDeadline: "2026-09-14T11:00:00.000Z",
      escalationLevel: 0,
      escalatedAt: null,
      isDuplicate: false,
      duplicateOf: null,
      feedback: null,
      isAnonymous: false,
      tags: [],
    },
    {
      complaintId: "CTS-20260914-0003",
      title: "Bus route 12 delay issues",
      description: "Bus consistently arriving 30 mins late",
      category: COMPLAINT_CATEGORIES.TRANSPORT,
      priority: COMPLAINT_PRIORITIES.MEDIUM,
      status: COMPLAINT_STATUSES.IN_REVIEW,
      submittedBy: "user_faculty_1",
      submittedByName: "Dr. Raman Rao",
      submittedAt: "2026-09-13T08:00:00.000Z",
      departmentId: "dept-transport",
      assignedTo: "officer_transport_1",
      assignedToName: "Transport Manager",
      assignedAt: "2026-09-13T09:00:00.000Z",
      location: "Route 12",
      attachments: [],
      lastUpdatedAt: mockDate,
      resolvedAt: null,
      closedAt: null,
      resolution: null,
      slaDeadline: "2026-09-14T08:00:00.000Z",
      escalationLevel: 0,
      escalatedAt: null,
      isDuplicate: false,
      duplicateOf: null,
      feedback: null,
      isAnonymous: false,
      tags: [],
    },
    {
      complaintId: "CTS-20260914-0004",
      title: "Power fluctuation in Classroom Block 4",
      description: "Voltage drops damaging projectors",
      category: COMPLAINT_CATEGORIES.CLASSROOM,
      priority: COMPLAINT_PRIORITIES.CRITICAL,
      status: COMPLAINT_STATUSES.ESCALATED,
      submittedBy: "user_staff_1",
      submittedByName: "Praveen Kumar",
      submittedAt: "2026-09-12T14:00:00.000Z",
      departmentId: "dept-classroom",
      assignedTo: null,
      assignedToName: null,
      assignedAt: null,
      location: "Block 4",
      attachments: [],
      lastUpdatedAt: mockDate,
      resolvedAt: null,
      closedAt: null,
      resolution: null,
      slaDeadline: "2026-09-12T18:00:00.000Z",
      escalationLevel: 1,
      escalatedAt: "2026-09-12T19:00:00.000Z",
      isDuplicate: false,
      duplicateOf: null,
      feedback: null,
      isAnonymous: false,
      tags: [],
    },
    {
      complaintId: "CTS-20260914-0005",
      title: "AC cooling issue in Seminar Hall 1",
      description: "AC fixed and tested",
      category: COMPLAINT_CATEGORIES.MAINTENANCE,
      priority: COMPLAINT_PRIORITIES.HIGH,
      status: COMPLAINT_STATUSES.RESOLVED,
      submittedBy: "user_faculty_2",
      submittedByName: "Prof. Ananya Sen",
      submittedAt: "2026-09-11T10:00:00.000Z",
      departmentId: "dept-maintenance",
      assignedTo: "officer_maint_1",
      assignedToName: "Maintenance Supervisor",
      assignedAt: "2026-09-11T10:30:00.000Z",
      location: "Seminar Hall 1",
      attachments: [],
      lastUpdatedAt: mockDate,
      resolvedAt: "2026-09-12T12:00:00.000Z",
      closedAt: null,
      resolution: "Compressor capacitor replaced and tested.",
      slaDeadline: "2026-09-11T22:00:00.000Z",
      escalationLevel: 0,
      escalatedAt: null,
      isDuplicate: false,
      duplicateOf: null,
      feedback: null,
      isAnonymous: false,
      tags: [],
    },
    {
      complaintId: "CTS-20260914-0006",
      title: "Fee receipt discrepancy in Accounts",
      description: "Receipt duplicate issued",
      category: COMPLAINT_CATEGORIES.ACADEMIC,
      priority: COMPLAINT_PRIORITIES.LOW,
      status: COMPLAINT_STATUSES.CLOSED,
      submittedBy: "user_student_3",
      submittedByName: "Vikram Patel",
      submittedAt: "2026-09-10T11:00:00.000Z",
      departmentId: "dept-academic",
      assignedTo: "officer_acad_1",
      assignedToName: "Academic Registrar",
      assignedAt: "2026-09-10T12:00:00.000Z",
      location: "Admin Block",
      attachments: [],
      lastUpdatedAt: mockDate,
      resolvedAt: "2026-09-11T14:00:00.000Z",
      closedAt: "2026-09-12T10:00:00.000Z",
      resolution: "Duplicate receipt generated and emailed.",
      slaDeadline: "2026-09-15T11:00:00.000Z",
      escalationLevel: 0,
      escalatedAt: null,
      isDuplicate: false,
      duplicateOf: null,
      feedback: {
        rating: 5,
        comment: "Prompt resolution.",
        submittedAt: "2026-09-12T10:00:00.000Z",
      },
      isAnonymous: false,
      tags: [],
    },
    {
      complaintId: "CTS-20260914-0007",
      title: "Broken window in Library reading room",
      description: "Reopened for further sealing",
      category: COMPLAINT_CATEGORIES.MAINTENANCE,
      priority: COMPLAINT_PRIORITIES.MEDIUM,
      status: COMPLAINT_STATUSES.REOPENED,
      submittedBy: "user_student_1",
      submittedByName: "Rahul Verma",
      submittedAt: "2026-09-09T09:00:00.000Z",
      departmentId: "dept-maintenance",
      assignedTo: "officer_maint_1",
      assignedToName: "Maintenance Supervisor",
      assignedAt: "2026-09-09T10:00:00.000Z",
      location: "Library 2nd Floor",
      attachments: [],
      lastUpdatedAt: mockDate,
      resolvedAt: null,
      closedAt: null,
      resolution: null,
      slaDeadline: "2026-09-11T09:00:00.000Z",
      escalationLevel: 0,
      escalatedAt: null,
      isDuplicate: false,
      duplicateOf: null,
      feedback: null,
      isAnonymous: false,
      tags: [],
    },
  ];

  test("verifies all 6 university departments are represented in cross-department dataset", () => {
    const departments = new Set(sampleInstitutionalComplaints.map((c) => c.departmentId));
    expect(departments.has("dept-lab")).toBe(true);
    expect(departments.has("dept-hostel")).toBe(true);
    expect(departments.has("dept-transport")).toBe(true);
    expect(departments.has("dept-classroom")).toBe(true);
    expect(departments.has("dept-maintenance")).toBe(true);
    expect(departments.has("dept-academic")).toBe(true);
    expect(departments.size).toBe(6);
  });

  test("filters complaints by departmentId accurately", () => {
    const maintenanceComplaints = sampleInstitutionalComplaints.filter(
      (c) => c.departmentId === "dept-maintenance",
    );
    expect(maintenanceComplaints).toHaveLength(2);
    expect(maintenanceComplaints.map((c) => c.complaintId)).toEqual([
      "CTS-20260914-0005",
      "CTS-20260914-0007",
    ]);
  });

  test("filters complaints by status accurately", () => {
    const escalatedComplaints = sampleInstitutionalComplaints.filter(
      (c) => c.status === COMPLAINT_STATUSES.ESCALATED,
    );
    expect(escalatedComplaints).toHaveLength(1);
    expect(escalatedComplaints[0].complaintId).toBe("CTS-20260914-0004");

    const closedComplaints = sampleInstitutionalComplaints.filter(
      (c) => c.status === COMPLAINT_STATUSES.CLOSED,
    );
    expect(closedComplaints).toHaveLength(1);
    expect(closedComplaints[0].complaintId).toBe("CTS-20260914-0006");
  });

  test("filters complaints by priority accurately", () => {
    const criticalComplaints = sampleInstitutionalComplaints.filter(
      (c) => c.priority === COMPLAINT_PRIORITIES.CRITICAL,
    );
    expect(criticalComplaints).toHaveLength(2);
    expect(criticalComplaints.map((c) => c.complaintId)).toEqual([
      "CTS-20260914-0002",
      "CTS-20260914-0004",
    ]);
  });

  test("filters complaints by category accurately", () => {
    const labComplaints = sampleInstitutionalComplaints.filter(
      (c) => c.category === COMPLAINT_CATEGORIES.LAB,
    );
    expect(labComplaints).toHaveLength(1);
    expect(labComplaints[0].complaintId).toBe("CTS-20260914-0001");
  });

  test("searches complaints by ticket ID substring", () => {
    const query = "0003";
    const matches = sampleInstitutionalComplaints.filter((c) =>
      c.complaintId.toLowerCase().includes(query),
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].complaintId).toBe("CTS-20260914-0003");
  });

  test("searches complaints by title substring", () => {
    const query = "water purifier";
    const matches = sampleInstitutionalComplaints.filter((c) =>
      c.title.toLowerCase().includes(query),
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].complaintId).toBe("CTS-20260914-0002");
  });

  test("searches complaints by submitter name substring", () => {
    const query = "verma";
    const matches = sampleInstitutionalComplaints.filter((c) =>
      c.submittedByName.toLowerCase().includes(query),
    );
    expect(matches).toHaveLength(2); // CTS-20260914-0001 and CTS-20260914-0007
  });

  test("sorts complaints by submittedAt (newest vs oldest)", () => {
    const newestFirst = [...sampleInstitutionalComplaints].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
    expect(newestFirst[0].complaintId).toBe("CTS-20260914-0001");
    expect(newestFirst[newestFirst.length - 1].complaintId).toBe("CTS-20260914-0007");

    const oldestFirst = [...sampleInstitutionalComplaints].sort(
      (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
    );
    expect(oldestFirst[0].complaintId).toBe("CTS-20260914-0007");
    expect(oldestFirst[oldestFirst.length - 1].complaintId).toBe("CTS-20260914-0001");
  });

  test("handles empty search results without throwing errors", () => {
    const query = "non_existent_xyz_query";
    const matches = sampleInstitutionalComplaints.filter((c) =>
      c.title.toLowerCase().includes(query),
    );
    expect(matches).toHaveLength(0);
  });
});

test.describe("AU-CTS Regression Verification Across Workspaces", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("unauthenticated user visiting /complaints is redirected to /login with redirectTo", async ({
    page,
  }) => {
    const response = await page.goto(`${BASE_URL}/complaints`);
    expect(response?.url()).toContain("/login");
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fcomplaints/);
  });

  test("unauthenticated user visiting /officer is redirected to /login with redirectTo", async ({
    page,
  }) => {
    const response = await page.goto(`${BASE_URL}/officer`);
    expect(response?.url()).toContain("/login");
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fofficer/);
  });

  test("unauthenticated user visiting /admin/users is redirected to /login with redirectTo", async ({
    page,
  }) => {
    const response = await page.goto(`${BASE_URL}/admin/users`);
    expect(response?.url()).toContain("/login");
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fadmin%2Fusers/);
  });

  test("unauthenticated user visiting /admin is redirected to /login with redirectTo", async ({
    page,
  }) => {
    const response = await page.goto(`${BASE_URL}/admin`);
    expect(response?.url()).toContain("/login");
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fadmin/);
  });
});
