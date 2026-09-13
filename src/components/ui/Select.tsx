// src/components/ui/Select.tsx
// Reusable select dropdown primitive — AU-CTS design system
// Includes label, error state, and hint text support

import { type SelectHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  options?: SelectOption[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      hint,
      required,
      id,
      options,
      children,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const errorId = `${selectId}-error`;
    const hintId = `${selectId}-hint`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
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
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              // Base
              "w-full appearance-none rounded bg-white px-3 py-2 pr-9 text-sm text-[#0F172A]",
              "border border-[#CBD5E1] transition-colors duration-150",
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
          >
            {options
              ? options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          {/* Custom Chevron Indicator */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#64748B]"
            aria-hidden="true"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

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

Select.displayName = "Select";

export { Select };
