// src/app/(dashboard)/admin/page.tsx
// ============================================================
// Administrator Institutional Overview Dashboard — AU-CTS
// Provides institutional grievance health KPIs, user governance metrics,
// recent cross-department grievance stream, and departmental directory.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/authorization";
import {
  getAdminOverviewMetrics,
  listRecentAdminComplaints,
} from "@/server/complaints/service";
import { getAdminUserMetrics } from "@/server/users/service";
import { DEPARTMENT_CONFIGS } from "@/server/complaints/routing";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import {
  CATEGORY_LABELS,
  type ComplaintCategory,
} from "@/shared/types";

export const metadata: Metadata = {
  title: "Admin Portal — AU-CTS",
};

function formatAdminDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return isoString;
  }
}

export default async function AdminDashboardPage() {
  const context = await requireAdmin();

  // Parallel native Firestore aggregation and stream fetches
  const [overviewMetrics, userMetrics, recentComplaints] = await Promise.all([
    getAdminOverviewMetrics(context),
    getAdminUserMetrics(),
    listRecentAdminComplaints(context, 5),
  ]);

  const departmentEntries = Object.entries(DEPARTMENT_CONFIGS) as [
    ComplaintCategory,
    (typeof DEPARTMENT_CONFIGS)[ComplaintCategory],
  ][];

  return (
    <div className="flex flex-col gap-8">
      {/* ── Header & Primary Navigation ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold text-[#0F172A]"
            style={{ fontFamily: "'Source Serif 4', serif" }}
          >
            System Administration
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Central institutional oversight, grievance lifecycle monitoring, and user governance for Anurag University.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/complaints">
            <Button variant="secondary">Browse Grievances</Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="primary">Manage Users & Roles</Button>
          </Link>
        </div>
      </div>

      {/* ── Section 1: Institutional Grievance Health ── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider">
              Institutional Grievance Health
            </h2>
            <p className="text-xs text-[#64748B]">
              Aggregate status metrics across all university departments
            </p>
          </div>
          {overviewMetrics.unassignedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {overviewMetrics.unassignedCount} Unassigned Grievance{overviewMetrics.unassignedCount === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                Total Grievances
              </span>
              <span className="text-2xl font-bold text-[#0F172A]">
                {overviewMetrics.totalComplaints}
              </span>
              <span className="text-[11px] text-[#64748B] block mt-1">
                Lifetime submissions
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block mb-1">
                Submitted / New
              </span>
              <span className="text-2xl font-bold text-blue-700">
                {overviewMetrics.submittedCount}
              </span>
              <span className="text-[11px] text-[#64748B] block mt-1">
                Awaiting triage
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block mb-1">
                Active Remediation
              </span>
              <span className="text-2xl font-bold text-amber-700">
                {overviewMetrics.activeRemediationCount}
              </span>
              <span className="text-[11px] text-[#64748B] block mt-1">
                In review & reopened
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-[#991B1B] uppercase tracking-wider block mb-1">
                Escalated
              </span>
              <span
                className={`text-2xl font-bold ${
                  overviewMetrics.escalatedCount > 0
                    ? "text-[#991B1B]"
                    : "text-[#0F172A]"
                }`}
              >
                {overviewMetrics.escalatedCount}
              </span>
              <span className="text-[11px] text-[#64748B] block mt-1">
                High priority attention
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
                Resolved
              </span>
              <span className="text-2xl font-bold text-emerald-700">
                {overviewMetrics.resolvedCount}
              </span>
              <span className="text-[11px] text-[#64748B] block mt-1">
                Remediation complete
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                Closed
              </span>
              <span className="text-2xl font-bold text-slate-700">
                {overviewMetrics.closedCount}
              </span>
              <span className="text-[11px] text-[#64748B] block mt-1">
                Lifecycle terminated
              </span>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Section 2: User Governance & Identity ── */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wider">
            User Governance & Identity
          </h2>
          <p className="text-xs text-[#64748B]">
            Registered university account breakdown and security status
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                Total Accounts
              </span>
              <span className="text-2xl font-bold text-[#0F172A]">
                {userMetrics.totalUsers}
              </span>
              <span className="text-[11px] text-[#64748B] block mt-1">
                All registered users
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                Students
              </span>
              <span className="text-2xl font-bold text-[#0F172A]">
                {userMetrics.studentsCount}
              </span>
              <span className="text-[11px] text-[#64748B] block mt-1">
                Enrolled students
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                Faculty
              </span>
              <span className="text-2xl font-bold text-[#0F172A]">
                {userMetrics.facultyCount}
              </span>
              <span className="text-[11px] text-[#64748B] block mt-1">
                Teaching faculty
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                Staff
              </span>
              <span className="text-2xl font-bold text-[#0F172A]">
                {userMetrics.staffCount}
              </span>
              <span className="text-[11px] text-[#64748B] block mt-1">
                Campus staff
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                Dept Officers
              </span>
              <span className="text-2xl font-bold text-[#0F172A]">
                {userMetrics.officersCount}
              </span>
              <span className="text-[11px] text-[#64748B] block mt-1">
                Remediation officers
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
                  userMetrics.deactivatedCount > 0
                    ? "text-red-700"
                    : "text-[#0F172A]"
                }`}
              >
                {userMetrics.deactivatedCount}
              </span>
              <span className="text-[11px] text-[#64748B] block mt-1">
                Suspended accounts
              </span>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Section 3: Dual Column Overview & Directory ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Recent Institutional Grievances Stream */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Recent Institutional Grievances</CardTitle>
              <Link
                href="/admin/complaints"
                className="text-xs font-semibold text-[#6B1724] hover:underline"
              >
                View All Grievances →
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentComplaints.length === 0 ? (
                <div className="py-12 px-6 text-center text-sm text-[#64748B]">
                  No grievances have been registered in the system yet.
                </div>
              ) : (
                <div className="divide-y divide-[#E2E8F0]">
                  {recentComplaints.map((complaint) => {
                    const deptConfig = DEPARTMENT_CONFIGS[complaint.category];
                    const deptName =
                      deptConfig?.departmentName || complaint.departmentId || "General";

                    return (
                      <div
                        key={complaint.complaintId}
                        className="p-4 hover:bg-[#F8FAFC] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-[#0F172A]">
                              {complaint.complaintId}
                            </span>
                            <StatusBadge status={complaint.status} />
                            <PriorityBadge priority={complaint.priority} />
                            <span className="text-xs text-[#64748B] font-medium">
                              • {CATEGORY_LABELS[complaint.category]}
                            </span>
                          </div>

                          <h4 className="text-sm font-semibold text-[#0F172A] truncate">
                            {complaint.title}
                          </h4>

                          <div className="flex items-center gap-3 text-xs text-[#64748B] flex-wrap">
                            <span>
                              Dept: <strong className="text-[#334155]">{deptName}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              By: <strong className="text-[#334155]">{complaint.submittedByName}</strong>
                            </span>
                            <span>•</span>
                            <span>{formatAdminDate(complaint.submittedAt)}</span>
                          </div>
                        </div>

                        <div className="flex-shrink-0 self-end sm:self-center">
                          <Link href={`/complaints/${complaint.complaintId}`}>
                            <Button variant="secondary" size="sm">
                              Dossier →
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Quick Actions & Departmental Directory */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Administrative Workspaces</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex flex-col gap-1.5 p-3 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="font-semibold text-[#0F172A]">User & Role Directory</span>
                <p className="text-xs text-[#64748B]">
                  Manage permissions, assign department officer credentials, or suspend user access.
                </p>
                <div className="pt-1">
                  <Link href="/admin/users">
                    <Button variant="secondary" size="sm">
                      Open User Directory →
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 p-3 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="font-semibold text-[#0F172A]">Global Complaint Portal</span>
                <p className="text-xs text-[#64748B]">
                  Search, filter, and inspect complaints across all university operational departments.
                </p>
                <div className="pt-1">
                  <Link href="/admin/complaints">
                    <Button variant="secondary" size="sm">
                      Open Complaint Portal →
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Department Directory Panel (Read-only from DEPARTMENT_CONFIGS) */}
          <Card>
            <CardHeader>
              <CardTitle>Operational Department Registry</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[#E2E8F0] text-xs">
                {departmentEntries.map(([category, config]) => (
                  <div key={category} className="p-3.5 flex flex-col gap-1 hover:bg-[#F8FAFC]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0F172A]">
                        {config.departmentName}
                      </span>
                      <span className="font-mono text-[11px] text-[#64748B]">
                        {config.departmentId}
                      </span>
                    </div>
                    <div className="text-[#64748B] flex items-center justify-between">
                      <span>Category: {CATEGORY_LABELS[category]}</span>
                      <span>SLA (Med): {config.provisionalSlaHours.medium}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
