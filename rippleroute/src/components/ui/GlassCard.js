import React from "react";
import clsx from "clsx";

export default function GlassCard({
  children,
  className = "",
  hover = false,
  glow = false,
  padding = "p-6",
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "relative rounded-2xl bg-glass backdrop-blur-xl border border-glass-border shadow-glass transition-all duration-300",
        // Soft inner glow highlight
        "before:absolute before:inset-0 before:rounded-2xl before:border before:border-white/10 before:pointer-events-none before:mask-image-[linear-gradient(to_bottom,black,transparent)]",
        hover && "hover:border-primary/40 hover:shadow-glow hover:-translate-y-0.5 cursor-pointer",
        glow && "shadow-glow border-primary/40",
        padding,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
