// src/app/(dashboard)/profile/page.tsx
// User profile page — Server Component
// Enforces authenticated session and displays institutional account details

import type { Metadata } from "next";
import { requireAuthenticatedUser } from "@/lib/auth/authorization";
import { serializeUserProfile } from "@/lib/users/service";
import { ProfileForm } from "./ProfileForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS } from "@/types";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Profile",
};

export default async function ProfilePage() {
  const context = await requireAuthenticatedUser();
  const profileDTO = serializeUserProfile(context.profile);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1
          className="text-2xl font-bold text-[#0F172A]"
          style={{ fontFamily: "'Source Serif 4', serif" }}
        >
          My Institutional Profile
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          View your assigned role, department affiliation, and identity records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Overview Sidebar */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6B1724] text-lg font-bold text-white">
                {context.profile.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[#0F172A] truncate">
                  {context.profile.displayName}
                </p>
                <p className="text-xs text-[#64748B] truncate">
                  {context.profile.email}
                </p>
              </div>
            </div>

            <div className="border-t border-[#E2E8F0] pt-4 flex flex-col gap-3 text-xs">
              <div>
                <span className="text-[#64748B] block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                  Assigned Role
                </span>
                <Badge variant="maroon">
                  {ROLE_LABELS[context.profile.role]}
                </Badge>
              </div>

              {context.profile.departmentId && (
                <div>
                  <span className="text-[#64748B] block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                    Department
                  </span>
                  <p className="font-medium text-[#0F172A] capitalize">
                    {context.profile.departmentId.replace("dept-", "")}
                  </p>
                </div>
              )}

              <div>
                <span className="text-[#64748B] block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                  Account Status
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  Active & Verified
                </span>
              </div>

              <div>
                <span className="text-[#64748B] block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                  Member Since
                </span>
                <p className="text-[#0F172A]">
                  {formatDate(context.profile.createdAt)}
                </p>
              </div>

              {context.profile.lastLoginAt && (
                <div>
                  <span className="text-[#64748B] block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                    Last Sign In
                  </span>
                  <p className="text-[#0F172A]">
                    {formatDate(context.profile.lastLoginAt, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Edit Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm initialProfile={profileDTO} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
