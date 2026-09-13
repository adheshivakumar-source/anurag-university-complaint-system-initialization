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
 * Allowed MIME types for complaint attachments.
 */
export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
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
      /^complaints\/[A-Za-z0-9_-]+\/attachments\/[A-Za-z0-9._-]+$/,
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
          "Unsupported file type. Allowed types: JPEG, PNG, WebP, PDF, DOCX, TXT",
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
