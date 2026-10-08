import React from "react";
import clsx from "clsx";

export default function Avatar({
  name = "Kovai Swift",
  initials,
  size = "md", // sm, md, lg, xl
  status, // online, busy, offline, emergency
  className = "",
  variant = "gradient", // gradient, glass, outline
}) {
  const computedInitials =
    initials ||
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-14 h-14 text-lg font-bold",
  };

  const statusIndicatorClasses = {
    online: "bg-safe shadow-glow-safe",
    busy: "bg-warn shadow-glow-warn",
    emergency: "bg-pink shadow-glow-pink animate-pulse",
    offline: "bg-muted",
  };

  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={clsx(
          "relative flex items-center justify-center font-bold font-heading rounded-full select-none transition-transform",
          "bg-gradient-to-tr from-primary/80 via-primary to-cyan text-white shadow-md border border-white/20",
          sizeClasses[size] || sizeClasses.md,
          className
        )}
      >
        <span>{computedInitials}</span>
      </div>

      {status && (
        <span
          className={clsx(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-bg-2",
            size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3",
            statusIndicatorClasses[status] || statusIndicatorClasses.online
          )}
        />
      )}
    </div>
  );
}
