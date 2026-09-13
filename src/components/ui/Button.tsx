// src/components/ui/Button.tsx
// Reusable button primitive — AU-CTS design system
// Variants: primary (maroon), secondary, ghost, destructive
// Sizes: sm, md, lg

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/utils";

const buttonVariants = cva(
  // Base styles — applied to all variants
  [
    "inline-flex items-center justify-center gap-2",
    "font-semibold text-sm leading-tight tracking-wide",
    "border transition-colors duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B1724]",
    "disabled:pointer-events-none disabled:opacity-50",
    "cursor-pointer select-none",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-[#6B1724] text-white border-[#58111A]",
          "hover:bg-[#58111A]",
          "active:bg-[#4d0011]",
        ],
        secondary: [
          "bg-white text-[#334155] border-[#CBD5E1]",
          "hover:bg-[#F8FAFC] hover:border-[#94A3B8]",
          "active:bg-[#F1F5F9]",
        ],
        ghost: [
          "bg-transparent text-[#6B1724] border-transparent",
          "hover:bg-[#FFF0F0] hover:border-transparent",
        ],
        destructive: [
          "bg-[#991B1B] text-white border-[#7F1D1D]",
          "hover:bg-[#7F1D1D]",
          "active:bg-[#6B1414]",
        ],
        link: [
          "bg-transparent border-transparent text-[#6B1724]",
          "hover:underline underline-offset-4",
          "p-0 h-auto",
        ],
      },
      size: {
        sm: "h-8 px-3 text-xs rounded",
        md: "h-10 px-4 text-sm rounded",
        lg: "h-11 px-6 text-base rounded",
        icon: "h-9 w-9 rounded",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled ?? isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
