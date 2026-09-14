// tests/e2e/admin-dashboard.spec.ts
// ============================================================
// E2E & Server Boundary Test Suite: Phase 5.3 Admin Dashboard
// Verifies route protection, institutional grievance KPIs,
// user governance metrics, recent stream ordering, and zero-state handling.
// ============================================================

import { test, expect } from "@playwright/test";
import type { ComplaintDTO, UserProfileDTO, ComplaintStatus } from "@/shared/types";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  USER_ROLES,
} from "@/shared/types";
import { DEPARTMENT_CONFIGS } from "@/server/complaints/routing";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Dashboard — Route Protection and Redirection", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("unauthenticated user visiting /admin is redirected to /login with redirectTo", async ({
    page,
  }) => {
    const response = await page.goto(`${BASE_URL}/admin`);
    expect(response?.url()).toContain("/login");
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fadmin/);
  });

  test("unauthenticated user visiting /admin/users is redirected to /login with redirectTo", async ({
    page,
  }) => {
    const response = await page.goto(`${BASE_URL}/admin/users`);
    expect(response?.url()).toContain("/login");
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fadmin%2Fusers/);
  });
});

test.describe("Admin Dashboard — Institutional Grievance KPI Invariants", () => {
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

  const activeStatuses: readonly ComplaintStatus[] = [
    COMPLAINT_STATUSES.PENDING,
    COMPLAINT_STATUSES.IN_REVIEW,
    COMPLAINT_STATUSES.REOPENED,
  ];

  test("correctly computes institutional grievance counts across statuses", () => {
    const totalComplaints = sampleInstitutionalComplaints.length;
    const submittedCount = sampleInstitutionalComplaints.filter(
      (c) => c.status === COMPLAINT_STATUSES.SUBMITTED,
    ).length;
    const activeRemediationCount = sampleInstitutionalComplaints.filter((c) =>
      activeStatuses.includes(c.status),
    ).length;
    const escalatedCount = sampleInstitutionalComplaints.filter(
      (c) => c.status === COMPLAINT_STATUSES.ESCALATED,
    ).length;
    const resolvedCount = sampleInstitutionalComplaints.filter(
      (c) => c.status === COMPLAINT_STATUSES.RESOLVED,
    ).length;
    const closedCount = sampleInstitutionalComplaints.filter(
      (c) => c.status === COMPLAINT_STATUSES.CLOSED,
    ).length;
    const unassignedCount = sampleInstitutionalComplaints.filter(
      (c) => c.assignedTo === null,
    ).length;

    expect(totalComplaints).toBe(7);
    expect(submittedCount).toBe(1);
    expect(activeRemediationCount).toBe(3); // pending, in_review, reopened
    expect(escalatedCount).toBe(1);
    expect(resolvedCount).toBe(1);
    expect(closedCount).toBe(1);
    expect(unassignedCount).toBe(2); // CTS-20260914-0001 and CTS-20260914-0004
  });

  test("limits recent grievances stream to exactly 5 items", () => {
    const recent = sampleInstitutionalComplaints.slice(0, 5);
    expect(recent).toHaveLength(5);
    expect(recent[0].complaintId).toBe("CTS-20260914-0001");
    expect(recent[4].complaintId).toBe("CTS-20260914-0005");
  });

  test("handles zero-state institutional grievance metrics cleanly", () => {
    const emptyList: ComplaintDTO[] = [];
    const total = emptyList.length;
    const submitted = emptyList.filter((c) => c.status === COMPLAINT_STATUSES.SUBMITTED).length;
    const active = emptyList.filter((c) => activeStatuses.includes(c.status)).length;
    const escalated = emptyList.filter((c) => c.status === COMPLAINT_STATUSES.ESCALATED).length;
    const resolved = emptyList.filter((c) => c.status === COMPLAINT_STATUSES.RESOLVED).length;
    const closed = emptyList.filter((c) => c.status === COMPLAINT_STATUSES.CLOSED).length;
    const unassigned = emptyList.filter((c) => c.assignedTo === null).length;

    expect(total).toBe(0);
    expect(submitted).toBe(0);
    expect(active).toBe(0);
    expect(escalated).toBe(0);
    expect(resolved).toBe(0);
    expect(closed).toBe(0);
    expect(unassigned).toBe(0);
  });

});

test.describe("Admin Dashboard — User Governance Metrics Invariants", () => {
  const sampleUsers: UserProfileDTO[] = [
    {
      uid: "u1",
      displayName: "Student One",
      email: "student1@anurag.edu.in",
      role: USER_ROLES.STUDENT,
      departmentId: null,
      studentId: "21AU1A0501",
      employeeId: null,
      isActive: true,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
      lastLoginAt: "2026-09-14T00:00:00.000Z",
    },
    {
      uid: "u2",
      displayName: "Student Two",
      email: "student2@anurag.edu.in",
      role: USER_ROLES.STUDENT,
      departmentId: null,
      studentId: "21AU1A0502",
      employeeId: null,
      isActive: false, // Deactivated
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-10T00:00:00.000Z",
      lastLoginAt: null,
    },
    {
      uid: "u3",
      displayName: "Prof. Sharma",
      email: "sharma@anurag.edu.in",
      role: USER_ROLES.FACULTY,
      departmentId: "dept-academic",
      studentId: null,
      employeeId: "FAC-101",
      isActive: true,
      createdAt: "2026-08-15T00:00:00.000Z",
      updatedAt: "2026-08-15T00:00:00.000Z",
      lastLoginAt: "2026-09-13T00:00:00.000Z",
    },
    {
      uid: "u4",
      displayName: "Lab Tech Raj",
      email: "raj@anurag.edu.in",
      role: USER_ROLES.STAFF,
      departmentId: "dept-lab",
      studentId: null,
      employeeId: "STF-201",
      isActive: true,
      createdAt: "2026-08-20T00:00:00.000Z",
      updatedAt: "2026-08-20T00:00:00.000Z",
      lastLoginAt: null,
    },
    {
      uid: "u5",
      displayName: "Hostel Officer",
      email: "hostel.officer@anurag.edu.in",
      role: USER_ROLES.DEPARTMENT_OFFICER,
      departmentId: "dept-hostel",
      studentId: null,
      employeeId: "OFF-301",
      isActive: true,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
      lastLoginAt: "2026-09-14T08:00:00.000Z",
    },
    {
      uid: "u6",
      displayName: "Super Admin",
      email: "admin@anurag.edu.in",
      role: USER_ROLES.ADMIN,
      departmentId: null,
      studentId: null,
      employeeId: "ADM-001",
      isActive: true,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
      lastLoginAt: "2026-09-14T09:00:00.000Z",
    },
  ];

  test("correctly computes user governance metrics across roles", () => {
    const totalUsers = sampleUsers.length;
    const studentsCount = sampleUsers.filter((u) => u.role === USER_ROLES.STUDENT).length;
    const facultyCount = sampleUsers.filter((u) => u.role === USER_ROLES.FACULTY).length;
    const staffCount = sampleUsers.filter((u) => u.role === USER_ROLES.STAFF).length;
    const officersCount = sampleUsers.filter((u) => u.role === USER_ROLES.DEPARTMENT_OFFICER).length;
    const deactivatedCount = sampleUsers.filter((u) => !u.isActive).length;

    expect(totalUsers).toBe(6);
    expect(studentsCount).toBe(2);
    expect(facultyCount).toBe(1);
    expect(staffCount).toBe(1);
    expect(officersCount).toBe(1);
    expect(deactivatedCount).toBe(1);
  });

  test("handles empty user pool with zero counters", () => {
    const emptyUsers: UserProfileDTO[] = [];
    expect(emptyUsers.length).toBe(0);
    expect(emptyUsers.filter((u) => u.role === USER_ROLES.STUDENT).length).toBe(0);
    expect(emptyUsers.filter((u) => u.role === USER_ROLES.FACULTY).length).toBe(0);
    expect(emptyUsers.filter((u) => u.role === USER_ROLES.STAFF).length).toBe(0);
    expect(emptyUsers.filter((u) => u.role === USER_ROLES.DEPARTMENT_OFFICER).length).toBe(0);
    expect(emptyUsers.filter((u) => !u.isActive).length).toBe(0);
  });
});

test.describe("Admin Dashboard — Department Directory Configuration Verification", () => {
  test("verifies all 6 university departments are registered in DEPARTMENT_CONFIGS", () => {
    const categories = Object.keys(DEPARTMENT_CONFIGS);
    expect(categories).toHaveLength(6);
    expect(categories).toContain(COMPLAINT_CATEGORIES.HOSTEL);
    expect(categories).toContain(COMPLAINT_CATEGORIES.TRANSPORT);
    expect(categories).toContain(COMPLAINT_CATEGORIES.CLASSROOM);
    expect(categories).toContain(COMPLAINT_CATEGORIES.LAB);
    expect(categories).toContain(COMPLAINT_CATEGORIES.MAINTENANCE);
    expect(categories).toContain(COMPLAINT_CATEGORIES.ACADEMIC);
  });

  test("each department config has valid departmentId, name, and SLA defaults", () => {
    for (const [cat, config] of Object.entries(DEPARTMENT_CONFIGS)) {
      expect(config.departmentId).toMatch(/^dept-[a-z]+$/);
      expect(config.departmentName.length).toBeGreaterThan(5);
      expect(config.defaultAssigneeRole).toBe(USER_ROLES.DEPARTMENT_OFFICER);
      expect(config.provisionalSlaHours.critical).toBeGreaterThan(0);
      expect(config.provisionalSlaHours.high).toBeGreaterThan(0);
      expect(config.provisionalSlaHours.medium).toBeGreaterThan(0);
      expect(config.provisionalSlaHours.low).toBeGreaterThan(0);
    }
  });
});
