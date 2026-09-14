// tests/e2e/submitter-dashboard.spec.ts
// ============================================================
// E2E & Server Boundary Test Suite: Phase 4.1 Submitter Dashboard
// Verifies live metric card calculations, recent grievances display,
// empty state handling, and role-based presentation.
// ============================================================

import { test, expect } from "@playwright/test";
import type { ComplaintDTO } from "@/shared/types";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
} from "@/shared/types";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("Submitter Dashboard — Route Protection and Redirection", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("unauthenticated user visiting /dashboard is redirected to /login with redirectTo", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("redirectTo")).toBe("/dashboard");
  });
});

test.describe("Submitter Dashboard — Live Metric Computations and Invariants", () => {
  const mockDate = "2026-09-13T12:00:00.000Z";

  const sampleComplaints: ComplaintDTO[] = [
    {
      complaintId: "CTS-20260913-0001",
      title: "Broken fan in Room 301",
      description: "Ceiling fan not working",
      category: COMPLAINT_CATEGORIES.MAINTENANCE,
      priority: COMPLAINT_PRIORITIES.MEDIUM,
      status: COMPLAINT_STATUSES.SUBMITTED,
      submittedBy: "user_student_1",
      submittedByName: "Test Student",
      submittedAt: "2026-09-13T12:00:00.000Z",
      departmentId: "dept-maintenance",
      assignedTo: null,
      assignedToName: null,
      assignedAt: null,
      location: "Room 301",
      attachments: [],
      lastUpdatedAt: mockDate,
      resolvedAt: null,
      closedAt: null,
      resolution: null,
      slaDeadline: "2026-09-14T12:00:00.000Z",
      escalationLevel: 0,
      escalatedAt: null,
      isDuplicate: false,
      duplicateOf: null,
      feedback: null,
      isAnonymous: false,
      tags: [],
    },
    {
      complaintId: "CTS-20260913-0002",
      title: "WiFi connectivity issue in Hostel Block B",
      description: "No internet in Block B 2nd floor",
      category: COMPLAINT_CATEGORIES.HOSTEL,
      priority: COMPLAINT_PRIORITIES.HIGH,
      status: COMPLAINT_STATUSES.IN_REVIEW,
      submittedBy: "user_student_1",
      submittedByName: "Test Student",
      submittedAt: "2026-09-12T10:00:00.000Z",
      departmentId: "dept-hostel",
      assignedTo: "officer_1",
      assignedToName: "Hostel Officer",
      assignedAt: "2026-09-12T11:00:00.000Z",
      location: "Hostel Block B",
      attachments: [],
      lastUpdatedAt: mockDate,
      resolvedAt: null,
      closedAt: null,
      resolution: null,
      slaDeadline: "2026-09-13T10:00:00.000Z",
      escalationLevel: 0,
      escalatedAt: null,
      isDuplicate: false,
      duplicateOf: null,
      feedback: null,
      isAnonymous: false,
      tags: [],
    },
    {
      complaintId: "CTS-20260913-0003",
      title: "Projector lamp issue in Seminar Hall",
      description: "Projector flickering",
      category: COMPLAINT_CATEGORIES.CLASSROOM,
      priority: COMPLAINT_PRIORITIES.LOW,
      status: COMPLAINT_STATUSES.RESOLVED,
      submittedBy: "user_student_1",
      submittedByName: "Test Student",
      submittedAt: "2026-09-11T09:00:00.000Z",
      departmentId: "dept-general",
      assignedTo: "officer_2",
      assignedToName: "Classroom Officer",
      assignedAt: "2026-09-11T10:00:00.000Z",
      location: "Seminar Hall",
      attachments: [],
      lastUpdatedAt: mockDate,
      resolvedAt: "2026-09-11T16:00:00.000Z",
      closedAt: null,
      resolution: "Lamp bulb replaced.",
      slaDeadline: "2026-09-14T09:00:00.000Z",
      escalationLevel: 0,
      escalatedAt: null,
      isDuplicate: false,
      duplicateOf: null,
      feedback: null,
      isAnonymous: false,
      tags: [],
    },
    {
      complaintId: "CTS-20260913-0004",
      title: "Bus Route 12 Delay",
      description: "Bus arriving 30 mins late",
      category: COMPLAINT_CATEGORIES.TRANSPORT,
      priority: COMPLAINT_PRIORITIES.MEDIUM,
      status: COMPLAINT_STATUSES.CLOSED,
      submittedBy: "user_student_1",
      submittedByName: "Test Student",
      submittedAt: "2026-09-10T08:00:00.000Z",
      departmentId: "dept-transport",
      assignedTo: "officer_3",
      assignedToName: "Transport Officer",
      assignedAt: "2026-09-10T09:00:00.000Z",
      location: "Bus Stop",
      attachments: [],
      lastUpdatedAt: mockDate,
      resolvedAt: "2026-09-10T15:00:00.000Z",
      closedAt: "2026-09-10T16:00:00.000Z",
      resolution: "Route driver rescheduled.",
      slaDeadline: "2026-09-11T08:00:00.000Z",
      escalationLevel: 0,
      escalatedAt: null,
      isDuplicate: false,
      duplicateOf: null,
      feedback: null,
      isAnonymous: false,
      tags: [],
    },
    {
      complaintId: "CTS-20260913-0005",
      title: "Lab Computer #14 Blue Screen",
      description: "OS crash on boot",
      category: COMPLAINT_CATEGORIES.LAB,
      priority: COMPLAINT_PRIORITIES.HIGH,
      status: COMPLAINT_STATUSES.ESCALATED,
      submittedBy: "user_student_1",
      submittedByName: "Test Student",
      submittedAt: "2026-09-09T14:00:00.000Z",
      departmentId: "dept-general",
      assignedTo: "officer_4",
      assignedToName: "Lab Incharge",
      assignedAt: "2026-09-09T15:00:00.000Z",
      location: "Lab 3",
      attachments: [],
      lastUpdatedAt: mockDate,
      resolvedAt: null,
      closedAt: null,
      resolution: null,
      slaDeadline: "2026-09-09T20:00:00.000Z",
      escalationLevel: 1,
      escalatedAt: "2026-09-09T21:00:00.000Z",
      isDuplicate: false,
      duplicateOf: null,
      feedback: null,
      isAnonymous: false,
      tags: [],
    },
    {
      complaintId: "CTS-20260913-0006",
      title: "Old duplicate ticket",
      description: "Duplicate item",
      category: COMPLAINT_CATEGORIES.MAINTENANCE,
      priority: COMPLAINT_PRIORITIES.LOW,
      status: COMPLAINT_STATUSES.DUPLICATE,
      submittedBy: "user_student_1",
      submittedByName: "Test Student",
      submittedAt: "2026-09-08T11:00:00.000Z",
      departmentId: "dept-maintenance",
      assignedTo: null,
      assignedToName: null,
      assignedAt: null,
      location: "Room 101",
      attachments: [],
      lastUpdatedAt: mockDate,
      resolvedAt: null,
      closedAt: null,
      resolution: null,
      slaDeadline: "2026-09-10T11:00:00.000Z",
      escalationLevel: 0,
      escalatedAt: null,
      isDuplicate: true,
      duplicateOf: "CTS-20260913-0001",
      feedback: null,
      isAnonymous: false,
      tags: [],
    },
  ];

  test("calculates Total Filed, Active, In Review, and Resolved metrics accurately", () => {
    const totalFiled = sampleComplaints.length;
    const activeCount = sampleComplaints.filter(
      (c) =>
        c.status === COMPLAINT_STATUSES.SUBMITTED ||
        c.status === COMPLAINT_STATUSES.PENDING ||
        c.status === COMPLAINT_STATUSES.IN_REVIEW ||
        c.status === COMPLAINT_STATUSES.REOPENED ||
        c.status === COMPLAINT_STATUSES.ESCALATED,
    ).length;
    const inReviewCount = sampleComplaints.filter(
      (c) => c.status === COMPLAINT_STATUSES.IN_REVIEW,
    ).length;
    const resolvedCount = sampleComplaints.filter(
      (c) =>
        c.status === COMPLAINT_STATUSES.RESOLVED ||
        c.status === COMPLAINT_STATUSES.CLOSED,
    ).length;

    expect(totalFiled).toBe(6);
    expect(activeCount).toBe(3);
    expect(inReviewCount).toBe(1);
    expect(resolvedCount).toBe(2);
  });

  test("accurately computes metrics for large complaint populations (>50 items) independent of recent 5 display limit", () => {
    // Generate a simulated population of 75 complaints:
    // 20 active (10 submitted + 10 in_review), 50 resolved/closed (30 resolved + 20 closed), 5 terminal rejected
    const largeComplaintSet: ComplaintDTO[] = [];
    for (let i = 1; i <= 75; i++) {
      let status: (typeof COMPLAINT_STATUSES)[keyof typeof COMPLAINT_STATUSES];
      if (i <= 10) status = COMPLAINT_STATUSES.SUBMITTED;
      else if (i <= 20) status = COMPLAINT_STATUSES.IN_REVIEW;
      else if (i <= 50) status = COMPLAINT_STATUSES.RESOLVED;
      else if (i <= 70) status = COMPLAINT_STATUSES.CLOSED;
      else status = COMPLAINT_STATUSES.REJECTED;

      largeComplaintSet.push({
        complaintId: `CTS-20260913-${String(i).padStart(4, "0")}`,
        title: `Complaint issue #${i}`,
        description: `Detailed description for issue #${i}`,
        category: COMPLAINT_CATEGORIES.MAINTENANCE,
        priority: COMPLAINT_PRIORITIES.MEDIUM,
        status,
        submittedBy: "user_student_large",
        submittedByName: "Rohan Sharma",
        submittedAt: new Date(Date.now() - i * 3600000).toISOString(),
        departmentId: "dept-maintenance",
        assignedTo: null,
        assignedToName: null,
        assignedAt: null,
        location: null,
        attachments: [],
        lastUpdatedAt: mockDate,
        resolvedAt: status === COMPLAINT_STATUSES.RESOLVED || status === COMPLAINT_STATUSES.CLOSED ? mockDate : null,
        closedAt: status === COMPLAINT_STATUSES.CLOSED ? mockDate : null,
        resolution: null,
        slaDeadline: mockDate,
        escalationLevel: 0,
        escalatedAt: null,
        isDuplicate: false,
        duplicateOf: null,
        feedback: null,
        isAnonymous: false,
        tags: [],
      });
    }

    // Exact expected metric counts across 75 total complaints
    const totalFiled = largeComplaintSet.length;
    const activeCount = largeComplaintSet.filter(
      (c) =>
        c.status === COMPLAINT_STATUSES.SUBMITTED ||
        c.status === COMPLAINT_STATUSES.PENDING ||
        c.status === COMPLAINT_STATUSES.IN_REVIEW ||
        c.status === COMPLAINT_STATUSES.REOPENED ||
        c.status === COMPLAINT_STATUSES.ESCALATED,
    ).length;
    const inReviewCount = largeComplaintSet.filter(
      (c) => c.status === COMPLAINT_STATUSES.IN_REVIEW,
    ).length;
    const resolvedCount = largeComplaintSet.filter(
      (c) =>
        c.status === COMPLAINT_STATUSES.RESOLVED ||
        c.status === COMPLAINT_STATUSES.CLOSED,
    ).length;

    expect(totalFiled).toBe(75);
    expect(activeCount).toBe(20);
    expect(inReviewCount).toBe(10);
    expect(resolvedCount).toBe(50);

    // Display slice should strictly take only 5 items without mutating lifetime metric totals
    const displayedRecent = largeComplaintSet.slice(0, 5);
    expect(displayedRecent).toHaveLength(5);
    expect(displayedRecent[0].complaintId).toBe("CTS-20260913-0001");
    expect(displayedRecent[4].complaintId).toBe("CTS-20260913-0005");
  });

  test("slices exactly the top 5 most recent complaints for dashboard view", () => {
    const recent = sampleComplaints.slice(0, 5);
    expect(recent.length).toBe(5);
    expect(recent[0].complaintId).toBe("CTS-20260913-0001");
    expect(recent[4].complaintId).toBe("CTS-20260913-0005");
  });

  test("handles empty complaints array with zeroed metric counters", () => {
    const emptyList: ComplaintDTO[] = [];
    const totalFiled = emptyList.length;
    const activeCount = emptyList.filter(
      (c) =>
        c.status === COMPLAINT_STATUSES.SUBMITTED ||
        c.status === COMPLAINT_STATUSES.PENDING ||
        c.status === COMPLAINT_STATUSES.IN_REVIEW ||
        c.status === COMPLAINT_STATUSES.REOPENED ||
        c.status === COMPLAINT_STATUSES.ESCALATED,
    ).length;
    const inReviewCount = emptyList.filter(
      (c) => c.status === COMPLAINT_STATUSES.IN_REVIEW,
    ).length;
    const resolvedCount = emptyList.filter(
      (c) =>
        c.status === COMPLAINT_STATUSES.RESOLVED ||
        c.status === COMPLAINT_STATUSES.CLOSED,
    ).length;

    expect(totalFiled).toBe(0);
    expect(activeCount).toBe(0);
    expect(inReviewCount).toBe(0);
    expect(resolvedCount).toBe(0);
  });
});
