# AU-CTS — Security & Authorization Model

> **Document Status**: IMPLEMENTED — Phase 2 Authentication & User Management
> **Database Environment**: Cloud Firestore (`au-cts-prod`)

---

## 1. Multi-Layer Defense Architecture

```
Layer 1: Firebase Authentication (Identity Provider)
Layer 2: Server-Side Verification (Admin SDK verifyIdToken / verifySessionCookie)
Layer 3: HTTP-Only Session Cookies (__session, 7-day duration, SameSite=Lax, Secure)
Layer 4: Next.js Proxy/Middleware (Edge route interception & UX redirects)
Layer 5: Server Component Guards (requireAuthenticatedUser, requireAdmin, requireRole)
Layer 6: Server Action Gates (Strict validation, caller authorization verification)
Layer 7: Cloud Firestore Security Rules (Deny-by-default, token.role claims)
Layer 8: Firebase Storage Rules (Path ownership & file size limits)
```

---

## 2. Role Model & Authorization Matrix

| Role | Self-Register? | Routes Accessible | Actions Permitted |
|---|---|---|---|
| **Student** | Yes | `/dashboard`, `/complaints`, `/profile` | Submit complaints, view own history, submit feedback, reopen own cases. |
| **Faculty** | Yes | `/dashboard`, `/complaints`, `/profile` | Submit institutional & academic grievances, view own history. |
| **Staff** | Yes | `/dashboard`, `/complaints`, `/profile` | Submit maintenance & logistics complaints, view own history. |
| **Department Officer** | **No** (Admin-assigned) | `/dashboard`, `/complaints`, `/profile`, `/officer` | Review assigned department queue, update ticket status, resolve/escalate tickets. |
| **Admin** | **No** (Root bootstrap) | `/dashboard`, `/complaints`, `/profile`, `/officer`, `/admin/*` | Full system access, manage user roles, assign departments, activate/deactivate accounts, configure routing. |

---

## 3. Custom Claims Implementation & Synchronization

Firebase Custom Claims provide low-latency, database-layer role enforcement in Firestore rules:

```typescript
// Custom claims payload structure (max 1000 bytes)
interface UserCustomClaims {
  role: "student" | "faculty" | "staff" | "department_officer" | "admin";
  departmentId?: string | null;
}
```

### Claims Synchronization Protocol
1. When an Administrator modifies a user's role in `/admin/users`:
   - Step A: Update Firestore document `/users/{targetUid}` with `role` and `departmentId`.
   - Step B: Call `adminAuth.setCustomUserClaims(targetUid, { role, departmentId })`.
   - Step C: Revalidate affected route paths via `revalidatePath()`.
2. On ordinary user login:
   - The server verifies custom claims against the authoritative Firestore document. If a desynchronization is detected, custom claims are immediately re-minted from the Firestore source of truth.

---

## 4. Account Deactivation Protocol

1. When an Administrator deactivates an account:
   - Firestore `/users/{targetUid}` is updated with `isActive: false`.
   - Firebase Auth account is disabled via `adminAuth.updateUser(targetUid, { disabled: true })`.
   - Active tokens and session cookies are revoked via `adminAuth.revokeRefreshTokens(targetUid)`.
2. All server authorization helpers (`requireAuthenticatedUser()`, `getAuthenticatedUser()`) check `profile.isActive`. If `false`, the session is destroyed immediately, and the request is rejected with a redirect to `/login?error=deactivated`.

---

## 5. Security Threat Mitigations

| Threat Vector | Defense Mechanism |
|---|---|
| **Privilege Escalation** | Self-registration role is whitelisted to `['student', 'faculty', 'staff']`. Requests for `admin` or `department_officer` are overridden to `student`. |
| **Direct Firestore Tampering** | Rules strictly deny client writes to `/users/{userId}` for non-admin tokens. All user updates go through server actions. |
| **Cookie Tampering** | Cookies are verified using Admin SDK cryptographic signature checks on the server. |
| **XSS Token Theft** | Tokens are stored in HttpOnly cookies, rendering them inaccessible to browser JavaScript. |
| **Stale Session Abuse** | Revocation of refresh tokens and account disabling immediately terminates access across all endpoints. |
