// src/components/dashboard/AppSidebar.tsx
// Application sidebar navigation — AU-CTS
// Server Component (no client state needed at this level)

import Link from "next/link";
import type { SessionUser } from "@/types";
import { USER_ROLES } from "@/types";
import { UniversityLogo } from "@/components/ui/UniversityLogo";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[]; // undefined = accessible to all roles
}

const ChecklistIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const HomeIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const UsersIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const UserCircleIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.964 0a9 9 0 10-11.963 0m11.964 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <HomeIcon />,
  },
  {
    label: "My Complaints",
    href: "/complaints",
    icon: <ChecklistIcon />,
    roles: [USER_ROLES.STUDENT, USER_ROLES.FACULTY, USER_ROLES.STAFF],
  },
  {
    label: "Department Queue",
    href: "/officer",
    icon: <ChecklistIcon />,
    roles: [USER_ROLES.DEPARTMENT_OFFICER],
  },
  {
    label: "Admin Portal",
    href: "/admin",
    icon: <ShieldIcon />,
    roles: [USER_ROLES.ADMIN],
  },
  {
    label: "User Management",
    href: "/admin/users",
    icon: <UsersIcon />,
    roles: [USER_ROLES.ADMIN],
  },
  {
    label: "My Profile",
    href: "/profile",
    icon: <UserCircleIcon />,
  },
];

interface AppSidebarProps {
  user: SessionUser;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user.role),
  );

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-[#1E293B] text-white flex-shrink-0">
      {/* Logo area — official AU emblem */}
      <div className="px-5 py-4 border-b border-white/10">
        <Link href="/dashboard" aria-label="AU-CTS Dashboard">
          <UniversityLogo variant="light" size="sm" showSubtitle />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Main navigation">
        <ul className="flex flex-col gap-0.5" role="list">
          {visibleItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-white"
              >
                <span className="flex-shrink-0 text-white/50">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info footer */}
      <div className="border-t border-white/10 px-4 py-3">
        <Link
          href="/profile"
          className="flex items-center gap-3 hover:bg-white/5 p-1 rounded-md transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6B1724] text-xs font-semibold text-white flex-shrink-0">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white leading-tight truncate">
              {user.displayName}
            </p>
            <p className="text-[10px] text-white/50 capitalize truncate">
              {user.role.replace("_", " ")}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
