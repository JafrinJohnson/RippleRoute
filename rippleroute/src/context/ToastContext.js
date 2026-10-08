"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import clsx from "clsx";
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X, Zap } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({
      title,
      description,
      type = "info", // success, warn, danger, info, emergency
      duration = 4500,
      action, // { label: 'Undo', onClick: () => {} }
    }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newToast = { id, title, description, type, action };

      setToasts((prev) => [...prev, newToast]);

      if (duration && duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast, removeToast }}>
      {children}

      {/* Toasts Stack Container (Strictly BOTTOM-LEFT Corner) */}
      <div
        aria-live="polite"
        className="fixed bottom-5 left-5 z-[9999] flex flex-col-reverse gap-3 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  const { title, description, type, action } = toast;

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-safe shrink-0" />,
    warn: <AlertTriangle className="w-5 h-5 text-warn shrink-0" />,
    danger: <AlertOctagon className="w-5 h-5 text-danger shrink-0" />,
    emergency: <Zap className="w-5 h-5 text-pink shrink-0 animate-pulse" />,
    info: <Info className="w-5 h-5 text-cyan shrink-0" />,
  };

  const borderGlowMap = {
    success: "border-safe/40 shadow-glow-safe",
    warn: "border-warn/40 shadow-glow-warn",
    danger: "border-danger/40 shadow-glow-danger",
    emergency: "border-pink/50 shadow-glow-pink bg-pink/5",
    info: "border-cyan/40 shadow-glow-cyan",
  };

  return (
    <div
      role="status"
      className={clsx(
        "pointer-events-auto w-full rounded-2xl bg-bg-2/95 backdrop-blur-xl border p-4 shadow-2xl transition-all duration-300",
        "animate-in slide-in-from-bottom-5 fade-in duration-300",
        borderGlowMap[type] || "border-glass-border shadow-glass"
      )}
    >
      <div className="flex items-start gap-3">
        {iconMap[type] || iconMap.info}

        <div className="flex-1 min-w-0 pr-1">
          {title && (
            <h4 className="text-xs sm:text-sm font-semibold text-text tracking-tight">
              {title}
            </h4>
          )}
          {description && (
            <p className="text-xs text-muted mt-0.5 leading-relaxed break-words">
              {description}
            </p>
          )}

          {action && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => {
                  action.onClick?.();
                  onClose();
                }}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-glass border border-glass-border text-text hover:bg-white/10 hover:text-white transition-colors"
              >
                {action.label}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          aria-label="Dismiss toast"
          className="p-1 rounded-lg text-muted hover:text-text hover:bg-white/5 transition-colors -mr-1 -mt-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
