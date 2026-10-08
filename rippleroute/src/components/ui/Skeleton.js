import React from "react";
import clsx from "clsx";

export default function Skeleton({
  className = "",
  variant = "rectangular", // text, circular, rectangular
  width,
  height,
  ...props
}) {
  const variantStyles = {
    text: "h-4 rounded-md",
    circular: "rounded-full aspect-square",
    rectangular: "rounded-xl",
  };

  return (
    <div
      className={clsx(
        "relative overflow-hidden bg-glass border border-glass-border/40 select-none",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        variantStyles[variant],
        className
      )}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
      }}
      {...props}
    />
  );
}
