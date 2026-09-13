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

export const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student",
  faculty: "Faculty",
  staff: "Staff",
  department_officer: "Department Officer",
  admin: "Administrator",
};

/**
 * Roles that users can self-select during registration.
 * Privileged roles (admin, department_officer) CANNOT be self-registered
 * and must be assigned by an Administrator.
 */
export const SELF_REGISTER_ROLES: readonly UserRole[] = [
  USER_ROLES.STUDENT,
  USER_ROLES.FACULTY,
  USER_ROLES.STAFF,
] as const;

export type SelfRegisterRole = (typeof SELF_REGISTER_ROLES)[number];

/**
 * The user profile document as stored in Firestore /users/{uid}.
 * This supplements Firebase Auth with application-level user data.
 */
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  departmentId?: string | null; // Required for department_officer
  studentId?: string | null; // For students (e.g. 21AG1A0501)
  employeeId?: string | null; // For staff / faculty (e.g. AU-EMP-401)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
}

/**
 * Serializable DTO version of UserProfile safe to send from Server
 * Components to Client Components (Dates converted to ISO strings).
 */
export interface UserProfileDTO {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  departmentId?: string | null;
  studentId?: string | null;
  employeeId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

/**
 * The decoded session payload returned from Admin SDK token verification.
 * Contains Firebase standard claims plus our custom role and department claims.
 */
export interface SessionClaims {
  uid: string;
  email: string;
  role?: UserRole;
  departmentId?: string | null;
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
  departmentId?: string | null;
  isActive: boolean;
}

/**
 * Authenticated user context returned by server authorization helpers.
 */
export interface AuthenticatedUserContext {
  user: SessionUser;
  profile: UserProfile;
}
