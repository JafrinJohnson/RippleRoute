import React from "react";
import clsx from "clsx";

export default function Badge({
  children,
  variant = "info",
  size = "md",
  pulse = false,
  className = "",
  icon: Icon,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center font-medium rounded-full border transition-colors select-none";

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3.5 py-1.5 gap-2",
  };

  const variantStyles = {
    safe: "bg-safe/10 border-safe/30 text-safe shadow-[0_0_12px_rgba(61,255,154,0.15)]",
    warn: "bg-warn/10 border-warn/30 text-warn shadow-[0_0_12px_rgba(255,176,32,0.15)]",
    danger: "bg-danger/10 border-danger/30 text-danger shadow-[0_0_12px_rgba(255,77,79,0.15)]",
    info: "bg-cyan/10 border-cyan/30 text-cyan shadow-[0_0_12px_rgba(0,229,255,0.15)]",
    emergency: "bg-pink/15 border-pink/40 text-pink font-semibold shadow-[0_0_16px_rgba(255,61,139,0.25)] animate-pulse-subtle",
    neutral: "bg-white/5 border-white/10 text-muted",
  };

  const dotColors = {
    safe: "bg-safe",
    warn: "bg-warn",
    danger: "bg-danger",
    info: "bg-cyan",
    emergency: "bg-pink",
    neutral: "bg-muted",
  };

  return (
    <span
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={clsx(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              dotColors[variant] || "bg-current"
            )}
          />
          <span
            className={clsx(
              "relative inline-flex rounded-full h-2 w-2",
              dotColors[variant] || "bg-current"
            )}
          />
        </span>
      )}
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{children}</span>
    </span>
  );
}
