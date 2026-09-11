// src/app/(auth)/login/page.tsx
// Login page — Server Component
// Handles redirectTo query param and renders the split-panel layout

import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to the Anurag University Complaint Tracking System.",
};

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirectTo } = await searchParams;

  // Sanitize redirect — only allow internal paths
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";

  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel: University Identity ── */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/3 flex-col bg-[#6B1724] text-white p-10 relative overflow-hidden">
        {/* Subtle texture overlay */}
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
            {/*
             * AU Logo Placeholder
             * Replace this div with an <img> tag when the official
             * Anurag University logo SVG/PNG is provided.
             * Target: src="/logo/au-logo.svg" or similar.
             */}
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
                Suryapet, Telangana
              </p>
            </div>
          </div>

          {/* System Identity */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold leading-tight tracking-tight mb-3" style={{ fontFamily: "'Source Serif 4', serif" }}>
              Complaint Tracking System
            </h1>
            <p className="text-white/75 text-sm leading-relaxed max-w-xs">
              The official portal for submitting, tracking, and resolving
              institutional complaints. Accessible to students, faculty, staff,
              and administrators.
            </p>

            {/* Divider */}
            <div className="my-8 h-px w-16 bg-white/25" aria-hidden="true" />

            {/* Coverage */}
            <ul className="flex flex-col gap-2 text-sm text-white/70">
              {[
                "Hostel & Residential",
                "Transport",
                "Classroom & Infrastructure",
                "Laboratory Facilities",
                "Maintenance",
                "Academic Concerns",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-white/40 flex-shrink-0" aria-hidden="true" />
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
              Internal use only. Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8F9FF] px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile-only header */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#6B1724] text-xs font-bold text-white">
              AU
            </div>
            <span className="text-sm font-semibold text-[#0F172A]">
              Anurag University · AU-CTS
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
          <div className="rounded bg-white border border-[#E2E8F0] p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.06),0_1px_2px_-1px_rgba(15,23,42,0.04)]">
            <LoginForm redirectTo={safeRedirect !== "/dashboard" ? safeRedirect : undefined} />
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
