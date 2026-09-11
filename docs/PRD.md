# AU-CTS — Product Requirements Document (PRD)

> **Document Status**: IMPLEMENTED (Phase 1 Foundation) / PLANNED (Phases 2–10)
> **Institution**: Anurag University
> **System**: Complaint Tracking System (AU-CTS)

---

## 1. Executive Summary

The Anurag University Complaint Tracking System (AU-CTS) digitizes and streamlines university grievance management across key institutional domains: hostel, transport, classroom, laboratory, maintenance, and academic affairs.

---

## 2. User Personas & Roles

| Role | Description | Scope of Authority |
|---|---|---|
| **Student** | Enrolled undergraduate / postgraduate students | Submit complaints, view personal complaint history, submit resolution feedback, reopen unresolved cases. |
| **Faculty** | Academic instructional staff | Submit infrastructure and academic complaints, view personal status. |
| **Staff** | University administrative and support personnel | Submit maintenance and logistical complaints. |
| **Department Officer** | Designated grievance handler (e.g., Hostel Warden, Transport In-charge, Lab In-charge) | View assigned department complaints, update status, resolve complaints, escalate or reject invalid filings. |
| **Admin** | Central university administration / IT | System-wide visibility, user role assignments, routing rule modifications, SLA policy tuning, comprehensive analytics. |

---

## 3. Complaint Categories & Department Routing

1. **Hostel** → Hostel Warden / Residential Life Office
2. **Transport** → Transport Officer / Logistics
3. **Classroom** → Maintenance Staff / Facility Operations
4. **Lab** → Laboratory In-charge / Technical Staff
5. **Maintenance** → Facility Operations / Estate Maintenance
6. **Academic** → Academic Officer / Dean's Office

---

## 4. Controlled Complaint Lifecycle

```
[SUBMITTED]
    │
    ▼
[PENDING] (Assigned via routing rules)
    │
    ├───────────────────────┬────────────────────────┐
    ▼                       ▼                        ▼
[IN_REVIEW]           [REJECTED]                [DUPLICATE]
    │
    ├───────────────────────┐
    ▼                       ▼
[RESOLVED]             [ESCALATED] (SLA breach / manual)
    │                       │
    ├───────────┐           ▼
    ▼           ▼       [IN_REVIEW]
[CLOSED]    [REOPENED]
```

---

## 5. Functional Requirements Matrix

| Requirement | Implementation Status | Target Phase |
|---|---|---|
| Role-based authentication (Email/Password) | **IMPLEMENTED** (Foundation) | Phase 1 & 2 |
| App shell, responsive layout, AU design tokens | **IMPLEMENTED** | Phase 1 |
| Firestore & Storage security rules | **IMPLEMENTED** (Foundation) | Phase 1 |
| End-to-end route protection | **IMPLEMENTED** | Phase 1 |
| User profile & claims management | **PLANNED** | Phase 2 |
| Complaint submission with attachments & ID generation | **PLANNED** | Phase 3 |
| Category-based auto-routing | **PLANNED** | Phase 3 |
| Complaint state machine & officer triage | **PLANNED** | Phase 4 |
| SLA-based automated escalation | **PLANNED** | Phase 5 |
| In-app real-time notifications | **PLANNED** | Phase 6 |
| Administrative analytics & CSV reporting | **PLANNED** | Phase 7 |
| Accessibility & mobile optimization | **PLANNED** | Phase 8 |
| E2E test hardening & production deploy | **PLANNED** | Phases 9 & 10 |
