// src/app/(dashboard)/layout.tsx
// Protected dashboard layout — wraps all authenticated routes.
// Server Component: verifies session cookie and active user profile via Admin SDK.
// If no valid or active session → redirects to /login.
// Renders the app shell: header + sidebar + main content area.

import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/authorization";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { AppHeader } from "@/components/dashboard/AppHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth: verify session and active status in Server Component
  const context = await getAuthenticatedUser();

  if (!context) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F5F9]">
      {/* Sidebar navigation */}
      <AppSidebar user={context.user} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader user={context.user} />
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
