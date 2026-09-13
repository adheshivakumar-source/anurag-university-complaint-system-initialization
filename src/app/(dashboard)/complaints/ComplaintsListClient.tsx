// src/app/(dashboard)/complaints/ComplaintsListClient.tsx
// ============================================================
// Interactive Client Component for User Complaint Portal
// Instant search and filtering over the authenticated user's loaded grievances.
// ============================================================

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ComplaintDTO } from "@/types";
import {
  COMPLAINT_CATEGORIES,
  CATEGORY_LABELS,
  COMPLAINT_STATUSES,
  STATUS_LABELS,
  type ComplaintCategory,
  type ComplaintStatus,
} from "@/types";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { getDepartmentInfo } from "@/lib/complaints/routing";

interface ComplaintsListClientProps {
  complaints: ComplaintDTO[];
}

function formatDate(isoString: string): string {
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

export function ComplaintsListClient({ complaints }: ComplaintsListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  // Instant client-side filtering and sorting
  const filteredComplaints = useMemo(() => {
    return complaints
      .filter((item) => {
        // Search query filter (matches Ticket ID or Title)
        if (searchQuery.trim()) {
          const query = searchQuery.trim().toLowerCase();
          const matchesId = item.complaintId.toLowerCase().includes(query);
          const matchesTitle = item.title.toLowerCase().includes(query);
          if (!matchesId && !matchesTitle) return false;
        }

        // Status filter
        if (statusFilter !== "all" && item.status !== statusFilter) {
          return false;
        }

        // Category filter
        if (categoryFilter !== "all" && item.category !== categoryFilter) {
          return false;
        }

        // Priority filter
        if (priorityFilter !== "all" && item.priority !== priorityFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.submittedAt).getTime();
        const timeB = new Date(b.submittedAt).getTime();
        return sortBy === "newest" ? timeB - timeA : timeA - timeB;
      });
  }, [complaints, searchQuery, statusFilter, categoryFilter, priorityFilter, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    priorityFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setPriorityFilter("all");
    setSortBy("newest");
  };

  // Case 1: Authentic Empty State when the user has filed zero grievances
  if (complaints.length === 0) {
    return (
      <Card className="border border-dashed border-[#CBD5E1] bg-white">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF0F0] text-[#6B1724] mb-4">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3
            className="text-lg font-bold text-[#0F172A]"
            style={{ fontFamily: "'Source Serif 4', serif" }}
          >
            No Grievances Filed Yet
          </h3>
          <p className="mt-2 max-w-md text-sm text-[#64748B]">
            You have not submitted any complaints. When you submit a grievance regarding hostel,
            transport, academics, labs, or campus facilities, it will appear here with live status
            updates and tracking.
          </p>
          <div className="mt-6">
            <Link href="/complaints/new">
              <Button variant="primary" size="md">
                + File a Grievance
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search and Filters Bar */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <label
              htmlFor="complaints-search"
              className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1"
            >
              Search Grievances
            </label>
            <div className="relative">
              <input
                id="complaints-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Ticket ID (CTS-...) or title..."
                className="w-full rounded-md border border-[#CBD5E1] bg-[#F8FAFC] py-2 pl-9 pr-3 text-sm text-[#0F172A] placeholder-[#94A3B8] transition-colors focus:border-[#6B1724] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#6B1724]"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#94A3B8]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label
              htmlFor="status-filter"
              className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1"
            >
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border border-[#CBD5E1] bg-[#F8FAFC] py-2 px-3 text-sm text-[#0F172A] transition-colors focus:border-[#6B1724] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#6B1724]"
            >
              <option value="all">All Statuses</option>
              {Object.entries(COMPLAINT_STATUSES).map(([key, val]) => (
                <option key={key} value={val}>
                  {STATUS_LABELS[val as ComplaintStatus]}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label
              htmlFor="category-filter"
              className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1"
            >
              Category
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-md border border-[#CBD5E1] bg-[#F8FAFC] py-2 px-3 text-sm text-[#0F172A] transition-colors focus:border-[#6B1724] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#6B1724]"
            >
              <option value="all">All Categories</option>
              {Object.entries(COMPLAINT_CATEGORIES).map(([key, val]) => (
                <option key={key} value={val}>
                  {CATEGORY_LABELS[val as ComplaintCategory]}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label
              htmlFor="sort-order"
              className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1"
            >
              Sort By
            </label>
            <select
              id="sort-order"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
              className="w-full rounded-md border border-[#CBD5E1] bg-[#F8FAFC] py-2 px-3 text-sm text-[#0F172A] transition-colors focus:border-[#6B1724] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#6B1724]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Reset Action */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#F1F5F9] pt-3 text-xs text-[#64748B]">
          <div>
            Showing <strong className="text-[#0F172A]">{filteredComplaints.length}</strong> of{" "}
            <strong className="text-[#0F172A]">{complaints.length}</strong> grievances
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="font-medium text-[#6B1724] hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Case 2: Filter yielded zero matches */}
      {filteredComplaints.length === 0 ? (
        <Card className="border border-[#E2E8F0] bg-white">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <svg
              className="h-10 w-10 text-[#94A3B8] mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h4 className="text-base font-semibold text-[#0F172A]">No matching grievances found</h4>
            <p className="mt-1 text-sm text-[#64748B]">
              No complaints match your search query or filter criteria.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E2E8F0] text-left text-sm" role="table">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">
                      Ticket ID
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-xs font-semibold text-[#475569] uppercase tracking-wider">
                      Title & Department
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-xs font-semibold text-[#475569] uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-xs font-semibold text-[#475569] uppercase tracking-wider">
                      Priority
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-xs font-semibold text-[#475569] uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-xs font-semibold text-[#475569] uppercase tracking-wider">
                      Submitted
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] bg-white">
                  {filteredComplaints.map((item) => {
                    const deptInfo = getDepartmentInfo(item.departmentId);
                    return (
                      <tr
                        key={item.complaintId}
                        className="hover:bg-[#F8FAFC] transition-colors"
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 font-mono text-xs font-semibold text-[#6B1724]">
                          <Link
                            href={`/complaints/${item.complaintId}`}
                            className="hover:underline focus:outline-none focus:ring-1 focus:ring-[#6B1724] rounded"
                          >
                            {item.complaintId}
                          </Link>
                        </td>
                        <td className="px-3 py-4 max-w-xs">
                          <Link
                            href={`/complaints/${item.complaintId}`}
                            className="font-medium text-[#0F172A] hover:text-[#6B1724] transition-colors line-clamp-1 block"
                          >
                            {item.title}
                          </Link>
                          <span className="text-xs text-[#64748B] block mt-0.5 truncate">
                            {deptInfo?.departmentName || item.departmentId}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-xs text-[#475569]">
                          {CATEGORY_LABELS[item.category as ComplaintCategory] || item.category}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <PriorityBadge priority={item.priority} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-xs text-[#64748B]">
                          {formatDate(item.submittedAt)}
                        </td>
                        <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-xs font-medium">
                          <Link
                            href={`/complaints/${item.complaintId}`}
                            className="text-[#6B1724] hover:text-[#52111B] font-semibold"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View (Visible on mobile only) */}
          <div className="flex flex-col gap-3 md:hidden">
            {filteredComplaints.map((item) => {
              const deptInfo = getDepartmentInfo(item.departmentId);
              return (
                <Link
                  key={item.complaintId}
                  href={`/complaints/${item.complaintId}`}
                  className="block rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-sm hover:border-[#CBD5E1] transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-[#6B1724]">
                      {item.complaintId}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>

                  <h4 className="text-sm font-semibold text-[#0F172A] line-clamp-2 mb-1">
                    {item.title}
                  </h4>

                  <p className="text-xs text-[#64748B] mb-3 truncate">
                    {deptInfo?.departmentName || item.departmentId}
                  </p>

                  <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-2 text-[11px] text-[#64748B]">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={item.priority} />
                      <span>{CATEGORY_LABELS[item.category as ComplaintCategory]}</span>
                    </div>
                    <span>{formatDate(item.submittedAt)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

    </div>
  );
}
