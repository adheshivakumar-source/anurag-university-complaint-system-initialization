// src/app/(dashboard)/complaints/page.tsx
// Complaints list placeholder for Phase 2

import type { Metadata } from "next";
import { requireAuthenticatedUser } from "@/lib/auth/authorization";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "My Complaints",
};

export default async function ComplaintsPage() {
  const context = await requireAuthenticatedUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          className="text-2xl font-bold text-[#0F172A]"
          style={{ fontFamily: "'Source Serif 4', serif" }}
        >
          My Complaints
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Complaints submitted by {context.profile.displayName}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grievance History</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center text-[#64748B]">
          <p className="text-sm">
            You are authenticated as <strong>{context.profile.role}</strong>.
            Complaint submission and tracking features will be introduced in Phase 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
