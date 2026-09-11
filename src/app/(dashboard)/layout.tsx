// src/app/(dashboard)/layout.tsx
// Protected dashboard layout — wraps all authenticated routes.
// Server Component: verifies session cookie with Admin SDK.
// If no valid session → redirects to /login.
// Renders the app shell: header + sidebar + main content area.

import { redirect } from "next/navigation";
import { getVerifiedSession } from "@/lib/auth/session";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { AppHeader } from "@/components/dashboard/AppHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth: verify session in Server Component.
  // Middleware does a lightweight check; this does full Admin SDK verification.
  const session = await getVerifiedSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F5F9]">
      {/* Sidebar navigation */}
      <AppSidebar user={session} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader user={session} />
        <main
          className="flex-1 overflow-y-auto p-6"
          id="main-content"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
