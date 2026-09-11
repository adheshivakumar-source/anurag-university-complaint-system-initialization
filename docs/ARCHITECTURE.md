# AU-CTS — Architecture

> **Document Status**: IMPLEMENTED (Phase 1) + PLANNED (Phases 2–10)
> **Last Updated**: Phase 1

---

## System Overview

The Anurag University Complaint Tracking System (AU-CTS) is a production-quality web application for managing institutional complaints. It serves students, faculty, staff, department officers, and administrators.

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.3.4 |
| Language | TypeScript (strict mode) | 5.x |
| Styling | Tailwind CSS | 4.x |
| Auth | Firebase Authentication | 12.x |
| Database | Cloud Firestore | (via Firebase 12.x) |
| Storage | Firebase Cloud Storage | (via Firebase 12.x) |
| Admin SDK | Firebase Admin | 14.x |
| Runtime | Node.js | 24.x |

## Project Structure (IMPLEMENTED)

```
AU-CTS/
├── src/
│   ├── app/
│   │   ├── (auth)/login/          # Login page + form
│   │   ├── (dashboard)/           # Protected app shell
│   │   │   ├── layout.tsx         # Auth guard + sidebar + header
│   │   │   └── dashboard/         # Dashboard home page
│   │   ├── globals.css            # Tailwind v4 theme + AU design tokens
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Root redirect
│   ├── components/
│   │   ├── ui/                    # Design system primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Card.tsx
│   │   └── dashboard/             # App shell components
│   │       ├── AppSidebar.tsx
│   │       └── AppHeader.tsx
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── client.ts          # Client SDK (browser-safe)
│   │   │   └── admin.ts           # Admin SDK (server-only)
│   │   ├── auth/
│   │   │   ├── session.ts         # Session cookie management
│   │   │   └── actions.ts         # Server Actions: signIn, signOut
│   │   └── utils.ts               # Shared utilities
│   ├── types/
│   │   ├── auth.ts                # UserRole, UserProfile, SessionUser
│   │   ├── complaint.ts           # ComplaintStatus, Category, Priority, Complaint
│   │   ├── audit.ts               # AuditAction, AuditEvent
│   │   ├── routing.ts             # RoutingRule, Department
│   │   └── index.ts               # Barrel exports
│   └── middleware.ts              # Route protection
├── functions/                     # PLANNED — Cloud Functions (Phase 5+)
├── docs/                          # Documentation
├── tests/
│   └── e2e/auth.spec.ts           # E2E auth tests
├── firestore.rules                # Firestore security rules
├── storage.rules                  # Firebase Storage rules
├── firebase.json                  # Firebase project config
├── playwright.config.ts           # E2E test config
├── .env.local                     # Local secrets (gitignored)
└── .env.example                   # Variable template (committed)
```

## Authentication Architecture

```
Browser                     Next.js Server              Firebase
   |                              |                          |
   | 1. email/password            |                          |
   |─────────────────────────────────────────────────────>  |
   |              Firebase Auth SDK (client)                 |
   | <─ ID Token (1hr) ─────────────────────────────────── |
   |                              |                          |
   | 2. POST signInAction(token)  |                          |
   |─────────────────────────────>|                          |
   |                              | 3. verifyIdToken()       |
   |                              |─────────────────────────>|
   |                              | <─ decoded ─────────────|
   |                              | 4. createSessionCookie() |
   |                              |─────────────────────────>|
   |                              | <─ session cookie ───── |
   |                              | 5. set HttpOnly cookie   |
   | <─ redirect /dashboard ───── |                          |
```

## Route Protection

```
Request to /dashboard
       ↓
Next.js Middleware (Edge)
  → Has __session cookie?
  → No: redirect /login?redirectTo=/dashboard
  → Yes: NextResponse.next()
       ↓
(dashboard)/layout.tsx [Server Component]
  → getVerifiedSession() → Admin SDK verifySessionCookie()
  → Invalid/expired: redirect /login
  → Valid: render app shell with SessionUser
       ↓
Individual pages
  → Optional: re-verify for sensitive data access
```

## Planned Features (Phase 2–10)

- **Phase 2**: Full user management, role assignment, registration
- **Phase 3**: Complaint submission, routing, ID generation, attachments
- **Phase 4**: Complaint lifecycle, status transitions, officer workflow
- **Phase 5**: SLA configuration, automated escalation (Cloud Functions)
- **Phase 6**: Real-time notifications, notification bell
- **Phase 7**: Analytics, admin reporting, CSV export
- **Phase 8**: Mobile responsiveness, accessibility audit, UI polish
- **Phase 9**: Full E2E test suite, security rules unit tests, hardening
- **Phase 10**: Production deployment, CI/CD pipeline, monitoring
