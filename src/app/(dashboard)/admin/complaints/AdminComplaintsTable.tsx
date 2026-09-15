"use client";
// src/app/(dashboard)/admin/complaints/AdminComplaintsTable.tsx
// ============================================================
// Institutional Grievance Directory Table — AU-CTS
// Interactive client component providing real-time cross-department
// multi-attribute filtering, search, sorting, and dossier navigation.
// ============================================================

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ComplaintDTO, ComplaintCategory, ComplaintStatus, ComplaintPriority } from "@/shared/types";
import {
  COMPLAINT_CATEGORIES,
  CATEGORY_LABELS,
  COMPLAINT_STATUSES,
  STATUS_LABELS,
  COMPLAINT_PRIORITIES,
  PRIORITY_LABELS,
} from "@/shared/types";
import { DEPARTMENT_CONFIGS } from "@/server/complaints/routing";
import { StatusBadge, PriorityBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface AdminComplaintsTableProps {
  initialComplaints: ComplaintDTO[];
}

interface SlaPresentation {
  label: string;
  variant: "critical" | "high" | "low" | "default";
}

function computeSlaPresentation(
  slaDeadlineStr: string | null | undefined,
  status: ComplaintStatus,
): SlaPresentation {
  if (status === "resolved" || status === "closed") {
    return {
      label: STATUS_LABELS[status] || "Completed",
      variant: "low",
    };
  }

  if (!slaDeadlineStr) {
    return {
      label: "No SLA Target",
      variant: "default",
    };
  }

  const deadline = new Date(slaDeadlineStr);
  if (isNaN(deadline.getTime())) {
    return {
      label: "Invalid SLA",
      variant: "default",
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
    };
  }

  if (diffHours <= 4) {
    const rounded = Math.max(1, Math.round(diffHours));
    return {
      label: `Due Soon (~${rounded}h)`,
      variant: "high",
    };
  }

  if (diffHours < 24) {
    return {
      label: `On Track (~${Math.round(diffHours)}h)`,
      variant: "low",
    };
  }

  const days = Math.round(diffHours / 24);
  return {
    label: `On Track (~${days}d)`,
    variant: "low",
  };
}

function formatAdminTableDate(isoString: string): string {
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

export function AdminComplaintsTable({
  initialComplaints,
}: AdminComplaintsTableProps) {
  const [complaints] = useState<ComplaintDTO[]>(initialComplaints);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  // Multi-dimensional in-memory filtering & sorting
  const filteredComplaints = useMemo(() => {
    return complaints
      .filter((item) => {
        // Substring search on ID, Title, or Submitter Name
        if (searchQuery.trim()) {
          const query = searchQuery.trim().toLowerCase();
          const matchesId = item.complaintId.toLowerCase().includes(query);
          const matchesTitle = item.title.toLowerCase().includes(query);
          const matchesSubmitter = item.submittedByName
            ? item.submittedByName.toLowerCase().includes(query)
            : false;
          if (!matchesId && !matchesTitle && !matchesSubmitter) {
            return false;
          }
        }

        // Department filter
        if (departmentFilter !== "ALL" && item.departmentId !== departmentFilter) {
          return false;
        }

        // Status filter
        if (statusFilter !== "ALL" && item.status !== statusFilter) {
          return false;
        }

        // Priority filter
        if (priorityFilter !== "ALL" && item.priority !== priorityFilter) {
          return false;
        }

        // Category filter
        if (categoryFilter !== "ALL" && item.category !== categoryFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.submittedAt).getTime();
        const timeB = new Date(b.submittedAt).getTime();
        return sortBy === "newest" ? timeB - timeA : timeA - timeB;
      });
  }, [
    complaints,
    searchQuery,
    departmentFilter,
    statusFilter,
    priorityFilter,
    categoryFilter,
    sortBy,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    departmentFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    sortBy !== "newest";

  const handleResetFilters = () => {
    setSearchQuery("");
    setDepartmentFilter("ALL");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setCategoryFilter("ALL");
    setSortBy("newest");
  };

  const departmentList = useMemo(() => {
    return Object.values(DEPARTMENT_CONFIGS);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* ── Filter Controls Bar ── */}
      <div className="bg-white p-4 rounded border border-[#CBD5E1] shadow-sm flex flex-col gap-3">
        {/* Top search & quick count */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by ticket ID, title, or submitter name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-[#CBD5E1] bg-white px-3 py-1.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:outline-none focus-visible:border-[#6B1724]"
              aria-label="Search complaints"
            />
          </div>

          <div className="flex items-center gap-2 justify-between sm:justify-end">
            <span className="text-xs font-semibold text-[#64748B]">
              Showing <strong className="text-[#0F172A]">{filteredComplaints.length}</strong> of {complaints.length} Grievances
            </span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-[#6B1724]"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-[#F1F5F9]">
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-xs text-[#0F172A] focus-visible:outline-none focus-visible:border-[#6B1724]"
            aria-label="Filter by department"
          >
            <option value="ALL">All Departments</option>
            {departmentList.map((dept) => (
              <option key={dept.departmentId} value={dept.departmentId}>
                {dept.departmentName}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-xs text-[#0F172A] focus-visible:outline-none focus-visible:border-[#6B1724]"
            aria-label="Filter by status"
          >
            <option value="ALL">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([statusKey, label]) => (
              <option key={statusKey} value={statusKey}>
                {label}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-xs text-[#0F172A] focus-visible:outline-none focus-visible:border-[#6B1724]"
            aria-label="Filter by priority"
          >
            <option value="ALL">All Priorities</option>
            {Object.entries(PRIORITY_LABELS).map(([prioKey, label]) => (
              <option key={prioKey} value={prioKey}>
                {label}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-xs text-[#0F172A] focus-visible:outline-none focus-visible:border-[#6B1724]"
            aria-label="Filter by category"
          >
            <option value="ALL">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
              <option key={catKey} value={catKey}>
                {label}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
            className="rounded border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-xs text-[#0F172A] focus-visible:outline-none focus-visible:border-[#6B1724]"
            aria-label="Sort order"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
          </select>
        </div>
      </div>

      {/* ── Grievances Table ── */}
      <div className="overflow-x-auto rounded border border-[#CBD5E1] bg-white shadow-sm">
        <table className="w-full text-left text-sm text-[#334155]">
          <thead className="bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#475569] border-b border-[#E2E8F0]">
            <tr>
              <th scope="col" className="px-4 py-3">
                Ticket ID
              </th>
              <th scope="col" className="px-4 py-3">
                Grievance Title & Submitter
              </th>
              <th scope="col" className="px-4 py-3">
                Department & Category
              </th>
              <th scope="col" className="px-3 py-3">
                Priority
              </th>
              <th scope="col" className="px-3 py-3">
                Status
              </th>
              <th scope="col" className="px-3 py-3">
                SLA Urgency
              </th>
              <th scope="col" className="px-4 py-3">
                Submitted
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filteredComplaints.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-12 text-center text-sm text-[#64748B]"
                >
                  <p className="font-semibold text-[#0F172A]">
                    No institutional grievances match the selected filters.
                  </p>
                  <p className="text-xs text-[#64748B] mt-1">
                    Try adjusting your search criteria or resetting filters.
                  </p>
                  {hasActiveFilters && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleResetFilters}
                      className="mt-3"
                    >
                      Reset All Filters
                    </Button>
                  )}
                </td>
              </tr>
            ) : (
              filteredComplaints.map((complaint) => {
                const deptConfig = DEPARTMENT_CONFIGS[complaint.category];
                const deptName =
                  deptConfig?.departmentName || complaint.departmentId || "General";
                const sla = computeSlaPresentation(
                  complaint.slaDeadline,
                  complaint.status,
                );

                return (
                  <tr
                    key={complaint.complaintId}
                    className="hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-bold text-[#0F172A] whitespace-nowrap">
                      {complaint.complaintId}
                    </td>

                    <td className="px-4 py-3 min-w-[220px]">
                      <p className="font-semibold text-[#0F172A] line-clamp-1">
                        {complaint.title}
                      </p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        By: <span className="font-medium text-[#334155]">{complaint.submittedByName}</span>
                      </p>
                    </td>

                    <td className="px-4 py-3 min-w-[180px]">
                      <p className="text-xs font-medium text-[#0F172A] truncate">
                        {deptName}
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        {CATEGORY_LABELS[complaint.category]}
                      </p>
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      <PriorityBadge priority={complaint.priority} />
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      <StatusBadge status={complaint.status} />
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      <Badge variant={sla.variant}>{sla.label}</Badge>
                    </td>

                    <td className="px-4 py-3 text-xs text-[#64748B] whitespace-nowrap">
                      {formatAdminTableDate(complaint.submittedAt)}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link href={`/complaints/${complaint.complaintId}`}>
                        <Button variant="secondary" size="sm">
                          Dossier →
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
