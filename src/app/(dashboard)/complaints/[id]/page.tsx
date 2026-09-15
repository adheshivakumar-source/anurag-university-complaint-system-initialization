// src/app/(dashboard)/complaints/[id]/page.tsx
// ============================================================
// Guarded Server Component for Individual Complaint Detail Dossier
// Enforces strict server authorization and renders sanitized audit timeline.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthenticatedUser } from "@/server/auth/authorization";
import {
  getComplaintById,
  getSanitizedComplaintTimeline,
  serializeComplaintToDTO,
  UnauthorizedComplaintAccessError,
} from "@/server/complaints/service";
import { getDepartmentInfo, DEPARTMENT_CONFIGS } from "@/server/complaints/routing";
import { listDepartmentOfficers } from "@/server/users/service";
import {
  CATEGORY_LABELS,
  COMPLAINT_STATUSES,
  USER_ROLES,
  TERMINAL_STATUSES,
  type ComplaintCategory,
  type AttachmentRefDTO,
} from "@/shared/types";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ComplaintTimeline } from "./ComplaintTimeline";
import { ComplaintFeedbackSection } from "./ComplaintFeedbackSection";
import { StartReviewButton } from "./StartReviewButton";
import { ResolveComplaintButton } from "./ResolveComplaintButton";
import { CloseComplaintButton } from "./CloseComplaintButton";
import { ReopenComplaintButton } from "./ReopenComplaintButton";
import { ReassignComplaintButton } from "./ReassignComplaintButton";
import { RejectComplaintButton } from "./RejectComplaintButton";
import { MarkDuplicateButton } from "./MarkDuplicateButton";
import { EscalateComplaintButton } from "./EscalateComplaintButton";
import { AddProgressNoteButton } from "./AddProgressNoteButton";

interface ComplaintDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ComplaintDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Grievance ${id} — AU-CTS`,
  };
}

function formatDetailDate(isoString: string | null): string {
  if (!isoString) return "N/A";
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return isoString;
  }
}

export default async function ComplaintDetailPage({
  params,
}: ComplaintDetailPageProps) {
  const { id } = await params;
  const context = await requireAuthenticatedUser();

  let rawComplaint;
  let timelineEvents;

  try {
    rawComplaint = await getComplaintById(id, context);
    if (!rawComplaint) {
      notFound();
    }
    timelineEvents = await getSanitizedComplaintTimeline(id, context);
  } catch (error: unknown) {
    if (error instanceof UnauthorizedComplaintAccessError) {
      notFound();
    }
    throw error;
  }

  const complaint = serializeComplaintToDTO(rawComplaint);
  const deptInfo = getDepartmentInfo(complaint.departmentId);
  const isSubmitter = context.user.uid === complaint.submittedBy;
  const isAdmin = context.user.role === USER_ROLES.ADMIN;
  const isDeptOfficer =
    context.user.role === USER_ROLES.DEPARTMENT_OFFICER &&
    (context.user.departmentId === complaint.departmentId ||
      context.user.uid === complaint.assignedTo);
  const canStartReview =
    complaint.status === COMPLAINT_STATUSES.PENDING && (isAdmin || isDeptOfficer);
  const canResolve =
    complaint.status === COMPLAINT_STATUSES.IN_REVIEW && (isAdmin || isDeptOfficer);
  const canCloseOrReopen =
    complaint.status === COMPLAINT_STATUSES.RESOLVED && (isSubmitter || isAdmin);

  const canReassignOrTransfer =
    (isAdmin || isDeptOfficer) &&
    !TERMINAL_STATUSES.has(complaint.status) &&
    complaint.status !== COMPLAINT_STATUSES.RESOLVED;

  const canReject =
    (isAdmin || isDeptOfficer) &&
    (complaint.status === COMPLAINT_STATUSES.PENDING ||
      complaint.status === COMPLAINT_STATUSES.IN_REVIEW);

  const canMarkDuplicate =
    (isAdmin || isDeptOfficer) &&
    complaint.status === COMPLAINT_STATUSES.PENDING;

  const canEscalate =
    (isAdmin || isDeptOfficer) &&
    complaint.escalationLevel < 3 &&
    (complaint.status === COMPLAINT_STATUSES.PENDING ||
      complaint.status === COMPLAINT_STATUSES.IN_REVIEW ||
      complaint.status === COMPLAINT_STATUSES.REOPENED);

  const canAddNote =
    (isAdmin || isDeptOfficer) &&
    (complaint.status === COMPLAINT_STATUSES.PENDING ||
      complaint.status === COMPLAINT_STATUSES.IN_REVIEW ||
      complaint.status === COMPLAINT_STATUSES.ESCALATED ||
      complaint.status === COMPLAINT_STATUSES.REOPENED);

  const departmentOfficers = canReassignOrTransfer
    ? await listDepartmentOfficers(complaint.departmentId)
    : [];

  const allDepartments = Object.values(DEPARTMENT_CONFIGS).map((d) => ({
    departmentId: d.departmentId,
    departmentName: d.departmentName,
  }));

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Back navigation & Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/complaints"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B1724] hover:text-[#52111B] transition-colors rounded focus:outline-none focus:ring-1 focus:ring-[#6B1724]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Complaints
          </Link>
          <span className="text-[#CBD5E1]">|</span>
          <span className="font-mono text-sm font-bold text-[#0F172A]">
            {complaint.complaintId}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PriorityBadge priority={complaint.priority} />
          <StatusBadge status={complaint.status} />
          {canStartReview && (
            <StartReviewButton complaintId={complaint.complaintId} />
          )}
          {canResolve && (
            <ResolveComplaintButton complaintId={complaint.complaintId} />
          )}
          {canCloseOrReopen && (
            <>
              <ReopenComplaintButton complaintId={complaint.complaintId} />
              <CloseComplaintButton complaintId={complaint.complaintId} />
            </>
          )}
          {canAddNote && (
            <AddProgressNoteButton complaintId={complaint.complaintId} />
          )}
          {canEscalate && (
            <EscalateComplaintButton
              complaintId={complaint.complaintId}
              currentEscalationLevel={complaint.escalationLevel}
            />
          )}
          {canReassignOrTransfer && (
            <ReassignComplaintButton
              complaintId={complaint.complaintId}
              currentDepartmentId={complaint.departmentId}
              currentAssignedTo={complaint.assignedTo}
              isAdmin={isAdmin}
              departmentOfficers={departmentOfficers}
              allDepartments={allDepartments}
            />
          )}
          {canMarkDuplicate && (
            <MarkDuplicateButton complaintId={complaint.complaintId} />
          )}
          {canReject && (
            <RejectComplaintButton complaintId={complaint.complaintId} />
          )}
        </div>
      </div>


      {/* Main Dossier Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left / Main Column (2/3 width) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Overview & Description Card */}
          <Card>
            <CardHeader className="border-b border-[#F1F5F9] pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#6B1724] uppercase tracking-wider">
                  {CATEGORY_LABELS[complaint.category as ComplaintCategory]}
                </span>
                <span className="text-xs text-[#64748B]">
                  Filed on {formatDetailDate(complaint.submittedAt)}
                </span>
              </div>

              <CardTitle className="text-xl mt-1 text-[#0F172A]">
                {complaint.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
                  Detailed Description
                </h4>
                <p className="text-sm text-[#334155] leading-relaxed whitespace-pre-wrap">
                  {complaint.description}
                </p>
              </div>

              {complaint.location && (
                <div className="border-t border-[#F1F5F9] pt-3">
                  <h4 className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1">
                    Location / Room / Area
                  </h4>
                  <p className="text-sm text-[#0F172A] font-medium">
                    {complaint.location}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolution Details Card (When Resolved/Closed) */}
          {complaint.resolution && (
            <Card className="border-emerald-200 bg-emerald-50/40">
              <CardHeader className="border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2 text-emerald-800">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <CardTitle className="text-base text-emerald-900">
                    Official Resolution Details
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-emerald-950 leading-relaxed whitespace-pre-wrap">
                  {complaint.resolution}
                </p>
                {complaint.resolvedAt && (
                  <p className="mt-3 text-xs text-emerald-700">
                    Resolved on {formatDetailDate(complaint.resolvedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attachments Section */}
          <Card>
            <CardHeader className="border-b border-[#F1F5F9] pb-3">
              <CardTitle className="text-sm">Supporting Attachments</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {complaint.attachments && complaint.attachments.length > 0 ? (
                <ul className="divide-y divide-[#F1F5F9]" role="list">
                  {complaint.attachments.map((att: AttachmentRefDTO, idx: number) => (
                    <li key={idx} className="flex items-center justify-between py-2 text-xs">

                      <div className="flex items-center gap-2 min-w-0">
                        <svg className="h-4 w-4 text-[#64748B] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="font-medium text-[#0F172A] truncate">
                          {att.fileName}
                        </span>
                        <span className="text-[#94A3B8]">
                          ({Math.round(att.fileSize / 1024)} KB)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[#64748B]">
                          {att.mimeType}
                        </span>
                        <a
                          href={`/api/attachments?complaintId=${complaint.complaintId}&file=${encodeURIComponent(att.storagePath)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#6B1724] hover:underline"
                        >
                          <span>View</span>
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#64748B]">
                  No file attachments were included with this grievance.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Post-Resolution Feedback Section */}
          <ComplaintFeedbackSection
            complaint={complaint}
            isSubmitter={isSubmitter}
          />
        </div>

        {/* Right Column / Metadata & Timeline (1/3 width) */}
        <div className="flex flex-col gap-6">
          {/* Department & SLA Information */}
          <Card>
            <CardHeader className="border-b border-[#F1F5F9] pb-3">
              <CardTitle className="text-sm">Department & SLA</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <span className="text-[#64748B] block mb-0.5">Assigned Department</span>
                <span className="font-semibold text-[#0F172A] text-sm">
                  {deptInfo?.departmentName || complaint.departmentId}
                </span>
              </div>

              <div>
                <span className="text-[#64748B] block mb-0.5">Assigned Officer</span>
                <span className="font-medium text-[#0F172A]">
                  {complaint.assignedToName || "Pending Officer Assignment"}
                </span>
              </div>

              <div className="border-t border-[#F1F5F9] pt-2.5">
                <span className="text-[#64748B] block mb-0.5">Provisional SLA Target</span>
                <span className="font-medium text-[#0F172A]">
                  {formatDetailDate(complaint.slaDeadline)}
                </span>
              </div>

              {complaint.escalationLevel > 0 && (
                <div className="rounded bg-[#FFF0F0] p-2 text-[#991B1B] font-medium border border-[#FECDD3]">
                  Escalation Level: {complaint.escalationLevel}
                </div>
              )}

              {isAdmin && (
                <div className="border-t border-[#F1F5F9] pt-2.5 text-[11px] text-[#64748B]">
                  <span className="block font-mono">Submitter UID: {complaint.submittedBy}</span>
                  <span className="block">Submitter Name: {complaint.submittedByName}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Timeline Card */}
          <Card>
            <CardHeader className="border-b border-[#F1F5F9] pb-3">
              <CardTitle className="text-sm">Activity & Audit Timeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ComplaintTimeline events={timelineEvents} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
