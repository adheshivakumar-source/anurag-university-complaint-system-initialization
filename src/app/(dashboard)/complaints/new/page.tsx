// src/app/(dashboard)/complaints/new/page.tsx
// Server Component — guarded route for complaint submission.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/authorization";
import { USER_ROLES } from "@/types";
import { ComplaintForm } from "./ComplaintForm";

export const metadata: Metadata = {
  title: "File a Grievance",
  description: "Submit an official grievance to Anurag University administration.",
};

export default async function NewComplaintPage() {
  const context = await requireAuthenticatedUser();

  // Authoritative Security Gate: Department Officers are not permitted to submit complaints
  if (context.profile.role === USER_ROLES.DEPARTMENT_OFFICER) {
    redirect("/officer?error=officer_cannot_submit");
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-[#0F172A]"
            style={{ fontFamily: "'Source Serif 4', serif" }}
          >
            Submit Grievance
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Anurag University — Institutional Complaint Tracking System
          </p>
        </div>
      </div>

      <ComplaintForm />
    </div>
  );
}
