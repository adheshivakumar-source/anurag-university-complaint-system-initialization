// src/app/(dashboard)/dashboard/page.tsx
// Main dashboard page — role-aware overview with live submitter metrics

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireAuthenticatedUser } from "@/server/auth/authorization";
import {
  getUserComplaintMetrics,
  listUserComplaints,
  serializeComplaintToDTO,
  type SubmitterMetricsDTO,
} from "@/server/complaints/service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import {
  ROLE_LABELS,
  USER_ROLES,
  CATEGORY_LABELS,
  type ComplaintDTO,
} from "@/shared/types";

export const metadata: Metadata = {
  title: "Dashboard — AU-CTS",
};

function formatDashboardDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return isoString;
  }
}

export default async function DashboardPage() {
  const context = await requireAuthenticatedUser();
  const { profile } = context;

  const isOfficer = profile.role === USER_ROLES.DEPARTMENT_OFFICER;
  const isAdmin = profile.role === USER_ROLES.ADMIN;
  const isSubmitter = !isOfficer && !isAdmin;

  // For submitters (Student, Faculty, Staff), fetch server-side metrics and 5 most recent complaints
  let metrics: SubmitterMetricsDTO = {
    totalFiled: 0,
    activeCount: 0,
    inReviewCount: 0,
    resolvedCount: 0,
  };
  let recentComplaints: ComplaintDTO[] = [];

  if (isSubmitter) {
    const [userMetrics, rawComplaints] = await Promise.all([
      getUserComplaintMetrics(context.user.uid),
      listUserComplaints(context.user.uid, 5),
    ]);
    metrics = userMetrics;
    recentComplaints = rawComplaints.map(serializeComplaintToDTO);
  }

  const { totalFiled, activeCount, inReviewCount, resolvedCount } = metrics;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Campus Hero Banner ── */}
      <div className="relative w-full h-40 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
        <Image
          src="/images/au/campus_building.jpg"
          alt="Anurag University campus"
          fill
          className="object-cover object-center"
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.60) 60%, rgba(15,23,42,0.25) 100%)",
          }}
          aria-hidden="true"
        />
        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1
              className="text-2xl md:text-3xl font-bold text-white"
              style={{ fontFamily: "'Source Serif 4', serif" }}
            >
              Welcome, {profile.displayName}
            </h1>
            <Badge
              variant={
                isAdmin
                  ? "maroon"
                  : isOfficer
                  ? "in_review"
                  : "default"
              }
            >
              {ROLE_LABELS[profile.role]}
            </Badge>
          </div>
          <p className="text-sm text-slate-200 mt-1 max-w-xl">
            Anurag University — Complaint Tracking & Grievance Remediation System
          </p>
        </div>

        {/* Action buttons — top right of banner */}
        <div className="absolute top-4 right-5 hidden sm:flex items-center gap-2">
          {isSubmitter && (
            <Link href="/complaints/new">
              <Button variant="primary" size="sm" className="bg-[#6B1724] hover:bg-[#8B1E30] text-white border-none shadow">
                + File Grievance
              </Button>
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/users">
              <Button variant="primary" size="sm">
                Manage Users
              </Button>
            </Link>
          )}
          {isOfficer && (
            <Link href="/officer">
              <Button variant="primary" size="sm">
                Department Queue
              </Button>
            </Link>
          )}
          <Link href="/profile">
            <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              My Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Submitter Dashboard (Student / Faculty / Staff) ── */}
      {isSubmitter && (
        <>
          {/* 1. Live Submitter Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Filed */}
            <Card className="border border-[#CBD5E1] bg-white shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                    Total Filed
                  </span>
                  <span className="text-2xl md:text-3xl font-bold text-[#0F172A]">
                    {totalFiled}
                  </span>
                  <span className="text-[11px] text-[#94A3B8] block mt-0.5">
                    Lifetime grievances
                  </span>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </CardContent>
            </Card>

            {/* Active Complaints */}
            <Card className="border border-[#CBD5E1] bg-white shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block mb-1">
                    Active Complaints
                  </span>
                  <span className="text-2xl md:text-3xl font-bold text-blue-900">
                    {activeCount}
                  </span>
                  <span className="text-[11px] text-[#94A3B8] block mt-0.5">
                    Open & in progress
                  </span>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </CardContent>
            </Card>

            {/* In Review */}
            <Card className="border border-[#CBD5E1] bg-white shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block mb-1">
                    In Review
                  </span>
                  <span className="text-2xl md:text-3xl font-bold text-amber-900">
                    {inReviewCount}
                  </span>
                  <span className="text-[11px] text-[#94A3B8] block mt-0.5">
                    Officer investigating
                  </span>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </CardContent>
            </Card>

            {/* Resolved */}
            <Card className="border border-[#CBD5E1] bg-white shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block mb-1">
                    Resolved
                  </span>
                  <span className="text-2xl md:text-3xl font-bold text-emerald-900">
                    {resolvedCount}
                  </span>
                  <span className="text-[11px] text-[#94A3B8] block mt-0.5">
                    Successfully closed
                  </span>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 2. Main Content Grid: Recent Grievances (2 cols) + Identity & Quick Actions (1 col) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Grievances Table / List (2 columns on large screens) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <Card className="border border-[#CBD5E1] bg-white shadow-xs">
                <CardHeader className="border-b border-[#E2E8F0] pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-[#0F172A]">
                      Recent Grievances
                    </CardTitle>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Your 5 most recently submitted complaints.
                    </p>
                  </div>
                  {totalFiled > 0 && (
                    <Link
                      href="/complaints"
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline inline-flex items-center gap-1"
                    >
                      View all ({totalFiled}) →
                    </Link>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {recentComplaints.length > 0 ? (
                    <div className="divide-y divide-[#E2E8F0] overflow-hidden">
                      {recentComplaints.map((item) => (
                        <div
                          key={item.complaintId}
                          className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/complaints/${item.complaintId}`}
                                className="font-mono text-xs font-bold text-blue-700 hover:underline"
                              >
                                {item.complaintId}
                              </Link>
                              <span className="text-xs text-[#94A3B8]">•</span>
                              <span className="text-xs text-[#64748B] font-medium">
                                {CATEGORY_LABELS[item.category]}
                              </span>
                              <PriorityBadge priority={item.priority} />
                            </div>
                            <Link
                              href={`/complaints/${item.complaintId}`}
                              className="text-sm font-semibold text-[#0F172A] hover:text-blue-700 line-clamp-1 truncate"
                            >
                              {item.title}
                            </Link>
                            <span className="text-[11px] text-[#94A3B8]">
                              Submitted {formatDashboardDate(item.submittedAt)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                            <StatusBadge status={item.status} />
                            <Link href={`/complaints/${item.complaintId}`}>
                              <Button variant="secondary" size="sm" className="h-8 text-xs">
                                View →
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-[#0F172A]">
                        No Grievances Filed Yet
                      </h4>
                      <p className="mt-1 max-w-sm text-xs text-[#64748B]">
                        You haven&apos;t submitted any complaints. If you are facing any issues regarding campus facilities, hostel, or transport, file a grievance.
                      </p>
                      <div className="mt-4">
                        <Link href="/complaints/new">
                          <Button variant="primary" size="sm" className="bg-[#6B1724] hover:bg-[#8B1E30] text-white">
                            + Submit Your First Grievance
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Submitter Quick Action & Institutional Identity Panel (1 column) */}
            <div className="flex flex-col gap-6">
              {/* Primary Call-to-Action Card */}
              <Card className="border border-[#CBD5E1] bg-gradient-to-br from-white to-slate-50/50 shadow-xs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold text-[#0F172A]">
                    Quick Grievance Action
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Have an issue with campus facilities, academics, hostel, or transport? File a formal ticket with supporting proof.
                  </p>
                  <Link href="/complaints/new" className="w-full">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full justify-center bg-[#6B1724] hover:bg-[#8B1E30] text-white shadow-xs font-semibold"
                    >
                      + Submit New Grievance
                    </Button>
                  </Link>
                  <Link href="/complaints" className="w-full">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full justify-center text-xs"
                    >
                      Browse All My Complaints ({totalFiled})
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Institutional Identity Card */}
              <Card className="border border-[#CBD5E1] bg-white shadow-xs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold text-[#0F172A]">
                    Institutional Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  <div>
                    <span className="text-[11px] text-[#64748B] block font-semibold uppercase tracking-wider">
                      Account Email
                    </span>
                    <p className="font-medium text-[#0F172A] text-xs truncate">
                      {profile.email}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#64748B] block font-semibold uppercase tracking-wider">
                      Role Clearance
                    </span>
                    <p className="text-xs text-[#0F172A] font-medium">
                      {ROLE_LABELS[profile.role]}
                    </p>
                  </div>

                  {profile.studentId && (
                    <div>
                      <span className="text-[11px] text-[#64748B] block font-semibold uppercase tracking-wider">
                        Roll ID
                      </span>
                      <p className="font-mono text-xs text-[#0F172A] font-semibold">
                        {profile.studentId}
                      </p>
                    </div>
                  )}

                  {profile.employeeId && (
                    <div>
                      <span className="text-[11px] text-[#64748B] block font-semibold uppercase tracking-wider">
                        Employee ID
                      </span>
                      <p className="font-mono text-xs text-[#0F172A] font-semibold">
                        {profile.employeeId}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#E2E8F0]">
                    <Link
                      href="/profile"
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      Manage Account Details →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* ── Officer & Admin Overview Panels (Preserved) ── */}
      {!isSubmitter && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Identity Card */}
          <Card>
            <CardHeader>
              <CardTitle>Institutional Identity</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div>
                <span className="text-xs text-[#64748B] block font-medium uppercase">
                  Email
                </span>
                <p className="font-semibold text-[#0F172A]">{profile.email}</p>
              </div>

              <div>
                <span className="text-xs text-[#64748B] block font-medium uppercase">
                  Role Clearance
                </span>
                <p className="text-[#0F172A]">{ROLE_LABELS[profile.role]}</p>
              </div>

              {profile.employeeId && (
                <div>
                  <span className="text-xs text-[#64748B] block font-medium uppercase">
                    Employee ID
                  </span>
                  <p className="font-mono text-[#0F172A]">{profile.employeeId}</p>
                </div>
              )}

              {profile.departmentId && (
                <div>
                  <span className="text-xs text-[#64748B] block font-medium uppercase">
                    Assigned Department
                  </span>
                  <p className="text-[#0F172A] capitalize">
                    {profile.departmentId.replace("dept-", "")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Panel */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>System Workspace</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm text-[#475569]">
              {isOfficer && (
                <div className="flex flex-col gap-3">
                  <p>
                    As a Department Officer, you have clearance to review,
                    investigate, and resolve complaints routed to your department
                    queue.
                  </p>
                  <div className="flex gap-3 pt-2">
                    <Link href="/officer">
                      <Button variant="primary" size="sm">
                        Access Department Queue →
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {isAdmin && (
                <div className="flex flex-col gap-3">
                  <p>
                    As a System Administrator, you have full oversight over user
                    roles, department assignments, category routing rules, and
                    institutional analytics.
                  </p>
                  <div className="flex gap-3 pt-2">
                    <Link href="/admin">
                      <Button variant="primary" size="sm">
                        Open Admin Portal →
                      </Button>
                    </Link>
                    <Link href="/admin/users">
                      <Button variant="secondary" size="sm">
                        User Directory
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
