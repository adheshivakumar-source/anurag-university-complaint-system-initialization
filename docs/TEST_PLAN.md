# AU-CTS — Test Plan & Quality Strategy

> **Document Status**: IMPLEMENTED (Phase 1 E2E Auth & Scaffold) / PLANNED (Phases 2–9)
> **Testing Framework**: Playwright (E2E) + TypeScript Compiler (`tsc`) + ESLint

---

## 1. Testing Pyramid Strategy

1. **Static Quality Gates**:
   - TypeScript compiler (`tsc --noEmit`) with strict checks.
   - ESLint (`next/core-web-vitals` + `typescript`).
   - Next.js production build validation (`next build`).
2. **Security Rules Unit Tests** *(Phase 9)*:
   - Firebase Local Emulator suite testing Firestore and Storage rules.
3. **End-to-End User Journey Tests** *(Playwright)*:
   - Unauthenticated route protection and redirects.
   - Student authentication and dashboard navigation.
   - Complaint submission with attachment validation.
   - Officer status updates and resolution flow.
   - Admin routing rule updates and analytics generation.

---

## 2. Phase 1 Test Coverage (`tests/e2e/auth.spec.ts`)

| Test Case | Scenario | Expected Behavior | Status |
|---|---|---|---|
| **TC-01** | Unauthenticated request to `/dashboard` | HTTP 307 / Redirect to `/login?redirectTo=/dashboard` | **PASS** |
| **TC-02** | Unauthenticated request to `/complaints` | HTTP 307 / Redirect to `/login?redirectTo=/complaints` | **PASS** |
| **TC-03** | Unauthenticated request to `/admin` | HTTP 307 / Redirect to `/login?redirectTo=/admin` | **PASS** |
| **TC-04** | Direct visit to `/login` | Stays on `/login` without redirect loops | **PASS** |
| **TC-05** | Branding check | Verified presence of Anurag University mark & CTS banner | **PASS** |
| **TC-06** | Form validation (empty) | Client validation alerts for missing email & password | **PASS** |
| **TC-07** | Form validation (invalid email format) | Inline error alert for invalid email structure | **PASS** |
