import React from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  iconLeft: IconLeft,
  iconRight: IconRight,
  className = "",
  type = "button",
  onClick,
  ...props
}) {
  const EffectiveIcon = Icon || IconLeft;
  const baseStyles =
    "relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5 rounded-lg",
    md: "text-sm px-4 py-2.5 gap-2 rounded-xl",
    lg: "text-base px-6 py-3.5 gap-2.5 rounded-2xl",
    icon: "p-2.5 rounded-xl aspect-square",
  };

  const variantStyles = {
    primary:
      "bg-primary text-white shadow-glow hover:opacity-95 hover:shadow-lg hover:shadow-primary/30 border border-white/20 active:opacity-90",
    secondary:
      "bg-glass border border-glass-border text-text hover:bg-white/10 hover:border-primary/40 active:bg-white/5",
    ghost:
      "bg-transparent text-text hover:bg-glass hover:text-white border border-transparent",
    danger:
      "bg-danger text-white shadow-glow-danger hover:opacity-95 border border-white/20 active:opacity-90",
    cyan:
      "bg-cyan text-black font-semibold shadow-glow-cyan hover:opacity-95 border border-white/20 active:opacity-90",
    outline:
      "border border-glass-border text-text hover:border-primary hover:text-primary bg-transparent",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : EffectiveIcon ? (
        <EffectiveIcon className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      ) : null}

      <span>{children}</span>

      {!loading && IconRight && (
        <IconRight className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      )}
    </button>
  );
}
