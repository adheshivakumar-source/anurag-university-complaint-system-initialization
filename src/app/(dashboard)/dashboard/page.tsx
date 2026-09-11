// src/app/(dashboard)/dashboard/page.tsx
// Main dashboard page — placeholder for Phase 2+
// Shows a role-aware welcome message in the meantime.

import type { Metadata } from "next";
import { getVerifiedSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getVerifiedSession();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1
          className="text-2xl font-bold text-[#0F172A]"
          style={{ fontFamily: "'Source Serif 4', serif" }}
        >
          Dashboard
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Welcome back, {session.displayName}. Here&apos;s your overview.
        </p>
      </div>

      {/* Phase 1 placeholder — replaced in Phase 3+ */}
      <div className="rounded border border-[#CBD5E1] bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0F0]">
          <svg
            className="h-6 w-6 text-[#6B1724]"
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
        <h2 className="text-base font-semibold text-[#0F172A] mb-2">
          Complaint Tracking Dashboard
        </h2>
        <p className="text-sm text-[#64748B] max-w-sm mx-auto">
          The complaint management features are being built. You are logged in
          as <strong>{session.role}</strong>.
        </p>
        <p className="text-xs text-[#94A3B8] mt-4">
          Phase 1 Foundation — Complaint features arrive in Phase 3.
        </p>
      </div>
    </div>
  );
}
