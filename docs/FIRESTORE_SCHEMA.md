# AU-CTS — Firestore Schema Documentation

> **Document Status**: IMPLEMENTED (Types & Rules Foundation) / PLANNED (Full Data Ingestion in Phase 2–4)
> **Database**: Cloud Firestore (`au-cts-prod`)

---

## 1. Collections Hierarchy

```
/users/{userId}
/complaints/{complaintId}
  └── /audit/{auditId}
/routingRules/{category}
/departments/{departmentId}
/notifications/{notificationId}
```

---

## 2. Collection Specifications

### A. `/users/{userId}`
*Primary Key*: Firebase Auth UID (`string`)

```typescript
{
  uid: string;                    // Firebase Auth UID
  displayName: string;            // Full Name
  email: string;                  // Institutional Email
  role: "student" | "faculty" | "staff" | "department_officer" | "admin";
  departmentId?: string;          // Required if role === "department_officer"
  studentId?: string;             // Student roll / registration number
  employeeId?: string;            // Faculty / staff employee ID
  isActive: boolean;              // Account status
  createdAt: Timestamp;           // Creation timestamp
  updatedAt: Timestamp;           // Last update timestamp
}
```

### B. `/complaints/{complaintId}`
*Primary Key*: Formatted String `CTS-YYYYMMDD-XXXX` (e.g. `CTS-20260909-A4F2`)

```typescript
{
  complaintId: string;            // Unique ticket ID
  title: string;                  // Short grievance title (max 120 chars)
  description: string;            // Detailed description
  category: "hostel" | "transport" | "classroom" | "lab" | "maintenance" | "academic";
  priority: "low" | "medium" | "high" | "critical";
  status: "submitted" | "pending" | "in_review" | "resolved" | "closed" | "reopened" | "escalated" | "rejected" | "duplicate";
  
  // Reporter
  submittedBy: string;            // Submitter Auth UID
  submittedByName: string;        // Denormalized reporter name
  submittedAt: Timestamp;
  
  // Assignment & Routing
  departmentId: string;           // Target department
  assignedTo: string | null;      // Assigned officer Auth UID
  assignedToName: string | null;  // Denormalized officer name
  assignedAt: Timestamp | null;
  
  // Attachments
  attachments: Array<{
    storagePath: string;          // e.g. "complaints/CTS-20260909-A4F2/attachments/photo.jpg"
    fileName: string;
    fileSize: number;             // bytes (max 10MB)
    mimeType: string;
    uploadedAt: Timestamp;
  }>;
  
  // Lifecycle Timestamps & Resolution
  lastUpdatedAt: Timestamp;
  resolvedAt: Timestamp | null;
  closedAt: Timestamp | null;
  resolution: string | null;      // Officer resolution notes
  
  // SLA & Escalation
  slaDeadline: Timestamp;         // Target resolution deadline
  escalationLevel: 0 | 1 | 2 | 3; // Escalation count
  escalatedAt: Timestamp | null;
  
  // Duplicate & Feedback
  isDuplicate: boolean;
  duplicateOf: string | null;     // Reference complaintId
  feedback: {
    rating: 1 | 2 | 3 | 4 | 5;
    comment?: string;
    submittedAt: Timestamp;
  } | null;
  
  // Extensions
  isAnonymous: boolean;           // Default false
  tags: string[];                 // Searchable index tags
}
```

### C. `/complaints/{complaintId}/audit/{auditId}`
*Primary Key*: Auto-generated Firestore ID

```typescript
{
  auditId: string;
  complaintId: string;
  actor: string;                  // Auth UID
  actorRole: string;              // Role at time of action
  action: "complaint_created" | "complaint_assigned" | "status_changed" | "complaint_escalated" | "complaint_resolved" | "complaint_reopened" | "complaint_closed" | "complaint_rejected" | "marked_duplicate" | "attachment_added" | "feedback_submitted";
  timestamp: Timestamp;
  previousValue?: any;
  newValue?: any;
  note?: string;
}
```

### D. `/routingRules/{category}`
*Primary Key*: Category string (e.g. `hostel`, `transport`)

```typescript
{
  category: string;
  defaultAssigneeRole: string;
  departmentId: string;
  notifyRoles: string[];
  updatedBy: string;
  updatedAt: Timestamp;
}
```

### E. `/departments/{departmentId}`
*Primary Key*: Department ID (e.g. `dept-hostel`, `dept-transport`)

```typescript
{
  departmentId: string;
  name: string;
  headUserId: string;
  officerUserIds: string[];
  slaHours: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}
```

### F. `/notifications/{notificationId}`
*Primary Key*: Auto-generated Firestore ID

```typescript
{
  notificationId: string;
  userId: string;
  type: "assignment" | "status_change" | "escalation" | "resolution" | "feedback_request";
  complaintId: string;
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
}
```
