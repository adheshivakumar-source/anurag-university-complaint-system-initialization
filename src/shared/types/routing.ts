// src/types/routing.ts
// ============================================================
// Routing rule types for AU-CTS complaint auto-assignment.
// Routing configuration lives in Firestore /routingRules/{category}
// so admins can update assignments without code changes.
// ============================================================

import type { ComplaintCategory } from "./complaint";
import type { UserRole } from "./auth";

/**
 * A routing rule document from Firestore /routingRules/{category}.
 * Defines where a complaint is routed based on its category.
 */
export interface RoutingRule {
  category: ComplaintCategory;
  defaultAssigneeRole: UserRole;
  departmentId: string;
  notifyRoles: UserRole[];
  updatedBy: string; // Admin UID who last updated
  updatedAt: Date;
}

/**
 * A department document from Firestore /departments/{departmentId}.
 */
export interface Department {
  departmentId: string;
  name: string;
  headUserId: string;
  officerUserIds: string[];
  slaHours: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}
