// src/app/(dashboard)/admin/page.tsx
// Administrator Dashboard Overview

import type { Metadata } from "next";
import Link from "next/link";
import { listAllUsers } from "@/lib/users/service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { USER_ROLES } from "@/types";

export const metadata: Metadata = {
  title: "Admin Portal",
};

export default async function AdminDashboardPage() {
  const users = await listAllUsers();

  const totalUsers = users.length;
  const totalStudents = users.filter((u) => u.role === USER_ROLES.STUDENT).length;
  const totalFaculty = users.filter((u) => u.role === USER_ROLES.FACULTY).length;
  const totalOfficers = users.filter((u) => u.role === USER_ROLES.DEPARTMENT_OFFICER).length;
  const totalAdmins = users.filter((u) => u.role === USER_ROLES.ADMIN).length;
  const deactivatedUsers = users.filter((u) => !u.isActive).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-[#0F172A]"
            style={{ fontFamily: "'Source Serif 4', serif" }}
          >
            System Administration
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Central identity management and institutional oversight for AU-CTS.
          </p>
        </div>

        <Link href="/admin/users">
          <Button variant="primary">Manage Users & Roles</Button>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
              Total Users
            </span>
            <span className="text-2xl font-bold text-[#0F172A]">
              {totalUsers}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
              Students
            </span>
            <span className="text-2xl font-bold text-[#0F172A]">
              {totalStudents}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
              Faculty / Staff
            </span>
            <span className="text-2xl font-bold text-[#0F172A]">
              {totalFaculty}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
              Officers
            </span>
            <span className="text-2xl font-bold text-[#0F172A]">
              {totalOfficers}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
              Admins
            </span>
            <span className="text-2xl font-bold text-[#0F172A]">
              {totalAdmins}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
              Deactivated
            </span>
            <span
              className={`text-2xl font-bold ${
                deactivatedUsers > 0 ? "text-red-700" : "text-[#0F172A]"
              }`}
            >
              {deactivatedUsers}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Admin Action Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User & Role Directory</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-[#64748B]">
            <p>
              Inspect registered institutional accounts, assign department
              officer permissions, promote administrators, and enforce account
              suspensions.
            </p>
            <div className="pt-2">
              <Link href="/admin/users">
                <Button variant="secondary" size="sm">
                  Open User Directory →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security & Audit Protocol</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-[#64748B]">
            <p>
              All role elevations and account deactivations are synchronized
              between Firestore documents and Firebase Auth custom claims,
              immediately invalidating stale sessions upon status changes.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                Security Rules & Custom Claims Active
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
