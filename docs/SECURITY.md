# AU-CTS — Security Model

> **Document Status**: IMPLEMENTED — Phase 1 Foundation
> **Last Updated**: Phase 1

---

## Overview

AU-CTS implements a layered security model. No single layer is the sole security boundary.

```
Layer 1: Firebase Authentication   — Identity verification
Layer 2: Session Cookies            — Server-managed auth state
Layer 3: Next.js Middleware         — UX-level route protection
Layer 4: Server Component Verify    — Defense-in-depth
Layer 5: Server Actions             — Mutation authorization
Layer 6: Firestore Security Rules   — Database-level access control
Layer 7: Storage Rules              — File access control
Layer 8: Custom Claims              — Role authorization
```

---

## Authentication Flow

```
1. User submits email/password on /login
2. Firebase client SDK: signInWithEmailAndPassword()
3. Firebase Auth returns UserCredential + ID Token (1hr expiry)
4. Client calls signInAction(idToken) — Server Action
5. Server Action: adminAuth.verifyIdToken(idToken)
6. Server Action: adminAuth.createSessionCookie(idToken, { expiresIn: 7 days })
7. Session cookie set: HttpOnly, Secure, SameSite=Lax
8. User redirected to /dashboard
```

## Session Management

- **Cookie name**: `__session`
- **Duration**: 7 days
- **Storage**: HttpOnly (inaccessible to JavaScript)
- **Transport**: Secure flag in production (HTTPS only)
- **SameSite**: Lax (prevents CSRF on cross-origin navigation)

## Role Authorization

Roles are stored as **Firebase Custom Claims** — embedded in the ID token JWT.

| Property | Value |
|---|---|
| Claim name | `role` |
| Set by | Firebase Admin SDK only (server-side) |
| Client-writable | ❌ Never |
| Available in rules | `request.auth.token.role` |
| Available server-side | Decoded token `role` field |

### Valid Roles

| Role | Identifier |
|---|---|
| Student | `student` |
| Faculty | `faculty` |
| Staff | `staff` |
| Department Officer | `department_officer` |
| Administrator | `admin` |

## Firestore Security Rules (IMPLEMENTED)

All Firestore access is denied by default. Only explicit allow rules grant access.

### Users Collection `/users/{userId}`
- **Read**: Own profile OR admin OR officer
- **Write**: Admin only (role assignment server-side)

### Complaints Collection `/complaints/{complaintId}`
- **Create**: Authenticated student/faculty/staff — must set `submittedBy` to own UID
- **Read**: Own submissions OR assigned officer OR admin
- **Update**: Assigned officer (for status changes) OR admin
- **Delete**: Nobody — complaints are permanent records

### Audit Sub-collection `/complaints/{id}/audit/{auditId}`
- **Read**: Admin OR assigned officer
- **Write**: Denied to all clients — Admin SDK only via Cloud Functions

### Other Collections
- `/routingRules`: Admin only
- `/departments`: Read (all authenticated), Write (admin)
- `/notifications`: Read/update own (users), Write (Cloud Functions)

## Firebase Storage Rules (IMPLEMENTED)

- Complaint attachments: Authenticated upload, Admin SDK-only deletion
- No public read access — all file access via signed URLs generated server-side
- File size limit: 10MB enforced at storage rules level

## Threat Mitigation

| Threat | Mitigation |
|---|---|
| Client claiming wrong role | Custom claims set Admin SDK only |
| Forged session cookie | Admin SDK verifies signature on every protected request |
| Horizontal escalation | Firestore rules enforce `submittedBy == uid` |
| Direct Firestore manipulation | Rules deny arbitrary writes |
| XSS → token theft | HttpOnly cookie — no token in localStorage |
| CSRF | SameSite=Lax cookie + Server Actions (no GET-based mutations) |
| Storage URL leakage | Signed URLs with short expiry, server-side only |
| Admin SDK browser exposure | `server-only` package prevents import in Client Components |

## Known Limitations (Phase 1)

- FIREBASE_SERVICE_ACCOUNT_KEY must be provided manually for Admin SDK to work server-side
- No token revocation check on every request (only on sensitive operations) — `checkRevoked: true` will be added for admin operations in Phase 2
- Email notifications not yet implemented
- Rate limiting not yet implemented (planned for Phase 9 hardening)
