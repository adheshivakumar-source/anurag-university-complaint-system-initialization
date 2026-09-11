// src/app/(dashboard)/admin/users/page.tsx
// Administrator User Management Directory Page

import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/authorization";
import { listAllUsers, serializeUserProfile } from "@/lib/users/service";
import { UsersTable } from "./UsersTable";

export const metadata: Metadata = {
  title: "User Management",
};

export default async function AdminUsersPage() {
  const adminContext = await requireAdmin();
  const rawUsers = await listAllUsers();
  const serializedUsers = rawUsers.map(serializeUserProfile);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          className="text-2xl font-bold text-[#0F172A]"
          style={{ fontFamily: "'Source Serif 4', serif" }}
        >
          Institutional User Management
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Review user accounts, assign grievance handling roles, and enforce
          account access controls.
        </p>
      </div>

      <UsersTable
        initialUsers={serializedUsers}
        currentAdminUid={adminContext.profile.uid}
      />
    </div>
  );
}
