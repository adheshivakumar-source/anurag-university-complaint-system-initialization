// src/lib/complaints/routing.ts
// ============================================================
// Department Routing Engine & SLA Resolution for AU-CTS.
//
// DESIGN PRINCIPLES:
// 1. Pure, deterministic, independent of React/UI.
// 2. Centralizes all category-to-department associations.
// 3. Implements provisional SLA calculation deadlines.
//    (Note: Mark these as provisional defaults — not claimed
//     official university policy until formal administrative sign-off).
// 4. Initial complaint routing assigns department only (assignedTo: null).
// ============================================================

import type {
  ComplaintCategory,
  ComplaintPriority,
  UserRole,
} from "@/types";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  USER_ROLES,
} from "@/types";

export interface DepartmentInfo {
  departmentId: string;
  departmentName: string;
  defaultAssigneeRole: UserRole;
  provisionalSlaHours: Record<ComplaintPriority, number>;
}

/**
 * Provisional SLA resolution thresholds in hours.
 * Internal application defaults — subject to university administrative review.
 */
export const PROVISIONAL_DEFAULT_SLA: Record<
  ComplaintCategory,
  Record<ComplaintPriority, number>
> = {
  [COMPLAINT_CATEGORIES.HOSTEL]: {
    [COMPLAINT_PRIORITIES.CRITICAL]: 2,
    [COMPLAINT_PRIORITIES.HIGH]: 6,
    [COMPLAINT_PRIORITIES.MEDIUM]: 24,
    [COMPLAINT_PRIORITIES.LOW]: 48,
  },
  [COMPLAINT_CATEGORIES.TRANSPORT]: {
    [COMPLAINT_PRIORITIES.CRITICAL]: 4,
    [COMPLAINT_PRIORITIES.HIGH]: 8,
    [COMPLAINT_PRIORITIES.MEDIUM]: 24,
    [COMPLAINT_PRIORITIES.LOW]: 48,
  },
  [COMPLAINT_CATEGORIES.CLASSROOM]: {
    [COMPLAINT_PRIORITIES.CRITICAL]: 4,
    [COMPLAINT_PRIORITIES.HIGH]: 12,
    [COMPLAINT_PRIORITIES.MEDIUM]: 48,
    [COMPLAINT_PRIORITIES.LOW]: 72,
  },
  [COMPLAINT_CATEGORIES.LAB]: {
    [COMPLAINT_PRIORITIES.CRITICAL]: 2,
    [COMPLAINT_PRIORITIES.HIGH]: 6,
    [COMPLAINT_PRIORITIES.MEDIUM]: 24,
    [COMPLAINT_PRIORITIES.LOW]: 48,
  },
  [COMPLAINT_CATEGORIES.MAINTENANCE]: {
    [COMPLAINT_PRIORITIES.CRITICAL]: 2,
    [COMPLAINT_PRIORITIES.HIGH]: 12,
    [COMPLAINT_PRIORITIES.MEDIUM]: 48,
    [COMPLAINT_PRIORITIES.LOW]: 96,
  },
  [COMPLAINT_CATEGORIES.ACADEMIC]: {
    [COMPLAINT_PRIORITIES.CRITICAL]: 6,
    [COMPLAINT_PRIORITIES.HIGH]: 24,
    [COMPLAINT_PRIORITIES.MEDIUM]: 72,
    [COMPLAINT_PRIORITIES.LOW]: 120,
  },
} as const;

/**
 * Default Category-to-Department configuration registry.
 */
export const DEPARTMENT_CONFIGS: Record<ComplaintCategory, DepartmentInfo> = {
  [COMPLAINT_CATEGORIES.HOSTEL]: {
    departmentId: "dept-hostel",
    departmentName: "Hostel Administration & Facilities",
    defaultAssigneeRole: USER_ROLES.DEPARTMENT_OFFICER,
    provisionalSlaHours: PROVISIONAL_DEFAULT_SLA[COMPLAINT_CATEGORIES.HOSTEL],
  },
  [COMPLAINT_CATEGORIES.TRANSPORT]: {
    departmentId: "dept-transport",
    departmentName: "Transport & Logistics",
    defaultAssigneeRole: USER_ROLES.DEPARTMENT_OFFICER,
    provisionalSlaHours: PROVISIONAL_DEFAULT_SLA[COMPLAINT_CATEGORIES.TRANSPORT],
  },
  [COMPLAINT_CATEGORIES.CLASSROOM]: {
    departmentId: "dept-classroom",
    departmentName: "Campus Infrastructure & Classrooms",
    defaultAssigneeRole: USER_ROLES.DEPARTMENT_OFFICER,
    provisionalSlaHours: PROVISIONAL_DEFAULT_SLA[COMPLAINT_CATEGORIES.CLASSROOM],
  },
  [COMPLAINT_CATEGORIES.LAB]: {
    departmentId: "dept-lab",
    departmentName: "Laboratory & Technical Equipment",
    defaultAssigneeRole: USER_ROLES.DEPARTMENT_OFFICER,
    provisionalSlaHours: PROVISIONAL_DEFAULT_SLA[COMPLAINT_CATEGORIES.LAB],
  },
  [COMPLAINT_CATEGORIES.MAINTENANCE]: {
    departmentId: "dept-maintenance",
    departmentName: "Estate & General Maintenance",
    defaultAssigneeRole: USER_ROLES.DEPARTMENT_OFFICER,
    provisionalSlaHours: PROVISIONAL_DEFAULT_SLA[COMPLAINT_CATEGORIES.MAINTENANCE],
  },
  [COMPLAINT_CATEGORIES.ACADEMIC]: {
    departmentId: "dept-academic",
    departmentName: "Academic Affairs & Examination Branch",
    defaultAssigneeRole: USER_ROLES.DEPARTMENT_OFFICER,
    provisionalSlaHours: PROVISIONAL_DEFAULT_SLA[COMPLAINT_CATEGORIES.ACADEMIC],
  },
};

export interface ResolvedRouting {
  departmentId: string;
  departmentName: string;
  defaultAssigneeRole: UserRole;
  slaHours: number;
  slaDeadline: Date;
}

/**
 * Deterministically resolves the target department and computed SLA deadline
 * for a given category and priority.
 */
export function resolveDepartmentRouting(
  category: ComplaintCategory,
  priority: ComplaintPriority,
  baseDate: Date = new Date(),
): ResolvedRouting {
  const config = DEPARTMENT_CONFIGS[category];

  if (!config) {
    throw new Error(`Unsupported complaint category: ${category}`);
  }

  const slaHours = config.provisionalSlaHours[priority] ?? 48;
  const slaDeadline = new Date(baseDate.getTime() + slaHours * 60 * 60 * 1000);

  return {
    departmentId: config.departmentId,
    departmentName: config.departmentName,
    defaultAssigneeRole: config.defaultAssigneeRole,
    slaHours,
    slaDeadline,
  };
}

/**
 * Retrieves human-readable department information by departmentId.
 */
export function getDepartmentInfo(
  departmentId: string,
): DepartmentInfo | null {
  const match = Object.values(DEPARTMENT_CONFIGS).find(
    (dept) => dept.departmentId === departmentId,
  );
  return match ?? null;
}
