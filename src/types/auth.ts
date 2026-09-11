// src/types/auth.ts
// ============================================================
// Core authentication and user domain types for AU-CTS.
// These are the source of truth for user roles and identity.
// Do NOT add arbitrary string types — extend these enums only.
// ============================================================

/**
 * All valid user roles in the AU-CTS system.
 * Roles are set server-side via Firebase Custom Claims only.
 * The client must NEVER be trusted to provide its own role.
 */
export const USER_ROLES = {
  STUDENT: "student",
  FACULTY: "faculty",
  STAFF: "staff",
  DEPARTMENT_OFFICER: "department_officer",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * The user profile document as stored in Firestore /users/{uid}.
 * This supplements Firebase Auth with application-level user data.
 */
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  departmentId?: string; // Required for department_officer
  studentId?: string; // For students
  employeeId?: string; // For staff / faculty
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The decoded session payload returned from Admin SDK token verification.
 * Contains Firebase standard claims plus our custom role claim.
 */
export interface SessionClaims {
  uid: string;
  email: string;
  role?: UserRole;
  name?: string;
  iat: number;
  exp: number;
}

/**
 * Serializable session user — safe to pass from Server to Client Components.
 * Does NOT include sensitive Admin SDK fields.
 */
export interface SessionUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
}
