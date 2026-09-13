"use client";
// src/app/(dashboard)/admin/users/UsersTable.tsx
// Client Component — Interactive User Directory table with live search,
// role filtering, status toggling, and role modification modal.

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminUpdateUserRoleAction,
  adminToggleUserStatusAction,
} from "@/server/users/actions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { UserProfileDTO, UserRole } from "@/shared/types";
import { USER_ROLES, ROLE_LABELS, COMPLAINT_CATEGORIES } from "@/shared/types";
import { formatDate } from "@/utils/utils";

interface UsersTableProps {
  initialUsers: UserProfileDTO[];
  currentAdminUid: string;
}

export function UsersTable({ initialUsers, currentAdminUid }: UsersTableProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfileDTO[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Modal State for editing role
  const [editingUser, setEditingUser] = useState<UserProfileDTO | null>(null);
  const [newRole, setNewRole] = useState<UserRole>(USER_ROLES.STUDENT);
  const [newDepartmentId, setNewDepartmentId] = useState<string>("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Status toggle state
  const [togglingUid, setTogglingUid] = useState<string | null>(null);

  // Filtered users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.studentId &&
        user.studentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.employeeId &&
        user.employeeId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole =
      selectedRoleFilter === "ALL" || user.role === selectedRoleFilter;

    const matchesStatus =
      selectedStatusFilter === "ALL" ||
      (selectedStatusFilter === "ACTIVE" && user.isActive) ||
      (selectedStatusFilter === "INACTIVE" && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenRoleModal = (user: UserProfileDTO) => {
    setEditingUser(user);
    setNewRole(user.role);
    setNewDepartmentId(user.departmentId || "");
    setActionError(null);
    setActionSuccess(null);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    setIsUpdatingRole(true);
    setActionError(null);
    setActionSuccess(null);

    const result = await adminUpdateUserRoleAction({
      targetUid: editingUser.uid,
      role: newRole,
      departmentId:
        newRole === USER_ROLES.DEPARTMENT_OFFICER ? newDepartmentId : null,
    });

    setIsUpdatingRole(false);

    if (result.error) {
      setActionError(result.error);
    } else if (result.user) {
      const updatedUser = result.user;
      setUsers((prev) =>
        prev.map((u) => (u.uid === updatedUser.uid ? updatedUser : u)),
      );
      setActionSuccess(
        `Role for ${updatedUser.displayName} updated to ${ROLE_LABELS[updatedUser.role]}.`,
      );
      setEditingUser(null);
      router.refresh();
    }
  };

  const handleToggleStatus = async (user: UserProfileDTO) => {
    if (user.uid === currentAdminUid && user.isActive) {
      alert("You cannot deactivate your own administrative account.");
      return;
    }

    const action = user.isActive ? "deactivate" : "activate";
    if (
      !confirm(
        `Are you sure you want to ${action} ${user.displayName}'s account?`,
      )
    ) {
      return;
    }

    setTogglingUid(user.uid);
    setActionError(null);
    setActionSuccess(null);

    const result = await adminToggleUserStatusAction({
      targetUid: user.uid,
      isActive: !user.isActive,
    });

    setTogglingUid(null);

    if (result.error) {
      setActionError(result.error);
    } else if (result.user) {
      const updatedUser = result.user;
      setUsers((prev) =>
        prev.map((u) => (u.uid === updatedUser.uid ? updatedUser : u)),
      );
      setActionSuccess(
        `Account for ${updatedUser.displayName} is now ${
          updatedUser.isActive ? "Active" : "Deactivated"
        }.`,
      );
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Alert Notices */}
      {actionError && (
        <div
          role="alert"
          className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div
          role="alert"
          className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {actionSuccess}
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded border border-[#CBD5E1]">
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search by name, email, or ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-[#CBD5E1] bg-white px-3 py-1.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:outline-none focus-visible:border-[#6B1724]"
            aria-label="Search users"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="rounded border border-[#CBD5E1] bg-white px-3 py-1.5 text-sm text-[#0F172A] focus-visible:outline-none focus-visible:border-[#6B1724]"
            aria-label="Filter by role"
          >
            <option value="ALL">All Roles</option>
            <option value={USER_ROLES.STUDENT}>Students</option>
            <option value={USER_ROLES.FACULTY}>Faculty</option>
            <option value={USER_ROLES.STAFF}>Staff</option>
            <option value={USER_ROLES.DEPARTMENT_OFFICER}>
              Department Officers
            </option>
            <option value={USER_ROLES.ADMIN}>Administrators</option>
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="rounded border border-[#CBD5E1] bg-white px-3 py-1.5 text-sm text-[#0F172A] focus-visible:outline-none focus-visible:border-[#6B1724]"
            aria-label="Filter by status"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded border border-[#CBD5E1] bg-white">
        <table className="w-full text-left text-sm text-[#334155]">
          <thead className="bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#475569] border-b border-[#E2E8F0]">
            <tr>
              <th scope="col" className="px-5 py-3">
                User
              </th>
              <th scope="col" className="px-4 py-3">
                Role & Department
              </th>
              <th scope="col" className="px-4 py-3">
                ID Reference
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
              <th scope="col" className="px-4 py-3">
                Created
              </th>
              <th scope="col" className="px-5 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-sm text-[#64748B]"
                >
                  No institutional accounts match your search parameters.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6B1724] text-xs font-semibold text-white flex-shrink-0">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0F172A] truncate">
                          {user.displayName}
                        </p>
                        <p className="text-xs text-[#64748B] truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <Badge
                        variant={
                          user.role === USER_ROLES.ADMIN
                            ? "maroon"
                            : user.role === USER_ROLES.DEPARTMENT_OFFICER
                            ? "in_review"
                            : "default"
                        }
                      >
                        {ROLE_LABELS[user.role]}
                      </Badge>
                      {user.departmentId && (
                        <span className="text-[11px] text-[#64748B] capitalize">
                          Dept: {user.departmentId.replace("dept-", "")}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-xs text-[#64748B] font-mono">
                    {user.studentId || user.employeeId || "—"}
                  </td>

                  <td className="px-4 py-3">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                        Deactivated
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-xs text-[#64748B]">
                    {formatDate(user.createdAt)}
                  </td>

                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenRoleModal(user)}
                      >
                        Edit Role
                      </Button>

                      <Button
                        variant={user.isActive ? "destructive" : "secondary"}
                        size="sm"
                        isLoading={togglingUid === user.uid}
                        disabled={user.uid === currentAdminUid && user.isActive}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Role Modification Modal */}
      {editingUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-md rounded bg-white p-6 shadow-xl border border-[#CBD5E1] flex flex-col gap-4">
            <div>
              <h3
                id="role-modal-title"
                className="text-lg font-bold text-[#0F172A]"
                style={{ fontFamily: "'Source Serif 4', serif" }}
              >
                Modify User Role
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Target User: <strong>{editingUser.displayName}</strong> (
                {editingUser.email})
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="modal-role-select"
                  className="text-xs font-semibold uppercase tracking-wider text-[#334155]"
                >
                  Select New Role
                </label>
                <select
                  id="modal-role-select"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full rounded border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] focus-visible:outline-none focus-visible:border-[#6B1724]"
                >
                  <option value={USER_ROLES.STUDENT}>Student</option>
                  <option value={USER_ROLES.FACULTY}>Faculty Member</option>
                  <option value={USER_ROLES.STAFF}>Administrative Staff</option>
                  <option value={USER_ROLES.DEPARTMENT_OFFICER}>
                    Department Officer
                  </option>
                  <option value={USER_ROLES.ADMIN}>
                    System Administrator
                  </option>
                </select>
              </div>

              {newRole === USER_ROLES.DEPARTMENT_OFFICER && (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="modal-dept-select"
                    className="text-xs font-semibold uppercase tracking-wider text-[#334155]"
                  >
                    Assigned Grievance Department
                  </label>
                  <select
                    id="modal-dept-select"
                    value={newDepartmentId}
                    onChange={(e) => setNewDepartmentId(e.target.value)}
                    className="w-full rounded border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] focus-visible:outline-none focus-visible:border-[#6B1724]"
                  >
                    <option value="">Select Department…</option>
                    {Object.values(COMPLAINT_CATEGORIES).map((cat) => (
                      <option key={cat} value={`dept-${cat}`}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)} Department
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setEditingUser(null)}
                disabled={isUpdatingRole}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                isLoading={isUpdatingRole}
                onClick={handleSaveRole}
              >
                Save & Apply Role
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
