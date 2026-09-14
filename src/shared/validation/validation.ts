// src/lib/complaints/validation.ts
// ============================================================
// Complaint Validation Schemas for AU-CTS.
// Centralized Zod schemas for client form validation and
// server-side mutation gates.
// ============================================================

import { z } from "zod";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  type ComplaintCategory,
  type ComplaintPriority,
  type ComplaintStatus,
} from "@/shared/types";

/**
 * Allowed institutional email domain for Anurag University.
 */
export const ANURAG_EMAIL_DOMAIN = "anurag.edu.in";

/**
 * Standard Anurag University student roll number format:
 * Exactly 10 alphanumeric characters starting with 2 digits (e.g. 26eg512d03, 21ag1a0501, 22eg105a01).
 */
export const ANURAG_ROLL_NUMBER_REGEX = /^[0-9]{2}[a-z0-9]{8}$/i;

/**
 * Validates whether an email address belongs strictly to the authorized
 * Anurag University domain (@anurag.edu.in).
 * Rejects subdomains (e.g. sub.anurag.edu.in), suffix attacks (e.g. anurag.edu.in.attacker.com),
 * whitespace, and external domains (e.g. gmail.com, outlook.com).
 */
export function isAnuragInstitutionalEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }

  const normalized = email.trim().toLowerCase();

  // Basic sanity check: no spaces inside email
  if (/\s/.test(normalized)) {
    return false;
  }

  const parts = normalized.split("@");
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domainPart] = parts;

  if (!localPart || localPart.length === 0) {
    return false;
  }

  return domainPart === ANURAG_EMAIL_DOMAIN;
}

/**
 * Validates whether an email address belongs strictly to the authorized
 * Anurag University domain (@anurag.edu.in) AND conforms to the Student roll-number format.
 */
export function isAnuragStudentEmail(email: string | null | undefined): boolean {
  if (!isAnuragInstitutionalEmail(email)) {
    return false;
  }

  const normalized = (email as string).trim().toLowerCase();
  const [localPart] = normalized.split("@");

  return ANURAG_ROLL_NUMBER_REGEX.test(localPart);
}

/**
 * General institutional email validator for Anurag University accounts.
 */
export function isAnuragEmail(email: string | null | undefined): boolean {
  return isAnuragInstitutionalEmail(email);
}

/**
 * Zod schema for Anurag University institutional email validation.
 */
export const anuragInstitutionalEmailSchema = z
  .string()
  .trim()
  .min(1, "Email address is required")
  .email("Please enter a valid email address.")
  .refine(
    (val) => isAnuragInstitutionalEmail(val),
    {
      message: "Please enter a valid email address.",
    },
  );

/**
 * Zod schema for Anurag University student roll-number email validation.
 */
export const anuragStudentEmailSchema = z
  .string()
  .trim()
  .min(1, "Email address is required")
  .email("Please enter a valid email address.")
  .refine(
    (val) => isAnuragStudentEmail(val),
    {
      message: "Please enter a valid email address.",
    },
  );

/**
 * Default institutional email schema.
 */
export const anuragEmailSchema = anuragInstitutionalEmailSchema;

/**
 * Allowed MIME types for complaint attachments.
 */
export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_ATTACHMENTS_COUNT = 3;

/**
 * Schema for individual attachment metadata references.
 */
export const attachmentRefSchema = z.object({
  storagePath: z
    .string()
    .min(1, "Storage path is required")
    .max(500, "Storage path is too long")
    .regex(
      /^(?:au-cts\/)?complaints\/[A-Za-z0-9_-]+\/attachments\/[A-Za-z0-9._-]+$/,
      "Invalid storage path structure",
    ),
  fileName: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name must not exceed 255 characters"),
  fileSize: z
    .number()
    .int()
    .positive("File size must be positive")
    .max(
      MAX_ATTACHMENT_SIZE_BYTES,
      "Attachment exceeds maximum allowed size of 10MB",
    ),
  mimeType: z
    .string()
    .refine(
      (mime) =>
        ALLOWED_ATTACHMENT_MIME_TYPES.includes(
          mime as (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number],
        ),
      {
        message:
          "File must be JPG, PNG, WEBP, or PDF and smaller than 10 MB.",
      },
    ),
  uploadedAt: z.coerce.date().optional(),
});

export type AttachmentRefInput = z.infer<typeof attachmentRefSchema>;

/**
 * Array of valid category values extracted from domain constants.
 */
const categoryValues = Object.values(
  COMPLAINT_CATEGORIES,
) as [ComplaintCategory, ...ComplaintCategory[]];

/**
 * Array of valid priority values extracted from domain constants.
 */
const priorityValues = Object.values(
  COMPLAINT_PRIORITIES,
) as [ComplaintPriority, ...ComplaintPriority[]];

/**
 * Array of valid status values extracted from domain constants.
 */
const statusValues = Object.values(
  COMPLAINT_STATUSES,
) as [ComplaintStatus, ...ComplaintStatus[]];

/**
 * Validation schema for new complaint creation.
 */
export const createComplaintSchema = z.object({
  title: z
    .string()
    .trim()
    .min(10, "Title must be at least 10 characters")
    .max(120, "Title must not exceed 120 characters"),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must not exceed 2000 characters"),
  category: z.enum(categoryValues, {
    message: "Please select a valid complaint category",
  }),
  priority: z.enum(priorityValues, {
    message: "Please select a valid priority level",
  }),
  location: z
    .string()
    .trim()
    .max(120, "Location details must not exceed 120 characters")
    .optional()
    .nullable(),
  attachments: z
    .array(attachmentRefSchema)
    .max(
      MAX_ATTACHMENTS_COUNT,
      `Maximum ${MAX_ATTACHMENTS_COUNT} attachments permitted`,
    )
    .optional()
    .default([]),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type CreateComplaintFormData = z.input<typeof createComplaintSchema>;

/**
 * Validation schema for status transitions.
 */
export const updateComplaintStatusSchema = z.object({
  complaintId: z.string().min(1, "Complaint ID is required"),
  nextStatus: z.enum(statusValues, {
    message: "Invalid target status",
  }),
  note: z
    .string()
    .trim()
    .max(500, "Note must not exceed 500 characters")
    .optional(),
  resolution: z
    .string()
    .trim()
    .max(2000, "Resolution details must not exceed 2000 characters")
    .optional(),
  duplicateOf: z
    .string()
    .trim()
    .max(50, "Duplicate complaint ID must not exceed 50 characters")
    .optional(),
});

export type UpdateComplaintStatusInput = z.infer<
  typeof updateComplaintStatusSchema
>;

/**
 * Validation schema for resolving a complaint (Phase 4.2.2).
 */
export const resolveComplaintSchema = z.object({
  complaintId: z.string().min(1, "Complaint ID is required"),
  resolution: z
    .string()
    .trim()
    .min(10, "Resolution must be at least 10 characters")
    .max(2000, "Resolution details must not exceed 2000 characters"),
});

export type ResolveComplaintInput = z.infer<typeof resolveComplaintSchema>;

/**
 * Validation schema for complaint assignment.
 */
export const assignComplaintSchema = z.object({
  complaintId: z.string().min(1, "Complaint ID is required"),
  officerUid: z.string().min(1, "Officer UID is required"),
  officerName: z.string().min(1, "Officer name is required"),
  note: z
    .string()
    .trim()
    .max(500, "Note must not exceed 500 characters")
    .optional(),
});

export type AssignComplaintInput = z.infer<typeof assignComplaintSchema>;

/**
 * Validation schema for submitter feedback.
 */
export const submitFeedbackSchema = z.object({
  complaintId: z.string().min(1, "Complaint ID is required"),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  comment: z
    .string()
    .trim()
    .max(500, "Feedback comment must not exceed 500 characters")
    .optional(),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
