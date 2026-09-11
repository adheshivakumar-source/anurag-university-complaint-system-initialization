# AU-CTS — Architecture

> **Document Status**: IMPLEMENTED (Phase 1 Foundation & Phase 2 Authentication/User Management) / PLANNED (Phases 3–10)
> **Last Updated**: Phase 2

---

## 1. System Overview

The Anurag University Complaint Tracking System (AU-CTS) is a production-grade institutional web platform for managing and resolving university grievances. It enforces a strict authorization hierarchy across 5 roles: Student, Faculty, Staff, Department Officer, and Administrator.

---

## 2. Technology Stack

| Layer | Technology | Version | Description |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 16.3.4 | Server Actions, React Server Components, Turbopack |
| **Language** | TypeScript (Strict mode) | 5.x | Centralized domain typing (`src/types`) |
| **Styling** | Tailwind CSS | 4.x | CSS-first design tokens matching Anurag University identity |
| **Auth** | Firebase Authentication | 12.18.0 | Email/Password, Custom User Claims |
| **Database** | Cloud Firestore | 12.18.0 | Document DB (`au-cts-prod`), Deny-by-default rules |
| **Storage** | Firebase Cloud Storage | 12.18.0 | Authenticated file vault with size constraints |
| **Server Admin** | Firebase Admin SDK | 14.3.0 | Server-only token verification, claims setting, user management |
| **Testing** | Playwright | 1.49.1 | End-to-end browser user journey test suite |

---

## 3. Directory Structure (IMPLEMENTED)

```
AU-CTS/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/                 # Login page + form
│   │   │   └── register/              # Self-registration (Student/Faculty/Staff)
│   │   ├── (dashboard)/               # Protected app shell
│   │   │   ├── layout.tsx             # Session & active status validation layout
│   │   │   ├── dashboard/             # Role-aware dashboard home
│   │   │   ├── complaints/            # Complaints history placeholder
│   │   │   ├── profile/               # User self-profile management
│   │   │   ├── officer/               # Department officer queue
│   │   │   └── admin/                 # Administrator portal
│   │   │       ├── layout.tsx         # Admin authorization guard
│   │   │       ├── page.tsx           # Admin overview & statistics
│   │   │       └── users/             # Interactive user directory & role management
│   │   ├── globals.css                # Tailwind v4 theme + AU design tokens
│   │   ├── layout.tsx                 # Root layout (fonts, metadata)
│   │   └── page.tsx                   # Root redirect
│   ├── components/
│   │   ├── ui/                        # Atomic design primitives
│   │   │   ├── Button.tsx             # CVA variants (maroon, secondary, ghost, destructive)
│   │   │   ├── Input.tsx              # Form inputs with accessible error labels
│   │   │   ├── Badge.tsx              # Status, priority & role badges
│   │   │   └── Card.tsx               # Standardized institutional containers
│   │   └── dashboard/
│   │       ├── AppSidebar.tsx         # Role-aware navigation sidebar
│   │       └── AppHeader.tsx          # Top utility bar with sign-out
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── client.ts              # Browser-safe client SDK singleton
│   │   │   └── admin.ts               # Server-only Firebase Admin SDK
│   │   ├── auth/
│   │   │   ├── session.ts             # 7-day HttpOnly session cookie manager
│   │   │   ├── actions.ts             # Server Actions (signIn, register, signOut)
│   │   │   └── authorization.ts       # Server-side auth helpers (requireAdmin, etc.)
│   │   ├── users/
│   │   │   ├── service.ts             # Firestore user CRUD & custom claims sync
│   │   │   └── actions.ts             # Admin role update & status toggle actions
│   │   └── utils.ts                   # Formatting & class merge helpers
│   ├── types/
│   │   ├── auth.ts                    # UserRole, UserProfile, SessionUser
│   │   ├── complaint.ts               # Status, Category, Priority, Complaint
│   │   ├── audit.ts                   # AuditAction, AuditEvent
│   │   ├── routing.ts                 # RoutingRule, Department
│   │   └── index.ts                   # Barrel export
│   └── proxy.ts                       # Next.js 16 Proxy / Middleware route guard
├── docs/                              # Formal system documentation
├── tests/
│   └── e2e/                           # Playwright test suites
│       ├── auth.spec.ts               # Auth & registration tests
│       ├── rbac.spec.ts               # Role-based access control tests
│       └── admin-users.spec.ts        # Admin directory security tests
├── firestore.rules                    # Database access rules
├── storage.rules                      # Storage access rules
├── firebase.json                      # Firebase project config
└── playwright.config.ts               # Multi-device E2E configuration
```

---

## 4. Authentication & Authorization Flow

```
[Browser Client]
       │
       ├─ 1. Submits Email/Password via signInWithEmailAndPassword / createUserWithEmailAndPassword
       ├─ 2. Obtains Firebase ID Token (JWT)
       │
       ▼
[Next.js Server Action] (signInAction / registerAction)
       │
       ├─ 3. Verifies ID token with Firebase Admin SDK
       ├─ 4. Checks / creates User document in Firestore /users/{uid}
       ├─ 5. Verifies account active status (isActive === true)
       ├─ 6. Synchronizes Custom Claims ({ role, departmentId }) via Admin SDK
       ├─ 7. Mints Firebase Session Cookie (__session) — HttpOnly, Secure, 7 days
       │
       ▼
[Next.js Proxy / Middleware]
       │
       └─ 8. Intercepts incoming requests; redirects unauthenticated visitors to /login
       │
       ▼
[Server Components / Layouts]
       │
       └─ 9. Executes getAuthenticatedUser() / requireRole() for full defense-in-depth
```

---

## 5. Phase 2 Capabilities & Next Milestones

* **Phase 1 (Complete)**: Next.js 16 + Tailwind 4 scaffold, AU visual identity, Firebase infrastructure, E2E test foundation.
* **Phase 2 (Complete)**: Role-based authentication, user self-registration, admin user management, account deactivation, server authorization helpers.
* **Phase 3 (Next)**: Complaint submission, category-based auto-routing, ticket ID generation, and attachments.
