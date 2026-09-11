// src/app/(dashboard)/admin/layout.tsx
// Administrator Layout — Enforces strict admin role check server-side.
// Non-admins attempting to access any /admin/* route are redirected.

import { requireAdmin } from "@/lib/auth/authorization";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce server-side administrator authorization
  await requireAdmin();

  return <div className="flex flex-col gap-6">{children}</div>;
}
