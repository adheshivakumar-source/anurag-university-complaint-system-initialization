"use client";
// src/app/(dashboard)/complaints/[id]/ReassignComplaintButton.tsx
// ============================================================
// Officer Reassignment & Department Transfer Modal — AU-CTS (Phase 5.5)
// ============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UserProfileDTO } from "@/shared/types";
import { Button } from "@/components/ui/Button";
import {
  reassignComplaintAction,
  transferDepartmentAction,
} from "@/server/complaints/actions";

interface ReassignComplaintButtonProps {
  complaintId: string;
  currentDepartmentId: string;
  currentAssignedTo: string | null;
  isAdmin: boolean;
  departmentOfficers: UserProfileDTO[];
  allDepartments: { departmentId: string; departmentName: string }[];
}

export function ReassignComplaintButton({
  complaintId,
  currentDepartmentId,
  currentAssignedTo,
  isAdmin,
  departmentOfficers,
  allDepartments,
}: ReassignComplaintButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"reassign" | "transfer">("reassign");
  const [selectedOfficerUid, setSelectedOfficerUid] = useState<string>("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [transferReason, setTransferReason] = useState<string>("");
  const [reassignNote, setReassignNote] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    setError(null);
    setTransferReason("");
    setReassignNote("");
    setSelectedOfficerUid(departmentOfficers[0]?.uid || "");
    const otherDepts = allDepartments.filter((d) => d.departmentId !== currentDepartmentId);
    setSelectedDepartmentId(otherDepts[0]?.departmentId || "");
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isPending) return;
    setIsOpen(false);
    setError(null);
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfficerUid) {
      setError("Please select an officer to assign.");
      return;
    }

    const officer = departmentOfficers.find((o) => o.uid === selectedOfficerUid);
    if (!officer) {
      setError("Selected officer is not available.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await reassignComplaintAction({
        complaintId,
        officerUid: officer.uid,
        officerName: officer.displayName,
        note: reassignNote.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to reassign complaint.");
        return;
      }

      setIsOpen(false);
      router.refresh();
    });
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartmentId) {
      setError("Please select a target department.");
      return;
    }

    if (transferReason.trim().length < 10) {
      setError("Transfer reason must be at least 10 characters.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await transferDepartmentAction({
        complaintId,
        targetDepartmentId: selectedDepartmentId,
        reason: transferReason.trim(),
      });

      if (!res.success) {
        setError(res.error || "Failed to transfer complaint.");
        return;
      }

      setIsOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleOpen}
        aria-label="Reassign or transfer grievance"
      >
        Reassign / Transfer
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-lg rounded-lg border border-[#CBD5E1] bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reassign-modal-title"
          >
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h3 id="reassign-modal-title" className="text-base font-bold text-[#0F172A]">
                Reassign or Transfer Grievance
              </h3>
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="text-[#94A3B8] hover:text-[#0F172A] disabled:opacity-50"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {isAdmin && (
              <div className="flex border-b border-[#E2E8F0] mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("reassign");
                    setError(null);
                  }}
                  className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
                    activeTab === "reassign"
                      ? "border-[#6B1724] text-[#6B1724]"
                      : "border-transparent text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  Reassign Officer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("transfer");
                    setError(null);
                  }}
                  className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
                    activeTab === "transfer"
                      ? "border-[#6B1724] text-[#6B1724]"
                      : "border-transparent text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  Transfer Department
                </button>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mt-3 rounded border border-[#FECDD3] bg-[#FFF0F0] p-3 text-xs text-[#991B1B]"
              >
                {error}
              </div>
            )}

            {activeTab === "reassign" ? (
              <form onSubmit={handleReassignSubmit} className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="reassign-officer"
                    className="block text-xs font-semibold text-[#334155] mb-1"
                  >
                    Select Department Officer:
                  </label>
                  {departmentOfficers.length === 0 ? (
                    <p className="text-xs text-[#64748B] italic">
                      No other active department officers available in this department.
                    </p>
                  ) : (
                    <select
                      id="reassign-officer"
                      value={selectedOfficerUid}
                      onChange={(e) => setSelectedOfficerUid(e.target.value)}
                      className="w-full rounded border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-[#6B1724]"
                    >
                      {departmentOfficers.map((officer) => (
                        <option key={officer.uid} value={officer.uid}>
                          {officer.displayName} ({officer.email})
                          {officer.uid === currentAssignedTo ? " — Currently Assigned" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="reassign-note"
                    className="block text-xs font-semibold text-[#334155] mb-1"
                  >
                    Assignment Note (Optional):
                  </label>
                  <input
                    id="reassign-note"
                    type="text"
                    placeholder="Reason for reassignment…"
                    value={reassignNote}
                    onChange={(e) => setReassignNote(e.target.value)}
                    className="w-full rounded border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#6B1724]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F1F5F9]">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isPending || departmentOfficers.length === 0}
                  >
                    {isPending ? "Reassigning…" : "Confirm Reassignment"}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleTransferSubmit} className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="transfer-dept"
                    className="block text-xs font-semibold text-[#334155] mb-1"
                  >
                    Target University Department:
                  </label>
                  <select
                    id="transfer-dept"
                    value={selectedDepartmentId}
                    onChange={(e) => setSelectedDepartmentId(e.target.value)}
                    className="w-full rounded border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-[#6B1724]"
                  >
                    {allDepartments
                      .filter((d) => d.departmentId !== currentDepartmentId)
                      .map((dept) => (
                        <option key={dept.departmentId} value={dept.departmentId}>
                          {dept.departmentName} ({dept.departmentId})
                        </option>
                      ))}
                  </select>
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Transferring resets assigned officer, aligns category, recalculates SLA, and moves the grievance to the target department queue as Submitted.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="transfer-reason"
                    className="block text-xs font-semibold text-[#334155] mb-1"
                  >
                    Mandatory Transfer Reason:
                  </label>
                  <textarea
                    id="transfer-reason"
                    rows={3}
                    placeholder="Explain why this grievance is being transferred (min 10 characters)…"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    className="w-full rounded border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#6B1724]"
                  />
                  <span className="text-[11px] text-[#64748B]">
                    {transferReason.trim().length}/10 minimum characters
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F1F5F9]">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isPending || transferReason.trim().length < 10}
                  >
                    {isPending ? "Transferring…" : "Confirm Department Transfer"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
