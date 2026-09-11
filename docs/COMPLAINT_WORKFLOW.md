# AU-CTS — Complaint Workflow & State Machine

> **Document Status**: IMPLEMENTED (State Definitions & Transition Matrix) / PLANNED (Engine in Phase 4)
> **Institution**: Anurag University

---

## 1. Lifecycle State Definitions

* `submitted`: Complaint created by student/faculty/staff; awaiting system routing or officer pickup.
* `pending`: Complaint mapped to target department officer; awaiting initial review.
* `in_review`: Officer has acknowledged the issue and active remediation is underway.
* `resolved`: Officer marked the issue as fixed; waiting for student acknowledgment or auto-close.
* `closed`: Submitter confirmed resolution or automated closure threshold passed.
* `reopened`: Submitter rejected resolution; returns to officer triage with feedback.
* `escalated`: SLA deadline breached or manually escalated to higher authority.
* `rejected`: Officer or Admin rejected the complaint with formal documented rationale.
* `duplicate`: Officer identified existing identical complaint and cross-referenced `duplicateOf`.

---

## 2. State Transition Rules

| Current State | Permitted Next States | Authorized Actor | Audit Trigger |
|---|---|---|---|
| `submitted` | `pending` | System / Admin | `COMPLAINT_ASSIGNED` |
| `pending` | `in_review`, `rejected`, `duplicate`, `escalated` | Assigned Officer / Admin | `STATUS_CHANGED` |
| `in_review` | `resolved`, `escalated`, `rejected` | Assigned Officer / Admin | `COMPLAINT_RESOLVED` / `STATUS_CHANGED` |
| `resolved` | `closed`, `reopened` | Submitter / System Auto-close | `COMPLAINT_CLOSED` / `COMPLAINT_REOPENED` |
| `reopened` | `in_review`, `pending`, `escalated` | Assigned Officer / Admin | `STATUS_CHANGED` |
| `escalated` | `in_review`, `resolved` | Department Head / Admin | `STATUS_CHANGED` |
| `closed` | *None (Terminal)* | — | — |
| `rejected` | *None (Terminal)* | — | — |
| `duplicate` | *None (Terminal)* | — | — |

---

## 3. SLA Escalation Thresholds (Default Matrix)

| Priority | Initial Review SLA | Full Resolution SLA | Escalation Target |
|---|---|---|---|
| **Critical** | 2 Hours | 12 Hours | Department Head + Campus Admin |
| **High** | 6 Hours | 24 Hours | Department Head |
| **Medium** | 24 Hours | 72 Hours | Senior Officer |
| **Low** | 48 Hours | 120 Hours | Automated Reminder |
