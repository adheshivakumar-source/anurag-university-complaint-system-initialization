// src/app/(dashboard)/officer/layout.tsx
// Department Officer Layout — Enforces officer or admin authorization.

import { requireAnyRole } from "@/lib/auth/authorization";
import { USER_ROLES } from "@/types";

export default async function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAnyRole([USER_ROLES.DEPARTMENT_OFFICER, USER_ROLES.ADMIN]);
  return <div className="flex flex-col gap-6">{children}</div>;
}
