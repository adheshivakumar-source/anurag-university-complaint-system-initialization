// src/components/ui/Input.tsx
// Reusable input field primitive — AU-CTS design system
// Includes label, error state, and hint text support

import { type InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, required, id, type = "text", ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
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
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            // Base
            "w-full rounded bg-white px-3 py-2 text-sm text-[#0F172A]",
            "border border-[#CBD5E1] placeholder:text-[#94A3B8]",
            "transition-colors duration-150",
            // Focus
            "focus-visible:outline-none focus-visible:border-[#6B1724]",
            "focus-visible:shadow-[0_0_0_1px_#6B1724]",
            // Hover
            "hover:border-[#94A3B8]",
            // Error
            error && "border-[#B91C1C] focus-visible:border-[#B91C1C] focus-visible:shadow-[0_0_0_1px_#B91C1C]",
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

Input.displayName = "Input";

export { Input };
