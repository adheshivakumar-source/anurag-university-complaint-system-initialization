// src/components/ui/UniversityLogo.tsx
// Standardized Anurag University Brand Mark Component
// Uses the authentic university emblem mark.

import Image from "next/image";
import { cn } from "@/utils/utils";

interface UniversityLogoProps {
  className?: string;
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
}

export function UniversityLogo({
  className,
  variant = "dark",
  size = "md",
  showSubtitle = true,
}: UniversityLogoProps) {
  const isLight = variant === "light";

  const sizeDimensions = {
    sm: { img: 28, title: "text-xs", sub: "text-[9px]" },
    md: { img: 36, title: "text-sm", sub: "text-[10px]" },
    lg: { img: 48, title: "text-base font-bold", sub: "text-xs" },
  }[size];

  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-lg p-1 transition-transform",
          isLight
            ? "bg-white/10 border border-white/20 shadow-sm"
            : "bg-[#6B1724]/5 border border-[#6B1724]/15 shadow-sm",
        )}
      >
        <Image
          src="/images/au/anurag_favicon.png"
          alt="Anurag University Emblem"
          width={sizeDimensions.img}
          height={sizeDimensions.img}
          className="object-contain"
          priority
        />
      </div>

      <div className="flex flex-col justify-center min-w-0">
        <span
          className={cn(
            "font-bold leading-tight tracking-tight truncate",
            sizeDimensions.title,
            isLight ? "text-white" : "text-[#0F172A]",
          )}
          style={{ fontFamily: "'Source Serif 4', serif" }}
        >
          Anurag University
        </span>
        {showSubtitle && (
          <span
            className={cn(
              "font-medium leading-tight truncate tracking-wide",
              sizeDimensions.sub,
              isLight ? "text-white/70" : "text-[#64748B]",
            )}
          >
            Complaint Tracking System
          </span>
        )}
      </div>
    </div>
  );
}
