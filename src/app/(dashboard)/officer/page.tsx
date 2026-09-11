// src/app/(dashboard)/officer/page.tsx
// Department Officer Grievance Queue Overview

import type { Metadata } from "next";
import { requireAnyRole } from "@/lib/auth/authorization";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { USER_ROLES } from "@/types";

export const metadata: Metadata = {
  title: "Officer Dashboard",
};

export default async function OfficerDashboardPage() {
  const context = await requireAnyRole([
    USER_ROLES.DEPARTMENT_OFFICER,
    USER_ROLES.ADMIN,
  ]);

  const deptName = context.profile.departmentId
    ? context.profile.departmentId.replace("dept-", "").toUpperCase()
    : "GENERAL";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          className="text-2xl font-bold text-[#0F172A]"
          style={{ fontFamily: "'Source Serif 4', serif" }}
        >
          Department Grievance Queue — {deptName}
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Assigned to: {context.profile.displayName} (
          {context.profile.role.replace("_", " ")})
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Grievances</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center flex flex-col items-center justify-center gap-3 text-[#64748B]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1E40AF]">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-[#0F172A]">
            Officer Department Queue Active
          </h3>
          <p className="max-w-md text-sm">
            You are authorized as a Department Officer. Interactive triage,
            status resolution, and ticket lifecycle workflows arrive in Phase 4.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
