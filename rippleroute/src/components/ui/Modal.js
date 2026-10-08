"use client";

import React, { useEffect } from "react";
import clsx from "clsx";
import { X } from "lucide-react";

export default function Modal({
  isOpen = false,
  onClose,
  title,
  description,
  children,
  size = "md", // sm, md, lg, xl
  className = "",
}) {
  // Handle ESC key dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Dialog Card */}
      <div
        className={clsx(
          "relative w-full rounded-3xl bg-bg-2/95 border border-glass-border shadow-2xl backdrop-blur-2xl p-6 sm:p-7 text-text z-10",
          "animate-in zoom-in-95 duration-200",
          "before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/10 before:pointer-events-none",
          sizeClasses[size] || sizeClasses.md,
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && (
              <h3 className="text-lg sm:text-xl font-bold font-heading tracking-tight text-text">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-muted mt-1">
                {description}
              </p>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 -mr-1 -mt-1 rounded-xl text-muted hover:text-text hover:bg-glass border border-transparent hover:border-glass-border transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
