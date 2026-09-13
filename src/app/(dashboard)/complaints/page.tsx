// src/app/(dashboard)/complaints/page.tsx
// ============================================================
// Live User Complaint Portal — AU-CTS
// Fetches the authenticated user's real complaints from Firestore.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";
import { requireAuthenticatedUser } from "@/server/auth/authorization";
import {
  listUserComplaints,
  serializeComplaintToDTO,
} from "@/server/complaints/service";
import { ComplaintsListClient } from "./ComplaintsListClient";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { USER_ROLES } from "@/shared/types";

export const metadata: Metadata = {
  title: "My Complaints — AU-CTS",
};

export default async function ComplaintsPage() {
  const context = await requireAuthenticatedUser();
  const isOfficer = context.profile.role === USER_ROLES.DEPARTMENT_OFFICER;

  // Department officers have their dedicated queue view at /officer
  if (isOfficer) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1
            className="text-2xl font-bold text-[#0F172A]"
            style={{ fontFamily: "'Source Serif 4', serif" }}
          >
            Officer Workspace
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Department Officer portal for {context.profile.displayName}.
          </p>
        </div>

        <Card className="border border-[#CBD5E1] bg-white">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700 mb-3">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[#0F172A]">
              Assigned Department Queue
            </h3>
            <p className="mt-1 max-w-md text-sm text-[#64748B]">
              As a Department Officer, your assigned grievances and departmental triage workflow are located in the Department Queue.
            </p>
            <div className="mt-5">
              <Link href="/officer">
                <Button variant="primary" size="md">
                  Go to Department Queue →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch real complaints submitted by the authenticated user
  const rawComplaints = await listUserComplaints(context.user.uid, 50);
  const complaints = rawComplaints.map(serializeComplaintToDTO);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold text-[#0F172A]"
            style={{ fontFamily: "'Source Serif 4', serif" }}
          >
            My Complaints
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Track and monitor the status of grievances submitted by {context.profile.displayName}.
          </p>
        </div>

        <Link href="/complaints/new">
          <Button variant="primary" size="md">
            + File a Grievance
          </Button>
        </Link>
      </div>

      {/* Interactive Portal Client */}
      <ComplaintsListClient complaints={complaints} />
    </div>
  );
}
