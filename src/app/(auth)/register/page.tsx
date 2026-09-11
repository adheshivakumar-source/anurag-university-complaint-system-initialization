// src/app/(auth)/register/page.tsx
// Registration page — Server Component
// Provides institutional onboarding with role selection

import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Register Account",
  description:
    "Register for an Anurag University Complaint Tracking System account.",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel: University Identity ── */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/3 flex-col bg-[#6B1724] text-white p-10 relative overflow-hidden">
        {/* Institutional Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo / Institution Mark */}
          <div className="flex items-center gap-3 mb-10">
            <div
              className="flex h-12 w-12 items-center justify-center rounded border-2 border-white/30 bg-white/10 text-lg font-bold tracking-tight"
              aria-label="Anurag University logo placeholder"
            >
              AU
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
                Anurag University
              </p>
              <p className="text-sm font-semibold text-white">
                Institutional Onboarding
              </p>
            </div>
          </div>

          {/* Registration Information */}
          <div className="flex-1">
            <h1
              className="text-3xl font-bold leading-tight tracking-tight mb-3"
              style={{ fontFamily: "'Source Serif 4', serif" }}
            >
              Create Account
            </h1>
            <p className="text-white/75 text-sm leading-relaxed max-w-xs">
              Students, faculty members, and administrative staff can register
              to file and monitor university grievances.
            </p>

            <div className="my-8 h-px w-16 bg-white/25" aria-hidden="true" />

            <div className="flex flex-col gap-4 text-xs text-white/80">
              <div className="rounded bg-white/10 p-3 border border-white/15">
                <p className="font-semibold text-white mb-1">
                  🎓 Role Access Policies:
                </p>
                <p className="leading-relaxed">
                  Department Officer and Administrator privileges cannot be
                  self-assigned and require approval from the University IT Dean.
                </p>
              </div>

              <p className="leading-relaxed">
                By registering, you agree to comply with Anurag University IT
                governance and digital conduct policies.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8 border-t border-white/15">
            <p className="text-xs text-white/50">
              © {new Date().getFullYear()} Anurag University. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Registration Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8F9FF] px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#6B1724] text-xs font-bold text-white">
              AU
            </div>
            <span className="text-sm font-semibold text-[#0F172A]">
              Anurag University · AU-CTS
            </span>
          </div>

          <div className="mb-6">
            <h2
              className="text-2xl font-bold text-[#0F172A] mb-1"
              style={{ fontFamily: "'Source Serif 4', serif" }}
            >
              Institutional Registration
            </h2>
            <p className="text-sm text-[#64748B]">
              Enter your official details to establish your university account.
            </p>
          </div>

          {/* Registration Card */}
          <div className="rounded bg-white border border-[#E2E8F0] p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.06),0_1px_2px_-1px_rgba(15,23,42,0.04)]">
            <RegisterForm />
          </div>

          <div className="mt-6 text-center text-xs text-[#94A3B8]">
            Need assistance? Contact the{" "}
            <Link
              href="mailto:itsupport@anurag.edu.in"
              className="text-[#6B1724] hover:underline"
            >
              AU IT Helpdesk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
