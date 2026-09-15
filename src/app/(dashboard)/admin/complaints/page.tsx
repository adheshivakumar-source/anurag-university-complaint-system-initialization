// src/app/(dashboard)/admin/complaints/page.tsx
// ============================================================
// Administrator Institutional Grievance Directory — AU-CTS
// Server Component guarded by /admin/layout.tsx (requireAdmin).
// Fetches all cross-department institutional complaints for oversight.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/authorization";
import { listAllComplaints } from "@/server/complaints/service";
import { AdminComplaintsTable } from "./AdminComplaintsTable";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Institutional Grievance Directory — AU-CTS",
};

export default async function AdminComplaintsPage() {
  const context = await requireAdmin();
  const complaints = await listAllComplaints(context, { limit: 100 });

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header & Breadcrumbs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
            <Link href="/admin" className="hover:text-[#0F172A] transition-colors">
              Admin Portal
            </Link>
            <span>/</span>
            <span className="font-semibold text-[#0F172A]">Grievances</span>
          </div>
          <h1
            className="text-2xl font-bold text-[#0F172A]"
            style={{ fontFamily: "'Source Serif 4', serif" }}
          >
            Institutional Grievance Directory
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Central repository for inspecting, filtering, and tracking complaints across all Anurag University departments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin">
            <Button variant="secondary" size="sm">
              ← Admin Overview
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="secondary" size="sm">
              Manage Users
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Interactive Complaints Table ── */}
      <AdminComplaintsTable initialComplaints={complaints} />
    </div>
  );
}
