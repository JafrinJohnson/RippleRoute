import React from "react";
import clsx from "clsx";

export default function Input({
  label,
  error,
  helperText,
  icon: Icon,
  className = "",
  containerClassName = "",
  id,
  type = "text",
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={clsx("w-full flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-muted tracking-wide flex items-center justify-between"
        >
          <span>{label}</span>
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-muted pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          type={type}
          className={clsx(
            "w-full bg-glass text-text placeholder-muted/60 text-sm rounded-xl px-4 py-2.5 border transition-all duration-200 outline-none",
            "border-glass-border focus:border-primary focus:ring-2 focus:ring-primary/20",
            Icon && "pl-10",
            error ? "border-danger focus:border-danger focus:ring-danger/20" : "",
            className
          )}
          {...props}
        />
      </div>

      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-muted">{helperText}</span>
      ) : null}
    </div>
  );
}
