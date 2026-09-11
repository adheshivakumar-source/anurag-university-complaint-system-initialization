"use client";
// src/components/dashboard/AppHeader.tsx
// Application top header — displays page context and user actions.
// Client Component (needed for sign-out interaction).

import { signOutAction } from "@/lib/auth/actions";
import type { SessionUser } from "@/types";
import { Button } from "@/components/ui/Button";

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

      {/* Left: Mobile menu button (placeholder for Phase 8 mobile nav) */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-[#6B1724] text-xs font-bold text-white">
          AU
        </div>
        <span className="text-sm font-semibold text-[#0F172A]">AU-CTS</span>
      </div>

      {/* Right: User actions */}
      <div className="flex items-center gap-3 ml-auto">
        <span className="hidden sm:block text-sm text-[#64748B]">
          {user.email}
        </span>
        <form action={signOutAction}>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
          >
            Sign Out
          </Button>
        </form>
      </div>
    </header>
  );
}
