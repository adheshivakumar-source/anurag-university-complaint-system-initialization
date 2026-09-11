// src/app/(auth)/login/page.tsx
// Login page — Server Component
// Handles redirectTo and error query params

import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./LoginForm";
import { UniversityLogo } from "@/components/ui/UniversityLogo";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to the Anurag University Complaint Tracking System.",
};

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirectTo, error } = await searchParams;

  // Sanitize redirect — only allow internal paths
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";

  let initialError: string | undefined;
  if (error === "unauthorized") {
    initialError = "You do not have administrative clearance to access that area.";
  } else if (error === "deactivated") {
    initialError = "This account has been deactivated. Please contact IT support.";
  } else if (error === "session_expired") {
    initialError = "Your session has expired. Please sign in again.";
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel: Campus Photography Identity ── */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/3 flex-col text-white relative overflow-hidden">
        {/* Campus aerial background */}
        <Image
          src="/images/au/campus_aerial.jpg"
          alt="Anurag University campus aerial view"
          fill
          className="object-cover"
          priority
          sizes="40vw"
        />
        {/* Maroon overlay for readability */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(107,23,36,0.82)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo / Institution Mark */}
          <div className="mb-10">
            <UniversityLogo variant="light" size="lg" showSubtitle />
          </div>

          {/* System Identity */}
          <div className="flex-1">
            <h1
              className="text-3xl font-bold leading-tight tracking-tight mb-3"
              style={{ fontFamily: "'Source Serif 4', serif" }}
            >
              Institutional Grievance Portal
            </h1>
            <p className="text-white/75 text-sm leading-relaxed max-w-xs">
              Secure internal grievance tracking and resolution for students,
              faculty, staff, department officers, and administration.
            </p>

            {/* Divider */}
            <div className="my-8 h-px w-16 bg-white/30" aria-hidden="true" />

            {/* Coverage */}
            <ul className="flex flex-col gap-2 text-sm text-white/70">
              {[
                "Hostel & Residential Life",
                "Campus Transportation",
                "Classrooms & Infrastructure",
                "Laboratories & Tech Facilities",
                "Facility Maintenance",
                "Academic Affairs",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[#C9A227] flex-shrink-0"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8 border-t border-white/15">
            <p className="text-xs text-white/50">
              © {new Date().getFullYear()} Anurag University. All rights
              reserved.
              <br />
              Internal use only. Unauthorized access is strictly logged.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile-only header */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <UniversityLogo variant="dark" size="sm" showSubtitle={false} />
            <span className="text-sm font-semibold text-[#0F172A]">
              AU-CTS
            </span>
          </div>

          <div className="mb-8">
            <h2
              className="text-2xl font-bold text-[#0F172A] mb-1"
              style={{ fontFamily: "'Source Serif 4', serif" }}
            >
              Welcome back
            </h2>
            <p className="text-sm text-[#64748B]">
              Sign in with your institutional credentials.
            </p>
          </div>

          {/* Login form card */}
          <div className="rounded-lg bg-white border border-[#E2E8F0] p-6 shadow-sm">
            <LoginForm
              redirectTo={safeRedirect !== "/dashboard" ? safeRedirect : undefined}
              initialError={initialError}
            />
          </div>

          <p className="mt-6 text-center text-xs text-[#94A3B8]">
            This system is for authorized Anurag University personnel only.
            <br />
            Sessions are encrypted and access is logged.
          </p>
        </div>
      </div>
    </div>
  );
}
