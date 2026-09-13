// src/app/(dashboard)/dashboard/page.tsx
// Main dashboard page — role-aware overview with campus imagery

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireAuthenticatedUser } from "@/server/auth/authorization";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS, USER_ROLES } from "@/shared/types";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const context = await requireAuthenticatedUser();
  const { profile } = context;

  const isStudent = profile.role === USER_ROLES.STUDENT;
  const isOfficer = profile.role === USER_ROLES.DEPARTMENT_OFFICER;
  const isAdmin = profile.role === USER_ROLES.ADMIN;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Campus Hero Banner ── */}
      <div className="relative w-full h-36 rounded-xl overflow-hidden flex-shrink-0">
        <Image
          src="/images/au/campus_building.jpg"
          alt="Anurag University campus"
          fill
          className="object-cover object-center"
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
        />
        {/* Gradient overlay — right edge fades to navy for text */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(30,41,59,0.70) 0%, rgba(30,41,59,0.45) 60%, rgba(30,41,59,0.15) 100%)",
          }}
          aria-hidden="true"
        />
        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-center px-7">
          <div className="flex items-center gap-3">
            <h1
              className="text-2xl font-bold text-white"
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
          <p className="text-sm text-white/70 mt-1">
            Anurag University — Complaint Tracking System
          </p>
        </div>

        {/* Action buttons — top right of banner */}
        <div className="absolute top-4 right-5 flex items-center gap-2">
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
            <Button variant="secondary" size="sm">
              My Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Role-Specific Overview Panels ── */}
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

            {profile.studentId && (
              <div>
                <span className="text-xs text-[#64748B] block font-medium uppercase">
                  Roll ID
                </span>
                <p className="font-mono text-[#0F172A]">{profile.studentId}</p>
              </div>
            )}

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
            <CardTitle>System Capabilities</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm text-[#475569]">
            {isStudent && (
              <div className="flex flex-col gap-3">
                <p>
                  As an enrolled student, you have access to file complaints across
                  Hostel, Transport, Classroom, Lab, Maintenance, and Academic
                  categories with real-time status tracking.
                </p>
                <div className="flex gap-3 pt-2">
                  <Link href="/complaints">
                    <Button variant="secondary" size="sm">
                      View My Complaints
                    </Button>
                  </Link>
                </div>
              </div>
            )}

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

            {/* Faculty/Staff fallback */}
            {!isStudent && !isOfficer && !isAdmin && (
              <div className="flex flex-col gap-3">
                <p>
                  As a university member, you can file and track complaints across
                  all operational categories with real-time status updates.
                </p>
                <div className="flex gap-3 pt-2">
                  <Link href="/complaints">
                    <Button variant="secondary" size="sm">
                      View My Complaints
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
