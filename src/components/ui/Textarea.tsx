// src/components/ui/Textarea.tsx
// Reusable textarea field primitive — AU-CTS design system
// Includes label, error state, character counter, and hint text support

import { type TextareaHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/utils/utils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, required, id, rows = 4, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const errorId = `${textareaId}-error`;
    const hintId = `${textareaId}-hint`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-semibold uppercase tracking-wider text-[#334155]"
          >
            {label}
            {required && (
              <span className="ml-1 text-[#B91C1C]" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            // Base
            "w-full rounded bg-white px-3 py-2 text-sm text-[#0F172A]",
            "border border-[#CBD5E1] placeholder:text-[#94A3B8]",
            "transition-colors duration-150 resize-y",
            // Focus
            "focus-visible:outline-none focus-visible:border-[#6B1724]",
            "focus-visible:shadow-[0_0_0_1px_#6B1724]",
            // Hover
            "hover:border-[#94A3B8]",
            // Error
            error &&
              "border-[#B91C1C] focus-visible:border-[#B91C1C] focus-visible:shadow-[0_0_0_1px_#B91C1C]",
            // Disabled
            "disabled:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60",
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={
            [error ? errorId : null, hint ? hintId : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
          required={required}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-[#64748B]">
            {hint}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs text-[#B91C1C] font-medium"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
