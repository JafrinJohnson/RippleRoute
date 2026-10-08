import React from "react";
import clsx from "clsx";

export default function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  action,
  compact = false,
  className = "",
}) {
  return (
    <div
      className={clsx(
        "relative rounded-2xl bg-glass border border-glass-border/70 text-center flex flex-col items-center justify-center transition-all duration-300",
        compact ? "p-4 sm:p-5" : "p-6 sm:p-8",
        className
      )}
    >
      {/* Icon or Emoji with glowing aura */}
      <div className="relative mb-3 flex items-center justify-center">
        <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl pointer-events-none" />
        <div className="relative w-12 h-12 rounded-2xl bg-white/[0.04] border border-glass-border flex items-center justify-center shadow-glass">
          {Icon ? (
            <Icon className="w-6 h-6 text-cyan-400" />
          ) : emoji ? (
            <span className="text-2xl">{emoji}</span>
          ) : (
            <span className="text-xl">📦</span>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm sm:text-base font-bold font-heading text-text">
        {title}
      </h4>

      {/* Description */}
      {description && (
        <p className="text-xs text-muted max-w-sm mt-1 leading-relaxed">
          {description}
        </p>
      )}

      {/* Optional Action Button */}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
