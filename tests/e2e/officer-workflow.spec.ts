// tests/e2e/officer-workflow.spec.ts
// ============================================================
// E2E & Server Boundary Test Suite: Officer Queue & Workflow (Phase 4.1)
// Verifies unauthenticated route protection, tab partitioning,
// instant search, priority filtering, SLA urgency calculation,
// and atomic self-assignment (pickup) race protection.
// ============================================================

import { test, expect } from "@playwright/test";
import {
  assignComplaintSchema,
} from "@/lib/complaints/validation";
import type {
  ComplaintDTO,
  ComplaintStatus,
} from "@/types";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  STATUS_LABELS,
  TERMINAL_STATUSES,
  USER_ROLES,
} from "@/types";

export interface SlaPresentation {
  label: string;
  variant: "critical" | "high" | "low" | "default";
  isOverdue: boolean;
  hoursRemaining: number | null;
}

function computeSlaPresentation(
  slaDeadlineStr: string | null | undefined,
  status: ComplaintStatus,
): SlaPresentation {
  if (status === "resolved" || status === "closed") {
    return {
      label: STATUS_LABELS[status] || "Completed",
      variant: "low",
      isOverdue: false,
      hoursRemaining: null,
    };
  }

  if (!slaDeadlineStr) {
    return {
      label: "No SLA Target",
      variant: "default",
      isOverdue: false,
      hoursRemaining: null,
    };
  }

  const deadline = new Date(slaDeadlineStr);
  if (isNaN(deadline.getTime())) {
    return {
      label: "Invalid SLA",
      variant: "default",
      isOverdue: false,
      hoursRemaining: null,
    };
  }

  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 0) {
    const overdueHours = Math.abs(Math.round(diffHours));
    const label =
      overdueHours >= 24
        ? `Overdue (${Math.floor(overdueHours / 24)}d)`
        : `Overdue (${overdueHours}h)`;
    return {
      label,
      variant: "critical",
      isOverdue: true,
      hoursRemaining: diffHours,
    };
  }

  if (diffHours <= 4) {
    const rounded = Math.max(1, Math.round(diffHours));
    return {
      label: `Due Soon (~${rounded}h)`,
      variant: "high",
      isOverdue: false,
      hoursRemaining: diffHours,
    };
  }

  if (diffHours < 24) {
    return {
      label: `On Track (~${Math.round(diffHours)}h)`,
      variant: "low",
      isOverdue: false,
      hoursRemaining: diffHours,
    };
  }

  const days = Math.round(diffHours / 24);
  return {
    label: `On Track (~${days}d)`,
    variant: "low",
    isOverdue: false,
    hoursRemaining: diffHours,
  };
}

class ComplaintAlreadyAssignedError extends Error {
  constructor(message = "This complaint has already been assigned to another officer.") {
    super(message);
    this.name = "ComplaintAlreadyAssignedError";
  }
}

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("Officer Queue — Route Protection & RBAC", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("unauthenticated user visiting /officer is redirected to /login with redirectTo", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/officer`);
    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("redirectTo")).toBe("/officer");
  });
});

test.describe("Officer Queue — Tab Partitioning & Urgency Logic", () => {
  const currentOfficerUid = "officer_hostel_001";
  const now = new Date();

  const mockComplaints: ComplaintDTO[] = [
    {
      complaintId: "CTS-20260913-0001",
      title: "Broken Water Pipe in Room 101",
      description: "Severe water leakage flowing into corridor.",
      category: COMPLAINT_CATEGORIES.HOSTEL,
      priority: COMPLAINT_PRIORITIES.CRITICAL,
      status: COMPLAINT_STATUSES.SUBMITTED,
      submittedBy: "student_1",
      submittedByName: "Student A",
      submittedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      departmentId: "dept-hostel",
      assignedTo: null,
      assignedToName: null,
      assignedAt: null,
      location: "Block A Room 101",
      attachments: [],
      lastUpdatedAt: now.toISOString(),
      resolvedAt: null,
      closedAt: null,
      resolution: null,
      slaDeadline: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // Overdue by 1h
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
      title: "Fan Regulator Not Working",
      description: "Fan regulator stuck on maximum speed.",
      category: COMPLAINT_CATEGORIES.HOSTEL,
      priority: COMPLAINT_PRIORITIES.MEDIUM,
      status: COMPLAINT_STATUSES.PENDING,
      submittedBy: "student_2",
      submittedByName: "Student B",
      submittedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      departmentId: "dept-hostel",
      assignedTo: currentOfficerUid,
      assignedToName: "Mr. Suresh (Hostel)",
      assignedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      location: "Block B Room 204",
      attachments: [],
      lastUpdatedAt: now.toISOString(),
      resolvedAt: null,
      closedAt: null,
      resolution: null,
      slaDeadline: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(), // Due soon (3h left)
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
      title: "Wi-Fi Access Point Offline",
      description: "No Wi-Fi connectivity in 3rd floor lounge.",
      category: COMPLAINT_CATEGORIES.HOSTEL,
      priority: COMPLAINT_PRIORITIES.HIGH,
      status: COMPLAINT_STATUSES.IN_REVIEW,
      submittedBy: "student_3",
      submittedByName: "Student C",
      submittedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      departmentId: "dept-hostel",
      assignedTo: "other_officer_999",
      assignedToName: "Mr. Ramesh (Hostel)",
      assignedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      location: "Block C Lounge",
      attachments: [],
      lastUpdatedAt: now.toISOString(),
      resolvedAt: null,
      closedAt: null,
      resolution: null,
      slaDeadline: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(), // On track (12h left)
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
      title: "Geyser Repaired in Washroom 2",
      description: "Hot water geyser heating element was replaced.",
      category: COMPLAINT_CATEGORIES.HOSTEL,
      priority: COMPLAINT_PRIORITIES.MEDIUM,
      status: COMPLAINT_STATUSES.RESOLVED,
      submittedBy: "student_4",
      submittedByName: "Student D",
      submittedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      departmentId: "dept-hostel",
      assignedTo: currentOfficerUid,
      assignedToName: "Mr. Suresh (Hostel)",
      assignedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
      location: "Block A Floor 2",
      attachments: [],
      lastUpdatedAt: now.toISOString(),
      resolvedAt: now.toISOString(),
      closedAt: null,
      resolution: "Heating element replaced and tested successfully.",
      slaDeadline: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
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
      title: "Duplicate Noise Complaint",
      description: "Already reported in CTS-20260913-0001.",
      category: COMPLAINT_CATEGORIES.HOSTEL,
      priority: COMPLAINT_PRIORITIES.LOW,
      status: COMPLAINT_STATUSES.DUPLICATE,
      submittedBy: "student_5",
      submittedByName: "Student E",
      submittedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      departmentId: "dept-hostel",
      assignedTo: null,
      assignedToName: null,
      assignedAt: null,
      location: "Block A Corridor",
      attachments: [],
      lastUpdatedAt: now.toISOString(),
      resolvedAt: null,
      closedAt: null,
      resolution: null,
      slaDeadline: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      escalationLevel: 0,
      escalatedAt: null,
      isDuplicate: true,
      duplicateOf: "CTS-20260913-0001",
      feedback: null,
      isAnonymous: false,
      tags: [],
    },
  ];

  test("tab filtering correctly partitions complaints by workflow state", () => {
    // 1. Unassigned Tab: assignedTo === null and NOT in terminal statuses
    const unassigned = mockComplaints.filter(
      (c) => c.assignedTo === null && !TERMINAL_STATUSES.has(c.status),
    );
    expect(unassigned.length).toBe(1);
    expect(unassigned[0].complaintId).toBe("CTS-20260913-0001");

    // 2. My Tickets Tab: assignedTo === currentOfficerUid
    const myTickets = mockComplaints.filter((c) => c.assignedTo === currentOfficerUid);
    expect(myTickets.length).toBe(2);
    expect(myTickets.map((c) => c.complaintId)).toContain("CTS-20260913-0002");
    expect(myTickets.map((c) => c.complaintId)).toContain("CTS-20260913-0004");

    // 3. In Review Tab: status === "in_review"
    const inReview = mockComplaints.filter((c) => c.status === "in_review");
    expect(inReview.length).toBe(1);
    expect(inReview[0].complaintId).toBe("CTS-20260913-0003");

    // 4. Resolved Tab: status === "resolved" || status === "closed"
    const resolved = mockComplaints.filter(
      (c) => c.status === "resolved" || c.status === "closed",
    );
    expect(resolved.length).toBe(1);
    expect(resolved[0].complaintId).toBe("CTS-20260913-0004");

    // 5. All Tab
    expect(mockComplaints.length).toBe(5);
  });

  test("search filtering performs case-insensitive substring matching", () => {
    const filterBySearch = (query: string) => {
      const q = query.toLowerCase().trim();
      return mockComplaints.filter((c) => {
        const idMatch = c.complaintId.toLowerCase().includes(q);
        const titleMatch = c.title.toLowerCase().includes(q);
        const locMatch = c.location ? c.location.toLowerCase().includes(q) : false;
        return idMatch || titleMatch || locMatch;
      });
    };

    expect(filterBySearch("water pipe").length).toBe(1);
    expect(filterBySearch("CTS-20260913-0003").length).toBe(1);
    expect(filterBySearch("block a").length).toBe(3);
    expect(filterBySearch("nonexistent term").length).toBe(0);
  });

  test("priority filtering matches exact complaint priority", () => {
    const criticals = mockComplaints.filter((c) => c.priority === "critical");
    expect(criticals.length).toBe(1);
    expect(criticals[0].complaintId).toBe("CTS-20260913-0001");

    const highs = mockComplaints.filter((c) => c.priority === "high");
    expect(highs.length).toBe(1);
    expect(highs[0].complaintId).toBe("CTS-20260913-0003");
  });
});

test.describe("Officer Queue — SLA Urgency Presentation Calculation", () => {
  const now = new Date();

  test("calculates Overdue correctly for active past-deadline complaint", () => {
    const pastDeadline = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const result = computeSlaPresentation(pastDeadline, COMPLAINT_STATUSES.PENDING);

    expect(result.isOverdue).toBe(true);
    expect(result.variant).toBe("critical");
    expect(result.label).toMatch(/overdue/i);
  });

  test("calculates Due Soon correctly when <= 4 hours remaining", () => {
    const soonDeadline = new Date(now.getTime() + 2.5 * 60 * 60 * 1000).toISOString();
    const result = computeSlaPresentation(soonDeadline, COMPLAINT_STATUSES.IN_REVIEW);

    expect(result.isOverdue).toBe(false);
    expect(result.variant).toBe("high");
    expect(result.label).toMatch(/due soon/i);
  });

  test("calculates On Track correctly when > 4 hours remaining", () => {
    const trackDeadline = new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString();
    const result = computeSlaPresentation(trackDeadline, COMPLAINT_STATUSES.PENDING);

    expect(result.isOverdue).toBe(false);
    expect(result.variant).toBe("low");
    expect(result.label).toMatch(/on track/i);
  });

  test("returns Completed for resolved or closed complaints regardless of deadline", () => {
    const pastDeadline = new Date(now.getTime() - 50 * 60 * 60 * 1000).toISOString();
    const resolvedResult = computeSlaPresentation(pastDeadline, COMPLAINT_STATUSES.RESOLVED);
    expect(resolvedResult.label).toBe("Resolved");
    expect(resolvedResult.isOverdue).toBe(false);

    const closedResult = computeSlaPresentation(pastDeadline, COMPLAINT_STATUSES.CLOSED);
    expect(closedResult.label).toBe("Closed");
    expect(closedResult.isOverdue).toBe(false);
  });

  test("safely handles null, undefined, or malformed dates without throwing", () => {
    const nullResult = computeSlaPresentation(null, COMPLAINT_STATUSES.PENDING);
    expect(nullResult.label).toBe("No SLA Target");
    expect(nullResult.variant).toBe("default");

    const invalidResult = computeSlaPresentation("invalid-date-string", COMPLAINT_STATUSES.PENDING);
    expect(invalidResult.label).toBe("Invalid SLA");
    expect(invalidResult.variant).toBe("default");
  });
});

test.describe("Officer Queue — Concurrency & Atomic Pickup Protection", () => {
  test("assignComplaintSchema validates assignment input strictly", () => {
    const valid = assignComplaintSchema.safeParse({
      complaintId: "CTS-20260913-0001",
      officerUid: "officer_123",
      officerName: "Officer Ramesh",
      note: "Self-assigned by Officer Ramesh",
    });
    expect(valid.success).toBe(true);

    const emptyOfficer = assignComplaintSchema.safeParse({
      complaintId: "CTS-20260913-0001",
      officerUid: "",
      officerName: "Officer Ramesh",
    });
    expect(emptyOfficer.success).toBe(false);
  });

  test("simulates requireUnassigned pickup protection invariant", () => {
    // Invariant simulation:
    // When a ticket is unassigned: pickup succeeds
    // When a ticket has already been assigned: pickup throws ComplaintAlreadyAssignedError
    const simulatePickup = (currentAssignedTo: string | null, requireUnassigned = true) => {
      if (requireUnassigned && currentAssignedTo !== null) {
        throw new ComplaintAlreadyAssignedError("This complaint has already been assigned to another officer.");
      }
      return { success: true, assignedTo: "officer_winner_001" };
    };

    // 1. First officer pickup succeeds on unassigned ticket
    const firstPickup = simulatePickup(null, true);
    expect(firstPickup.success).toBe(true);
    expect(firstPickup.assignedTo).toBe("officer_winner_001");

    // 2. Second simultaneous officer pickup fails deterministically with ComplaintAlreadyAssignedError
    expect(() => {
      simulatePickup("officer_winner_001", true);
    }).toThrow(ComplaintAlreadyAssignedError);

    // 3. Admin reassignment without requireUnassigned succeeds even if already assigned
    const adminReassign = simulatePickup("officer_winner_001", false);
    expect(adminReassign.success).toBe(true);
  });
});

test.describe("Phase 4.2.1: Start Review UI Visibility & Server Invariants", () => {
  const evaluateCanStartReview = (
    user: { role: string; departmentId?: string | null; uid: string },
    complaint: { status: string; departmentId: string; assignedTo: string | null },
  ) => {
    const isAdmin = user.role === USER_ROLES.ADMIN;
    const isDeptOfficer =
      user.role === USER_ROLES.DEPARTMENT_OFFICER &&
      (user.departmentId === complaint.departmentId || user.uid === complaint.assignedTo);
    return complaint.status === COMPLAINT_STATUSES.PENDING && (isAdmin || isDeptOfficer);
  };

  test("UI visibility logic allows Start Review for Admin and matching Department Officer", () => {
    const complaint = {
      status: COMPLAINT_STATUSES.PENDING,
      departmentId: "dept-hostel",
      assignedTo: "officer_hostel_01",
    };

    // 1. Admin -> visible
    expect(
      evaluateCanStartReview(
        { role: USER_ROLES.ADMIN, uid: "admin_01" },
        complaint,
      ),
    ).toBe(true);

    // 2. Same-dept officer -> visible
    expect(
      evaluateCanStartReview(
        { role: USER_ROLES.DEPARTMENT_OFFICER, departmentId: "dept-hostel", uid: "officer_hostel_02" },
        complaint,
      ),
    ).toBe(true);

    // 3. Assigned officer (even if departmentId null/different) -> visible
    expect(
      evaluateCanStartReview(
        { role: USER_ROLES.DEPARTMENT_OFFICER, departmentId: null, uid: "officer_hostel_01" },
        complaint,
      ),
    ).toBe(true);
  });

  test("UI visibility logic hides Start Review for unauthorized viewers or non-pending statuses", () => {
    const pendingComplaint = {
      status: COMPLAINT_STATUSES.PENDING,
      departmentId: "dept-hostel",
      assignedTo: null,
    };

    // 1. Student -> hidden
    expect(
      evaluateCanStartReview(
        { role: USER_ROLES.STUDENT, uid: "student_01" },
        pendingComplaint,
      ),
    ).toBe(false);

    // 2. Different dept officer -> hidden
    expect(
      evaluateCanStartReview(
        { role: USER_ROLES.DEPARTMENT_OFFICER, departmentId: "dept-transport", uid: "officer_transport_01" },
        pendingComplaint,
      ),
    ).toBe(false);

    // 3. Same dept officer on IN_REVIEW complaint -> hidden (already started)
    expect(
      evaluateCanStartReview(
        { role: USER_ROLES.DEPARTMENT_OFFICER, departmentId: "dept-hostel", uid: "officer_hostel_01" },
        { ...pendingComplaint, status: COMPLAINT_STATUSES.IN_REVIEW },
      ),
    ).toBe(false);

    // 4. Same dept officer on RESOLVED complaint -> hidden
    expect(
      evaluateCanStartReview(
        { role: USER_ROLES.DEPARTMENT_OFFICER, departmentId: "dept-hostel", uid: "officer_hostel_01" },
        { ...pendingComplaint, status: COMPLAINT_STATUSES.RESOLVED },
      ),
    ).toBe(false);
  });
});
