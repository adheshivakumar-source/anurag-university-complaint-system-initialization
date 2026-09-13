"use client";
// src/components/ui/Toast.tsx
// ============================================================
// Accessible, zero-dependency Toast Notification System for AU-CTS.
// Provides user feedback for auth and domain events.
// ============================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";
import { cn } from "@/utils/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title?: string;
  duration?: number; // in ms, default 5000
  action?: ToastAction;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
  action?: ToastAction;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (type: ToastType, message: string, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, options?: ToastOptions) => {
      const title = options?.title;
      const duration = options?.duration ?? 5000;

      setToasts((prev) => {
        // Prevent exact duplicate notifications while still active
        const isDuplicate = prev.some(
          (t) => t.type === type && t.message === message && t.title === title,
        );
        if (isDuplicate) {
          return prev;
        }

        const id = `toast-${Date.now()}-${++toastCounter}`;
        return [
          ...prev,
          {
            id,
            type,
            title,
            message,
            duration,
            action: options?.action,
          },
        ];
      });
    },
    [],
  );

  const success = useCallback(
    (message: string, options?: ToastOptions) => showToast("success", message, options),
    [showToast],
  );

  const error = useCallback(
    (message: string, options?: ToastOptions) => showToast("error", message, options),
    [showToast],
  );

  const warning = useCallback(
    (message: string, options?: ToastOptions) => showToast("warning", message, options),
    [showToast],
  );

  const info = useCallback(
    (message: string, options?: ToastOptions) => showToast("info", message, options),
    [showToast],
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        success,
        error,
        warning,
        info,
        dismissToast,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback safe dummy context if rendered outside provider
    return {
      toasts: [],
      showToast: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
      dismissToast: () => {},
    };
  }
  return context;
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastMessage({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    if (toast.duration <= 0) return;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const isError = toast.type === "error";

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-[#059669] shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-[#DC2626] shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-[#D97706] shrink-0" />,
    info: <Info className="h-5 w-5 text-[#2563EB] shrink-0" />,
  };

  const styleMap = {
    success: "bg-white border-[#A7F3D0] shadow-sm",
    error: "bg-white border-[#FECACA] shadow-sm",
    warning: "bg-white border-[#FDE68A] shadow-sm",
    info: "bg-white border-[#BFDBFE] shadow-sm",
  };

  return (
    <div
      role={isError ? "alert" : "status"}
      data-testid="toast-item"
      data-toast-type={toast.type}
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-md transition-all animate-in fade-in slide-in-from-top-2",
        styleMap[toast.type],
      )}
    >
      {icons[toast.type]}
      <div className="flex-1 text-sm">
        {toast.title && (
          <h4 className="font-semibold text-[#0F172A] leading-tight mb-0.5">
            {toast.title}
          </h4>
        )}
        <p className="text-[#475569] leading-snug">{toast.message}</p>
        {toast.action && (
          <button
            type="button"
            data-testid="toast-action-btn"
            onClick={() => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
            className="mt-2 inline-flex items-center text-xs font-semibold text-[#6B1724] hover:underline underline-offset-2 cursor-pointer"
          >
            {toast.action.label} &rarr;
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Close notification"
        className="text-[#94A3B8] hover:text-[#334155] p-0.5 rounded transition-colors shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
