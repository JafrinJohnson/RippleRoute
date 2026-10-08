"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from "react";
import clsx from "clsx";
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X, Zap } from "lucide-react";

/**
 * Creates a callable function object that supports:
 * 1. toast({ title, description, variant, actions, duration })
 * 2. toast.success(message, options)
 * 3. toast.error(message, options)
 * 4. toast.warning(message, options)
 * 5. toast.info(message, options)
 * 6. toast.danger(message, options)
 * 7. const { toast } = useToast() (via .toast self-reference)
 */
function createToastFunction(addToast, removeToast = () => {}) {
  const toastFn = function (arg, options = {}) {
    if (!arg) return;
    if (typeof arg === "string") {
      const type = options.variant || options.type || "info";
      const normalizedType =
        type === "error" ? "danger" : type === "warning" ? "warn" : type;
      const defaultDuration = normalizedType === "info" ? 3000 : 4500;
      return addToast({
        title: arg,
        description: options.description,
        type: normalizedType,
        duration: options.duration ?? defaultDuration,
        action: options.action || options.actions,
      });
    }

    const type = arg.variant || arg.type || "info";
    const normalizedType =
      type === "error" ? "danger" : type === "warning" ? "warn" : type;
    const defaultDuration = normalizedType === "info" ? 3000 : 4500;
    return addToast({
      title: arg.title,
      description: arg.description,
      type: normalizedType,
      duration: arg.duration ?? defaultDuration,
      action: arg.action || arg.actions,
    });
  };

  const createHelper = (type) => (message, options = {}) => {
    const title = typeof message === "string" ? message : message?.title || "";
    const description =
      typeof message === "string"
        ? options.description
        : message?.description;
    const normalizedType =
      type === "error" ? "danger" : type === "warning" ? "warn" : type;
    const defaultDuration = normalizedType === "info" ? 3000 : 4500;
    const duration =
      options.duration ?? (typeof message === "object" ? message?.duration : undefined) ?? defaultDuration;
    const action =
      options.action ||
      options.actions ||
      (typeof message === "object" ? message?.action || message?.actions : undefined);

    return addToast({
      title,
      description,
      type: normalizedType,
      duration,
      action,
    });
  };

  toastFn.success = createHelper("success");
  toastFn.error = createHelper("danger");
  toastFn.danger = createHelper("danger");
  toastFn.warning = createHelper("warn");
  toastFn.warn = createHelper("warn");
  toastFn.info = createHelper("info");

  // Self-references for destructuring support
  toastFn.toast = toastFn;
  toastFn.addToast = toastFn;
  toastFn.showToast = toastFn;
  toastFn.removeToast = removeToast;

  return toastFn;
}

// Default no-op toast function for safe usage outside provider
const noop = () => {};
const defaultToast = createToastFunction(noop, noop);
const ToastContext = createContext(defaultToast);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastsRef = useRef([]);
  toastsRef.current = toasts;
  const timersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id));
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({
      title,
      description,
      type = "info", // success, warn, danger, info, emergency
      duration,
      action, // { label: 'Undo', onClick: () => {} }
    }) => {
      // Info toasts auto-dismiss after 3s, other default to 4500ms
      const effectiveDuration = duration !== undefined ? duration : (type === "info" ? 3000 : 4500);

      // De-duplication: if a toast with the same title is already visible, refresh its timer and do not add another
      const existing = toastsRef.current.find((t) => t.title && t.title === title);
      if (existing) {
        if (timersRef.current.has(existing.id)) {
          clearTimeout(timersRef.current.get(existing.id));
        }
        if (effectiveDuration && effectiveDuration > 0) {
          const timer = setTimeout(() => {
            removeToast(existing.id);
          }, effectiveDuration);
          timersRef.current.set(existing.id, timer);
        }
        return existing.id;
      }

      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newToast = { id, title, description, type, action };

      setToasts((prev) => {
        // Limit visible toasts to 3 maximum (drop the oldest)
        const updated = [...prev, newToast];
        if (updated.length > 3) {
          const dropped = updated.slice(0, updated.length - 3);
          dropped.forEach((d) => {
            if (timersRef.current.has(d.id)) {
              clearTimeout(timersRef.current.get(d.id));
              timersRef.current.delete(d.id);
            }
          });
          return updated.slice(updated.length - 3);
        }
        return updated;
      });

      if (effectiveDuration && effectiveDuration > 0) {
        const timer = setTimeout(() => {
          removeToast(id);
        }, effectiveDuration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [removeToast]
  );

  const toastHandler = useMemo(
    () => createToastFunction(addToast, removeToast),
    [addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={toastHandler}>
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
  return context || defaultToast;
}
