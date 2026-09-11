// src/app/page.tsx
// Root page — redirects to /dashboard (authenticated) or /login (unauthenticated)
// The middleware handles the actual routing decision.

import { redirect } from "next/navigation";

export default function RootPage() {
  // Middleware will have already redirected unauthenticated users to /login.
  // If we reach this page, the user is authenticated → send to dashboard.
  redirect("/dashboard");
}
