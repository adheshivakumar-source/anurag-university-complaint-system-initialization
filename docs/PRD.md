# AU-CTS — Product Requirements Document (PRD)

> **Document Status**: IMPLEMENTED (Phase 1 Foundation & Phase 2 Auth/User Management) / PLANNED (Phases 3–10)
> **Institution**: Anurag University
> **System**: Complaint Tracking System (AU-CTS)

---

## 1. User Roles & Capabilities Matrix

| Role | Scope of Authority | Implementation Status |
|---|---|---|
| **Student** | Submit complaints, view personal complaint history, submit feedback, manage own profile. | **IMPLEMENTED** (Auth & Profile) |
| **Faculty** | Submit infrastructure and academic complaints, view personal status, manage own profile. | **IMPLEMENTED** (Auth & Profile) |
| **Staff** | Submit maintenance and logistical complaints, manage own profile. | **IMPLEMENTED** (Auth & Profile) |
| **Department Officer** | View assigned department complaints, update status, resolve complaints, escalate or reject invalid filings. | **IMPLEMENTED** (Auth, Queue Layout & Security Guards) |
| **Admin** | System-wide visibility, user role assignments, department mappings, user activation/deactivation, routing rule modifications. | **IMPLEMENTED** (Auth, User Directory, Role Update & Account Toggle) |

---

## 2. Functional Requirements Matrix

| Requirement | Implementation Status | Target Phase |
|---|---|---|
| Role-based authentication (Email/Password) | **IMPLEMENTED** | Phase 1 & 2 |
| Institutional User Self-Registration (whitelisted roles) | **IMPLEMENTED** | Phase 2 |
| Admin User Management Directory | **IMPLEMENTED** | Phase 2 |
| Admin Role Modification & Custom Claims Sync | **IMPLEMENTED** | Phase 2 |
| Account Deactivation & Session Revocation | **IMPLEMENTED** | Phase 2 |
| User Self-Profile Management | **IMPLEMENTED** | Phase 2 |
| App shell, responsive layout, AU design tokens | **IMPLEMENTED** | Phase 1 |
| Firestore & Storage security rules | **IMPLEMENTED** | Phase 1 & 2 |
| End-to-end route protection | **IMPLEMENTED** | Phase 1 & 2 |
| Complaint submission with attachments & ID generation | **PLANNED** | Phase 3 |
| Category-based auto-routing | **PLANNED** | Phase 3 |
| Complaint state machine & officer triage | **PLANNED** | Phase 4 |
| SLA-based automated escalation | **PLANNED** | Phase 5 |
| In-app real-time notifications | **PLANNED** | Phase 6 |
| Administrative analytics & CSV reporting | **PLANNED** | Phase 7 |
| Accessibility & mobile optimization | **PLANNED** | Phase 8 |
| E2E test hardening & production deploy | **PLANNED** | Phases 9 & 10 |
