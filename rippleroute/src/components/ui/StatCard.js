"use client";

import React, { useState, useEffect } from "react";
import clsx from "clsx";
import GlassCard from "./GlassCard";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({
  title,
  value = 0,
  prefix = "",
  suffix = "",
  decimals = 0,
  durationMs = 1200,
  trend, // number: positive or negative percentage
  trendLabel,
  icon: Icon,
  variant = "primary", // primary, cyan, pink, safe, warn
  className = "",
  helperText,
}) {
  const [displayValue, setDisplayValue] = useState(0);

  // Smooth requestAnimationFrame animated counting
  useEffect(() => {
    let startTimestamp = null;
    let animationFrameId;
    const target = typeof value === "number" ? value : parseFloat(value) || 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / durationMs, 1);

      // Ease out cubic: 1 - pow(1 - progress, 3)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = easeProgress * target;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value, durationMs]);

  const variantGlowMap = {
    primary: "border-primary/30 hover:border-primary/60 shadow-glow",
    cyan: "border-cyan/30 hover:border-cyan/60 shadow-glow-cyan",
    pink: "border-pink/30 hover:border-pink/60 shadow-glow-pink",
    safe: "border-safe/30 hover:border-safe/60 shadow-glow-safe",
    warn: "border-warn/30 hover:border-warn/60 shadow-glow-warn",
  };

  const iconBgMap = {
    primary: "bg-primary/15 text-primary border-primary/30",
    cyan: "bg-cyan/15 text-cyan border-cyan/30",
    pink: "bg-pink/15 text-pink border-pink/30",
    safe: "bg-safe/15 text-safe border-safe/30",
    warn: "bg-warn/15 text-warn border-warn/30",
  };

  const formattedNumber = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <GlassCard
      hover
      className={clsx(
        "flex flex-col justify-between transition-all duration-300",
        variantGlowMap[variant] || variantGlowMap.primary,
        className
      )}
    >
      {/* Top row: Label & Icon */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">
          {title}
        </span>

        {Icon && (
          <div
            className={clsx(
              "p-2.5 rounded-xl border flex items-center justify-center shrink-0 shadow-sm",
              iconBgMap[variant] || iconBgMap.primary
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Middle row: Big animated value */}
      <div className="flex items-baseline gap-1 my-1">
        {prefix && (
          <span className="text-lg sm:text-xl font-bold text-muted">
            {prefix}
          </span>
        )}
        <span className="text-2xl sm:text-4xl font-extrabold font-heading text-text tracking-tight">
          {formattedNumber}
        </span>
        {suffix && (
          <span className="text-sm sm:text-base font-semibold text-muted ml-0.5">
            {suffix}
          </span>
        )}
      </div>

      {/* Bottom row: Trend or helper text */}
      {(trend !== undefined || helperText) && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-glass-border text-xs">
          {trend !== undefined && (
            <span
              className={clsx(
                "inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-md",
                trend >= 0
                  ? "text-safe bg-safe/10"
                  : "text-danger bg-danger/10"
              )}
            >
              {trend >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trend > 0 ? `+${trend}%` : `${trend}%`}
            </span>
          )}
          <span className="text-muted truncate">
            {trendLabel || helperText}
          </span>
        </div>
      )}
    </GlassCard>
  );
}
