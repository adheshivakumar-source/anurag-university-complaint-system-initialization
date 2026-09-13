// src/app/(dashboard)/officer/page.tsx
// ============================================================
// Live Department Officer Grievance Queue — AU-CTS
// Guarded Server Component scoped to the officer's authorized department.
// ============================================================

import type { Metadata } from "next";
import { requireDepartmentOfficer } from "@/server/auth/authorization";
import {
  listDepartmentComplaints,
  serializeComplaintToDTO,
} from "@/server/complaints/service";
import { getDepartmentInfo } from "@/server/complaints/routing";
import { OfficerQueueClient } from "./OfficerQueueClient";

export const metadata: Metadata = {
  title: "Department Grievance Queue — AU-CTS",
};

export default async function OfficerDashboardPage() {
  const context = await requireDepartmentOfficer();
  const departmentId = context.profile.departmentId || "dept-general";
  const deptInfo = getDepartmentInfo(departmentId);
  const departmentName = deptInfo?.departmentName || departmentId.replace("dept-", "").toUpperCase();

  // Load real complaints scoped to the officer's authorized department
  const rawComplaints = await listDepartmentComplaints(departmentId, 100);
  const complaints = rawComplaints.map(serializeComplaintToDTO);

  return (
    <OfficerQueueClient
      initialComplaints={complaints}
      departmentId={departmentId}
      departmentName={departmentName}
      currentOfficerUid={context.profile.uid}
      currentOfficerName={context.profile.displayName}
    />
  );
}
