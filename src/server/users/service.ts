// src/lib/users/service.ts
// ============================================================
// Server-only User Profile & Management Service for AU-CTS.
//
// AUTHORIZATION & DATA INTEGRITY RULES:
// 1. Never overwrite privileged fields (role, departmentId, isActive)
//    during regular user login.
// 2. Custom claims on Firebase Auth must always stay synchronized
//    with the authoritative Firestore /users/{uid} document.
// 3. User deactivation revokes refresh tokens and disables the auth account.
// 4. This file is server-only.
// ============================================================

import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminFirestore } from "@/server/firebase/admin";
import type {
  UserProfile,
  UserProfileDTO,
  UserRole,
  SelfRegisterRole,
} from "@/shared/types";
import { USER_ROLES, SELF_REGISTER_ROLES } from "@/shared/types";

const USERS_COLLECTION = "users";

/**
 * Converts Firestore document data into a typed UserProfile.
 */
function mapDocToUserProfile(id: string, data: Record<string, unknown>): UserProfile {
  const toDate = (val: unknown): Date => {
    if (val instanceof Timestamp) return val.toDate();
    if (val instanceof Date) return val;
    if (typeof val === "string" || typeof val === "number") return new Date(val);
    return new Date();
  };

  return {
    uid: id,
    displayName: (data.displayName as string) || "Unknown User",
    email: (data.email as string) || "",
    role: (data.role as UserRole) || USER_ROLES.STUDENT,
    departmentId: (data.departmentId as string) || null,
    studentId: (data.studentId as string) || null,
    employeeId: (data.employeeId as string) || null,
    isActive: typeof data.isActive === "boolean" ? data.isActive : true,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    lastLoginAt: data.lastLoginAt ? toDate(data.lastLoginAt) : null,
  };
}

/**
 * Converts a UserProfile to a serializable UserProfileDTO for Client Components.
 */
export function serializeUserProfile(profile: UserProfile): UserProfileDTO {
  return {
    uid: profile.uid,
    displayName: profile.displayName,
    email: profile.email,
    role: profile.role,
    departmentId: profile.departmentId,
    studentId: profile.studentId,
    employeeId: profile.employeeId,
    isActive: profile.isActive,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
    lastLoginAt: profile.lastLoginAt ? profile.lastLoginAt.toISOString() : null,
  };
}

/**
 * Retrieves a user profile by UID from Firestore.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getAdminFirestore();
  const docRef = db.collection(USERS_COLLECTION).doc(uid);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    return null;
  }

  return mapDocToUserProfile(snapshot.id, snapshot.data() || {});
}

/**
 * Ensures a user profile exists in Firestore and updates login timestamp.
 *
 * For new users: creates profile with a validated safe role and sets custom claims.
 * For existing users: updates lastLoginAt without modifying privileged fields.
 */
export async function getOrCreateUserProfile(
  uid: string,
  params: {
    email: string;
    displayName?: string;
    requestedRole?: UserRole;
    studentId?: string | null;
    employeeId?: string | null;
  },
): Promise<UserProfile> {
  const db = getAdminFirestore();
  const adminAuth = getAdminAuth();
  const userRef = db.collection(USERS_COLLECTION).doc(uid);

  const existing = await userRef.get();

  if (existing.exists) {
    // Existing user: Update login timestamp and sync name if provided.
    // NEVER overwrite role, departmentId, or isActive on ordinary login!
    const data = existing.data() || {};
    const updates: Record<string, unknown> = {
      lastLoginAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (params.displayName && params.displayName !== data.displayName) {
      updates.displayName = params.displayName;
    }

    await userRef.update(updates);

    const profile = mapDocToUserProfile(uid, { ...data, ...updates, lastLoginAt: new Date() });

    // Ensure custom claims are in sync with Firestore role
    const authUser = await adminAuth.getUser(uid);
    const existingRoleClaim = authUser.customClaims?.["role"];
    if (existingRoleClaim !== profile.role) {
      await adminAuth.setCustomUserClaims(uid, {
        role: profile.role,
        departmentId: profile.departmentId ?? null,
      });
    }

    return profile;
  }

  // New user: Determine safe initial role (only allow self-register roles)
  let initialRole: UserRole = USER_ROLES.STUDENT;
  if (params.requestedRole && SELF_REGISTER_ROLES.includes(params.requestedRole as SelfRegisterRole)) {
    initialRole = params.requestedRole;
  }

  // Derive safe neutral fallback for displayName based on role — never use email prefix as a human name
  const neutralDisplayName =
    initialRole === USER_ROLES.STUDENT
      ? "Anurag Student"
      : initialRole === USER_ROLES.FACULTY
      ? "Faculty Member"
      : initialRole === USER_ROLES.STAFF
      ? "Staff Member"
      : "University Member";

  const resolvedDisplayName =
    params.displayName && params.displayName.trim().length > 0
      ? params.displayName.trim()
      : neutralDisplayName;

  // Auto-extract studentId from email local-part in uppercase ONLY if student role and studentId is empty
  let resolvedStudentId: string | null = null;
  if (initialRole === USER_ROLES.STUDENT) {
    if (params.studentId && params.studentId.trim().length > 0) {
      resolvedStudentId = params.studentId.trim();
    } else if (params.email && params.email.includes("@")) {
      const localPart = params.email.split("@")[0]?.trim();
      if (localPart && localPart.length > 0) {
        resolvedStudentId = localPart.toUpperCase();
      }
    }
  }

  const resolvedEmployeeId =
    (initialRole === USER_ROLES.FACULTY || initialRole === USER_ROLES.STAFF) &&
    params.employeeId &&
    params.employeeId.trim().length > 0
      ? params.employeeId.trim()
      : null;

  const newProfileData = {
    uid,
    displayName: resolvedDisplayName,
    email: params.email,
    role: initialRole,
    departmentId: null,
    studentId: resolvedStudentId,
    employeeId: resolvedEmployeeId,
    isActive: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    lastLoginAt: FieldValue.serverTimestamp(),
  };

  await userRef.set(newProfileData);

  // Set Firebase Custom Claims for role-based security rules
  await adminAuth.setCustomUserClaims(uid, {
    role: initialRole,
    departmentId: null,
  });

  return mapDocToUserProfile(uid, {
    ...newProfileData,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
  });
}

/**
 * Updates non-privileged profile data (displayName, studentId, employeeId).
 */
export async function updateUserSelfProfile(
  uid: string,
  updates: {
    displayName?: string;
    studentId?: string | null;
    employeeId?: string | null;
  },
): Promise<UserProfile> {
  const db = getAdminFirestore();
  const userRef = db.collection(USERS_COLLECTION).doc(uid);

  const cleanUpdates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (updates.displayName !== undefined) cleanUpdates.displayName = updates.displayName.trim();
  if (updates.studentId !== undefined) cleanUpdates.studentId = updates.studentId ? updates.studentId.trim() : null;
  if (updates.employeeId !== undefined) cleanUpdates.employeeId = updates.employeeId ? updates.employeeId.trim() : null;

  await userRef.update(cleanUpdates);

  const updatedDoc = await userRef.get();
  return mapDocToUserProfile(uid, updatedDoc.data() || {});
}

/**
 * Administrator action: Update a user's role and/or department assignment.
 * Synchronizes both the Firestore /users document and Firebase Custom Claims.
 */
export async function adminUpdateUserRoleAndDept(
  targetUid: string,
  params: {
    role: UserRole;
    departmentId?: string | null;
  },
): Promise<UserProfile> {
  const db = getAdminFirestore();
  const adminAuth = getAdminAuth();
  const userRef = db.collection(USERS_COLLECTION).doc(targetUid);

  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    throw new Error(`User ${targetUid} not found.`);
  }

  const departmentId = params.role === USER_ROLES.DEPARTMENT_OFFICER ? (params.departmentId ?? null) : null;

  // 1. Update Firestore record
  await userRef.update({
    role: params.role,
    departmentId,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // 2. Synchronize Firebase Auth Custom Claims
  await adminAuth.setCustomUserClaims(targetUid, {
    role: params.role,
    departmentId,
  });

  const updated = await userRef.get();
  return mapDocToUserProfile(targetUid, updated.data() || {});
}

/**
 * Administrator action: Activate or deactivate a user account.
 * When deactivated:
 *  - isActive is set to false in Firestore.
 *  - Firebase Auth user account is disabled.
 *  - All active refresh tokens / sessions are revoked.
 */
export async function adminToggleUserActiveStatus(
  adminUid: string,
  targetUid: string,
  isActive: boolean,
): Promise<UserProfile> {
  if (adminUid === targetUid && !isActive) {
    throw new Error("Administrators cannot deactivate their own account.");
  }

  const db = getAdminFirestore();
  const adminAuth = getAdminAuth();
  const userRef = db.collection(USERS_COLLECTION).doc(targetUid);

  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    throw new Error(`User ${targetUid} not found.`);
  }

  // 1. Update Firestore status
  await userRef.update({
    isActive,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // 2. Synchronize Firebase Auth status
  await adminAuth.updateUser(targetUid, {
    disabled: !isActive,
  });

  // 3. If deactivating, immediately revoke active sessions
  if (!isActive) {
    await adminAuth.revokeRefreshTokens(targetUid);
  }

  const updated = await userRef.get();
  return mapDocToUserProfile(targetUid, updated.data() || {});
}

/**
 * Lists all users with optional filtering for the Admin dashboard.
 */
export async function listAllUsers(filter?: {
  role?: UserRole;
  isActive?: boolean;
  departmentId?: string;
  search?: string;
  limit?: number;
}): Promise<UserProfile[]> {
  const db = getAdminFirestore();
  let query: FirebaseFirestore.Query = db.collection(USERS_COLLECTION);

  if (filter?.role) {
    query = query.where("role", "==", filter.role);
  }

  if (typeof filter?.isActive === "boolean") {
    query = query.where("isActive", "==", filter.isActive);
  }

  if (filter?.departmentId) {
    query = query.where("departmentId", "==", filter.departmentId);
  }

  query = query.orderBy("createdAt", "desc");

  if (filter?.limit) {
    query = query.limit(filter.limit);
  }

  const snapshot = await query.get();
  let users = snapshot.docs.map((doc) => mapDocToUserProfile(doc.id, doc.data()));

  // In-memory client search if search query provided
  if (filter?.search) {
    const term = filter.search.toLowerCase();
    users = users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.studentId && u.studentId.toLowerCase().includes(term)) ||
        (u.employeeId && u.employeeId.toLowerCase().includes(term)),
    );
  }

  return users;
}

// ── Admin User Governance Metrics ─────────────────────────────

export interface AdminUserMetrics {
  totalUsers: number;
  studentsCount: number;
  facultyCount: number;
  staffCount: number;
  officersCount: number;
  deactivatedCount: number;
}

/**
 * Computes high-level user governance metrics using native Firestore aggregations.
 */
export async function getAdminUserMetrics(): Promise<AdminUserMetrics> {
  const db = getAdminFirestore();
  const usersCol = db.collection(USERS_COLLECTION);

  const [
    totalSnap,
    studentsSnap,
    facultySnap,
    staffSnap,
    officersSnap,
    deactivatedSnap,
  ] = await Promise.all([
    usersCol.count().get(),
    usersCol.where("role", "==", USER_ROLES.STUDENT).count().get(),
    usersCol.where("role", "==", USER_ROLES.FACULTY).count().get(),
    usersCol.where("role", "==", USER_ROLES.STAFF).count().get(),
    usersCol.where("role", "==", USER_ROLES.DEPARTMENT_OFFICER).count().get(),
    usersCol.where("isActive", "==", false).count().get(),
  ]);

  return {
    totalUsers: totalSnap.data().count,
    studentsCount: studentsSnap.data().count,
    facultyCount: facultySnap.data().count,
    staffCount: staffSnap.data().count,
    officersCount: officersSnap.data().count,
    deactivatedCount: deactivatedSnap.data().count,
  };
}
