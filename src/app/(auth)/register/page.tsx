// src/app/(auth)/register/page.tsx
// Registration page — Server Component
// Provides institutional onboarding with role selection

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RegisterForm } from "./RegisterForm";
import { UniversityLogo } from "@/components/ui/UniversityLogo";

export const metadata: Metadata = {
  title: "Register Account",
  description:
    "Register for an Anurag University Complaint Tracking System account.",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel: Campus Photography Identity ── */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/3 flex-col text-white relative overflow-hidden">
        {/* Campus aerial background — same treatment as login for cohesion */}
        <Image
          src="/images/au/campus_aerial.jpg"
          alt="Anurag University campus aerial view"
          fill
          className="object-cover object-center"
          priority
          sizes="40vw"
        />
        {/* Maroon overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(107,23,36,0.82)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <div className="mb-10">
            <UniversityLogo variant="light" size="lg" showSubtitle />
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

            <div className="my-8 h-px w-16 bg-white/30" aria-hidden="true" />

            <div className="flex flex-col gap-4 text-xs text-white/80">
              <div className="rounded-lg bg-white/10 p-3 border border-white/15">
                <p className="font-semibold text-white mb-1">
                  Role Access Policies
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
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <UniversityLogo variant="dark" size="sm" showSubtitle={false} />
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
          <div className="rounded-lg bg-white border border-[#E2E8F0] p-6 shadow-sm">
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
