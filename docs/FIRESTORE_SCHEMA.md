# AU-CTS — Firestore Schema Documentation

> **Document Status**: IMPLEMENTED (/users collection, types, security rules) / PLANNED (complaint lifecycle in Phase 3–4)
> **Database Target**: Cloud Firestore (`au-cts-prod`)

---

## 1. Collections Hierarchy

```
/users/{userId}                    [IMPLEMENTED - Phase 2]
/complaints/{complaintId}          [PLANNED - Phase 3]
  └── /audit/{auditId}             [PLANNED - Phase 3/4]
/routingRules/{category}           [PLANNED - Phase 3]
/departments/{departmentId}        [PLANNED - Phase 3]
/notifications/{notificationId}    [PLANNED - Phase 6]
```

---

## 2. Collection Specifications

### A. `/users/{userId}` — IMPLEMENTED (Phase 2)
*Primary Key*: Firebase Auth UID (`string`)

```typescript
{
  uid: string;                    // Firebase Auth UID
  displayName: string;            // Full Name (e.g. "Dr. Suresh Reddy")
  email: string;                  // Institutional Email (e.g. "suresh@anurag.edu.in")
  role: "student" | "faculty" | "staff" | "department_officer" | "admin";
  departmentId?: string | null;   // e.g. "dept-hostel", "dept-transport" (for department_officer)
  studentId?: string | null;      // Student roll number (e.g. "21AG1A0501")
  employeeId?: string | null;     // Faculty/Staff employee ID (e.g. "AU-EMP-408")
  isActive: boolean;              // Account status flag
  createdAt: Timestamp;           // Document creation timestamp
  updatedAt: Timestamp;           // Last update timestamp
  lastLoginAt: Timestamp | null;  // Last successful sign-in timestamp
}
```

---

### B. `/complaints/{complaintId}` — PLANNED (Phase 3)
*Primary Key*: Formatted String `CTS-YYYYMMDD-XXXX` (e.g. `CTS-20260910-B8A2`)

```typescript
{
  complaintId: string;
  title: string;
  description: string;
  category: "hostel" | "transport" | "classroom" | "lab" | "maintenance" | "academic";
  priority: "low" | "medium" | "high" | "critical";
  status: "submitted" | "pending" | "in_review" | "resolved" | "closed" | "reopened" | "escalated" | "rejected" | "duplicate";
  submittedBy: string;
  submittedByName: string;
  submittedAt: Timestamp;
  departmentId: string;
  assignedTo: string | null;
  assignedToName: string | null;
  assignedAt: Timestamp | null;
  attachments: Array<{
    storagePath: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Timestamp;
  }>;
  lastUpdatedAt: Timestamp;
  resolvedAt: Timestamp | null;
  closedAt: Timestamp | null;
  resolution: string | null;
  slaDeadline: Timestamp;
  escalationLevel: 0 | 1 | 2 | 3;
  escalatedAt: Timestamp | null;
  isDuplicate: boolean;
  duplicateOf: string | null;
  feedback: {
    rating: 1 | 2 | 3 | 4 | 5;
    comment?: string;
    submittedAt: Timestamp;
  } | null;
  isAnonymous: boolean;
  tags: string[];
}
```
