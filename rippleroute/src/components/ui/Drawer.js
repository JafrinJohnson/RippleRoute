"use client";

import React, { useEffect } from "react";
import clsx from "clsx";
import { X } from "lucide-react";

export default function Drawer({
  isOpen = false,
  onClose,
  title,
  description,
  children,
  position = "right", // right, left, bottom
  size = "md", // sm, md, lg, xl
  className = "",
}) {
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

  const widthClasses = {
    sm: "max-w-xs",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  const positionStyles = {
    right: "top-0 right-0 bottom-0 h-full border-l border-glass-border animate-in slide-in-from-right duration-300",
    left: "top-0 left-0 bottom-0 h-full border-r border-glass-border animate-in slide-in-from-left duration-300",
    bottom: "bottom-0 left-0 right-0 max-h-[85vh] border-t border-glass-border animate-in slide-in-from-bottom duration-300 rounded-t-3xl",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <div
        className={clsx(
          "fixed bg-bg-2/95 shadow-2xl backdrop-blur-2xl p-6 flex flex-col z-10 w-full overflow-y-auto",
          positionStyles[position] || positionStyles.right,
          position !== "bottom" && (widthClasses[size] || widthClasses.md),
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-glass-border mb-5 shrink-0">
          <div>
            {title && (
              <h3 className="text-lg font-bold font-heading text-text">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-muted mt-0.5">{description}</p>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close drawer"
              className="p-1.5 rounded-xl text-muted hover:text-text hover:bg-glass border border-transparent hover:border-glass-border transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
