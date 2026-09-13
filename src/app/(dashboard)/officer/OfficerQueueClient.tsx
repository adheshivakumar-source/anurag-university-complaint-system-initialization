// src/app/(dashboard)/officer/OfficerQueueClient.tsx
// ============================================================
// Department Officer Queue Client Interface — AU-CTS
// Interactive queue management for authorized department officers.
// ============================================================

"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  ComplaintDTO,
  ComplaintPriority,
  ComplaintStatus,
} from "@/shared/types";
import {
  CATEGORY_LABELS,
  TERMINAL_STATUSES,
  STATUS_LABELS,
} from "@/shared/types";
import { StatusBadge, PriorityBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { pickupComplaintAction } from "@/server/complaints/actions";

export type QueueTab = "unassigned" | "my_tickets" | "in_review" | "resolved" | "all";

interface OfficerQueueClientProps {
  initialComplaints: ComplaintDTO[];
  departmentId: string;
  departmentName: string;
  currentOfficerUid: string;
  currentOfficerName: string;
}

export interface SlaPresentation {
  label: string;
  variant: "critical" | "high" | "low" | "default";
  isOverdue: boolean;
  hoursRemaining: number | null;
}

export function computeSlaPresentation(
  slaDeadlineStr: string | null | undefined,
  status: ComplaintStatus,
): SlaPresentation {
  if (status === "resolved" || status === "closed") {
    return {
      label: STATUS_LABELS[status] || "Completed",
      variant: "low",
      isOverdue: false,
      hoursRemaining: null,
    };
  }

  if (!slaDeadlineStr) {
    return {
      label: "No SLA Target",
      variant: "default",
      isOverdue: false,
      hoursRemaining: null,
    };
  }

  const deadline = new Date(slaDeadlineStr);
  if (isNaN(deadline.getTime())) {
    return {
      label: "Invalid SLA",
      variant: "default",
      isOverdue: false,
      hoursRemaining: null,
    };
  }

  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 0) {
    const overdueHours = Math.abs(Math.round(diffHours));
    const label =
      overdueHours >= 24
        ? `Overdue (${Math.floor(overdueHours / 24)}d)`
        : `Overdue (${overdueHours}h)`;
    return {
      label,
      variant: "critical",
      isOverdue: true,
      hoursRemaining: diffHours,
    };
  }

  if (diffHours <= 4) {
    const rounded = Math.max(1, Math.round(diffHours));
    return {
      label: `Due Soon (~${rounded}h)`,
      variant: "high",
      isOverdue: false,
      hoursRemaining: diffHours,
    };
  }

  if (diffHours < 24) {
    return {
      label: `On Track (~${Math.round(diffHours)}h)`,
      variant: "low",
      isOverdue: false,
      hoursRemaining: diffHours,
    };
  }

  const days = Math.round(diffHours / 24);
  return {
    label: `On Track (~${days}d)`,
    variant: "low",
    isOverdue: false,
    hoursRemaining: diffHours,
  };
}

function formatDate(isoString: string | null | undefined): string {
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

const PRIORITY_WEIGHTS: Record<ComplaintPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function OfficerQueueClient({
  initialComplaints,
  departmentId,
  departmentName,
  currentOfficerUid,
  currentOfficerName,
}: OfficerQueueClientProps) {
  const router = useRouter();
  const [complaints, setComplaints] = useState<ComplaintDTO[]>(initialComplaints);
  const [activeTab, setActiveTab] = useState<QueueTab>("unassigned");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [pickingUpId, setPickingUpId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // ── Tab Partitioning & Badges ───────────────────────────────
  const tabCounts = useMemo(() => {
    let unassigned = 0;
    let myTickets = 0;
    let inReview = 0;
    let resolved = 0;

    for (const c of complaints) {
      if (c.assignedTo === null && !TERMINAL_STATUSES.has(c.status)) {
        unassigned++;
      }
      if (c.assignedTo === currentOfficerUid) {
        myTickets++;
      }
      if (c.status === "in_review") {
        inReview++;
      }
      if (c.status === "resolved" || c.status === "closed") {
        resolved++;
      }
    }

    return {
      unassigned,
      my_tickets: myTickets,
      in_review: inReview,
      resolved,
      all: complaints.length,
    };
  }, [complaints, currentOfficerUid]);

  // ── Tab + Search + Priority Filtering ─────────────────────────
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // 1. Tab filter
      if (activeTab === "unassigned") {
        if (c.assignedTo !== null || TERMINAL_STATUSES.has(c.status)) return false;
      } else if (activeTab === "my_tickets") {
        if (c.assignedTo !== currentOfficerUid) return false;
      } else if (activeTab === "in_review") {
        if (c.status !== "in_review") return false;
      } else if (activeTab === "resolved") {
        if (c.status !== "resolved" && c.status !== "closed") return false;
      }

      // 2. Priority filter
      if (priorityFilter !== "all" && c.priority !== priorityFilter) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const idMatch = c.complaintId.toLowerCase().includes(query);
        const titleMatch = c.title.toLowerCase().includes(query);
        const catMatch = (CATEGORY_LABELS[c.category] || c.category)
          .toLowerCase()
          .includes(query);
        const locMatch = c.location ? c.location.toLowerCase().includes(query) : false;
        if (!idMatch && !titleMatch && !catMatch && !locMatch) {
          return false;
        }
      }

      return true;
    });
  }, [complaints, activeTab, priorityFilter, searchQuery, currentOfficerUid]);

  // ── Operational Urgency Sorting ──────────────────────────────
  const sortedComplaints = useMemo(() => {
    return [...filteredComplaints].sort((a, b) => {
      const aSla = computeSlaPresentation(a.slaDeadline, a.status);
      const bSla = computeSlaPresentation(b.slaDeadline, b.status);

      // 1. Overdue active tickets first
      if (aSla.isOverdue && !bSla.isOverdue) return -1;
      if (!aSla.isOverdue && bSla.isOverdue) return 1;

      // 2. Priority weight (critical > high > medium > low)
      const pDiff = (PRIORITY_WEIGHTS[b.priority] || 0) - (PRIORITY_WEIGHTS[a.priority] || 0);
      if (pDiff !== 0) return pDiff;

      // 3. Creation date (newest first)
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
  }, [filteredComplaints]);

  // ── Self-Assignment / Pickup Handler ─────────────────────────
  async function handlePickup(complaintId: string) {
    setActionError(null);
    setActionSuccess(null);
    setPickingUpId(complaintId);

    try {
      const res = await pickupComplaintAction(complaintId);
      if (!res.success) {
        setActionError(res.error || "Failed to pick up ticket.");
        setPickingUpId(null);
        return;
      }

      // Optimistic update local list
      setComplaints((prev) =>
        prev.map((c) =>
          c.complaintId === complaintId
            ? {
                ...c,
                assignedTo: currentOfficerUid,
                assignedToName: currentOfficerName,
                assignedAt: new Date().toISOString(),
                status: c.status === "submitted" ? "pending" : c.status,
              }
            : c,
        ),
      );

      setActionSuccess(`Successfully assigned ${complaintId} to yourself.`);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to pick up ticket.";
      setActionError(message);
    } finally {
      setPickingUpId(null);
    }
  }

  const tabs: { id: QueueTab; label: string; count: number }[] = [
    { id: "unassigned", label: "Unassigned", count: tabCounts.unassigned },
    { id: "my_tickets", label: "My Tickets", count: tabCounts.my_tickets },
    { id: "in_review", label: "In Review", count: tabCounts.in_review },
    { id: "resolved", label: "Resolved / Closed", count: tabCounts.resolved },
    { id: "all", label: "All Department", count: tabCounts.all },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <h1
            className="text-2xl font-bold text-[#0F172A]"
            style={{ fontFamily: "'Source Serif 4', serif" }}
          >
            Department Queue — {departmentName}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Logged in as <span className="font-semibold text-[#0F172A]">{currentOfficerName}</span> (Dept: {departmentId})
          </p>
        </div>
      </div>

      {/* Action Notices */}
      {actionError && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-md border border-[#FECDD3] bg-[#FFF0F0] p-4 text-sm text-[#991B1B]"
        >
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-xs font-bold text-[#991B1B] hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionSuccess && (
        <div
          role="status"
          className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 flex-shrink-0 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-xs font-bold text-emerald-800 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Triage Tabs */}
      <div className="border-b border-[#CBD5E1]">
        <nav className="-mb-px flex space-x-2 sm:space-x-6 overflow-x-auto" aria-label="Queue tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setActionError(null);
                  setActionSuccess(null);
                }}
                className={`flex whitespace-nowrap items-center gap-2 border-b-2 py-3 px-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-[#6B1724] text-[#6B1724] font-semibold"
                    : "border-transparent text-[#64748B] hover:border-[#94A3B8] hover:text-[#0F172A]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    isActive
                      ? "bg-[#6B1724] text-white"
                      : "bg-[#E2E8F0] text-[#475569]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search and Priority Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md">
          <Input
            id="queue-search"
            type="text"
            placeholder="Search by ID, title, category, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="priority-filter" className="text-xs font-semibold text-[#475569] whitespace-nowrap">
            Priority:
          </label>
          <div className="w-36">
            <Select
              id="priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: "all", label: "All Priorities" },
                { value: "critical", label: "Critical" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Main Queue Content */}
      {sortedComplaints.length === 0 ? (
        <Card className="border border-[#CBD5E1] bg-white">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1E40AF] mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-[#0F172A]">
              {complaints.length === 0
                ? "No Grievances in Department Queue"
                : searchQuery || priorityFilter !== "all"
                ? "No Grievances Match Your Search Filters"
                : activeTab === "unassigned"
                ? "No Unassigned Grievances in Queue"
                : activeTab === "my_tickets"
                ? "You Have No Assigned Grievances"
                : `No Grievances in '${tabs.find((t) => t.id === activeTab)?.label}'`}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-[#64748B]">
              {complaints.length === 0
                ? "Grievances routed to your department will appear here automatically."
                : searchQuery || priorityFilter !== "all"
                ? "Try clearing your search query or changing the priority filter."
                : "Great job! All department grievances in this queue category are handled."}
            </p>
            {(searchQuery || priorityFilter !== "all") && (
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setPriorityFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table Presentation */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-[#CBD5E1] bg-white shadow-sm">
            <table className="min-w-full divide-y divide-[#E2E8F0]">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-[#475569] uppercase tracking-wider">
                    Tracking ID & Title
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-[#475569] uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-[#475569] uppercase tracking-wider">
                    Priority & Status
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-[#475569] uppercase tracking-wider">
                    SLA Urgency
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-[#475569] uppercase tracking-wider">
                    Assigned Officer
                  </th>
                  <th scope="col" className="py-3.5 pl-3 pr-4 text-right text-xs font-semibold text-[#475569] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {sortedComplaints.map((c) => {
                  const sla = computeSlaPresentation(c.slaDeadline, c.status);
                  const isUnassigned = c.assignedTo === null && !TERMINAL_STATUSES.has(c.status);
                  const isPickingUp = pickingUpId === c.complaintId;

                  return (
                    <tr key={c.complaintId} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-4 pl-4 pr-3 text-sm min-w-0 max-w-xs">
                        <div className="font-mono text-xs font-bold text-[#6B1724]">
                          {c.complaintId}
                        </div>
                        <div className="font-semibold text-[#0F172A] truncate mt-0.5" title={c.title}>
                          {c.title}
                        </div>
                        {c.location && (
                          <div className="text-xs text-[#64748B] truncate mt-0.5">
                            📍 {c.location}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-xs font-medium text-[#334155]">
                        {CATEGORY_LABELS[c.category] || c.category}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-xs">
                        <div className="flex flex-col gap-1 items-start">
                          <PriorityBadge priority={c.priority} />
                          <StatusBadge status={c.status} />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-xs">
                        <Badge variant={sla.variant}>
                          {sla.label}
                        </Badge>
                        <div className="text-[11px] text-[#64748B] mt-1">
                          Deadline: {formatDate(c.slaDeadline)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-xs">
                        {c.assignedToName ? (
                          <span className="font-medium text-[#0F172A]">
                            {c.assignedToName}
                            {c.assignedTo === currentOfficerUid && (
                              <span className="ml-1 text-[11px] text-[#6B1724] font-semibold">(You)</span>
                            )}
                          </span>
                        ) : (
                          <span className="italic text-[#94A3B8]">Unassigned</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-xs">
                        <div className="flex items-center justify-end gap-2">
                          {isUnassigned && (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={isPickingUp}
                              onClick={() => handlePickup(c.complaintId)}
                              aria-label={`Assign ${c.complaintId} to me`}
                            >
                              {isPickingUp ? "Assigning..." : "Assign to Me"}
                            </Button>
                          )}
                          <Link href={`/complaints/${c.complaintId}`}>
                            <Button variant="ghost" size="sm">
                              View →
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards Presentation */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {sortedComplaints.map((c) => {
              const sla = computeSlaPresentation(c.slaDeadline, c.status);
              const isUnassigned = c.assignedTo === null && !TERMINAL_STATUSES.has(c.status);
              const isPickingUp = pickingUpId === c.complaintId;

              return (
                <Card key={c.complaintId} className="border border-[#CBD5E1] p-4">
                  <div className="flex items-center justify-between gap-2 border-b border-[#F1F5F9] pb-2">
                    <span className="font-mono text-xs font-bold text-[#6B1724]">
                      {c.complaintId}
                    </span>
                    <Badge variant={sla.variant}>
                      {sla.label}
                    </Badge>
                  </div>

                  <div className="mt-2.5">
                    <h4 className="text-sm font-bold text-[#0F172A] line-clamp-2">
                      {c.title}
                    </h4>
                    {c.location && (
                      <p className="text-xs text-[#64748B] mt-0.5">
                        📍 {c.location}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                    <span className="text-xs text-[#475569] font-medium ml-auto">
                      {CATEGORY_LABELS[c.category] || c.category}
                    </span>
                  </div>

                  <div className="mt-3 border-t border-[#F1F5F9] pt-2.5 flex items-center justify-between text-xs text-[#64748B]">
                    <span>
                      Assignee:{" "}
                      <strong className="text-[#0F172A]">
                        {c.assignedToName || "Unassigned"}
                      </strong>
                    </span>
                    <span>{formatDate(c.submittedAt)}</span>
                  </div>

                  <div className="mt-3.5 flex items-center justify-end gap-2 border-t border-[#F1F5F9] pt-3">
                    {isUnassigned && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isPickingUp}
                        onClick={() => handlePickup(c.complaintId)}
                        className="flex-1"
                      >
                        {isPickingUp ? "Assigning..." : "Assign to Me"}
                      </Button>
                    )}
                    <Link href={`/complaints/${c.complaintId}`} className={isUnassigned ? "" : "w-full"}>
                      <Button variant="primary" size="sm" className="w-full">
                        View Details →
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
