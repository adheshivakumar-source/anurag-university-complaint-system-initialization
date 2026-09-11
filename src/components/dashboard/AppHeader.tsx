"use client";
// src/components/dashboard/AppHeader.tsx
// Application top header — displays page context and user actions.
// Client Component (needed for sign-out interaction).

import Link from "next/link";
import { signOutAction } from "@/lib/auth/actions";
import type { SessionUser } from "@/types";
import { ROLE_LABELS } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { UniversityLogo } from "@/components/ui/UniversityLogo";

interface AppHeaderProps {
  user: SessionUser;
}

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between bg-white border-b border-[#E2E8F0] px-6 h-14 flex-shrink-0">
      {/* Skip to main content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-[#6B1724] focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to main content
      </a>

      {/* Left: Mobile branding — official logo on mobile */}
      <div className="flex items-center gap-3 lg:hidden">
        <UniversityLogo variant="dark" size="sm" showSubtitle={false} />
        <span className="text-sm font-semibold text-[#0F172A]">AU-CTS</span>
      </div>

      {/* Right: User actions */}
      <div className="flex items-center gap-4 ml-auto">
        <Link
          href="/profile"
          className="hidden sm:flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-xs text-[#64748B] font-medium">{user.email}</span>
          <Badge
            variant={
              user.role === "admin"
                ? "maroon"
                : user.role === "department_officer"
                ? "in_review"
                : "default"
            }
          >
            {ROLE_LABELS[user.role]}
          </Badge>
        </Link>

        <form action={signOutAction}>
          <Button type="submit" variant="secondary" size="sm">
            Sign Out
          </Button>
        </form>
      </div>
    </header>
  );
}
