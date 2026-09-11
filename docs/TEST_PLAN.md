# AU-CTS — Test Plan & Quality Strategy

> **Document Status**: IMPLEMENTED (Phase 1 & Phase 2 E2E Suites) / PLANNED (Phases 3–9)
> **Testing Framework**: Playwright (E2E) + TypeScript Compiler (`tsc`) + ESLint

---

## 1. Quality Gates

1. **Static Type Safety**: `npm run typecheck` (`tsc --noEmit` with strict null checks).
2. **Lint Standards**: `npm run lint` (`eslint src`).
3. **Production Compilation**: `npm run build` (`next build`).
4. **End-to-End User Journeys**: `npx playwright test`.

---

## 2. Playwright E2E Test Suite Matrix (Phase 2)

### A. Authentication & Registration (`tests/e2e/auth.spec.ts`)
* **TC-AUTH-01**: Unauthenticated request to `/dashboard` redirects to `/login`.
* **TC-AUTH-02**: Unauthenticated request to `/complaints` redirects to `/login`.
* **TC-AUTH-03**: Unauthenticated request to `/admin` redirects to `/login`.
* **TC-AUTH-04**: Unauthenticated request to `/officer` redirects to `/login`.
* **TC-AUTH-05**: Unauthenticated request to `/profile` redirects to `/login`.
* **TC-AUTH-06**: `redirectTo` query parameter preserved across route guards.
* **TC-AUTH-07**: Direct access to `/login` without infinite loops.
* **TC-AUTH-08**: Anurag University branding & registration link presence.
* **TC-AUTH-09**: Login form empty field validation.
* **TC-AUTH-10**: Login form invalid email format validation.
* **TC-REG-01**: Registration page accessible and displays allowed roles (`Student`, `Faculty`, `Staff`).
* **TC-REG-02**: Privileged roles (`Admin`, `Officer`) absent from self-registration choices.
* **TC-REG-03**: Registration empty form validation alerts.
* **TC-REG-04**: Registration password matching validation.
* **TC-REG-05**: Dynamic identity field display based on selected role (Student Roll ID vs. Employee ID).

### B. Role-Based Access Control (`tests/e2e/rbac.spec.ts`)
* **TC-RBAC-01**: Direct unauthorized GET to `/admin/users` redirects to `/login`.
* **TC-RBAC-02**: Direct unauthorized GET to `/officer` redirects to `/login`.
* **TC-RBAC-03**: Direct unauthorized GET to `/profile` redirects to `/login`.
* **TC-RBAC-04**: Error banner displayed when `?error=unauthorized` query is passed.
* **TC-RBAC-05**: Deactivation banner displayed when `?error=deactivated` query is passed.

### C. Admin User Directory Security (`tests/e2e/admin-users.spec.ts`)
* **TC-ADM-01**: Direct unauthenticated GET to `/admin/users` redirected to login with preserved target path.
* **TC-ADM-02**: Direct unauthenticated GET to `/admin` redirected to login with preserved target path.
