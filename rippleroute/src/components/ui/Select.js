import React from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

export default function Select({
  label,
  options = [],
  value,
  onChange,
  error,
  helperText,
  icon: Icon,
  className = "",
  containerClassName = "",
  id,
  placeholder,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={clsx("w-full flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-medium text-muted tracking-wide"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-muted pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <select
          id={selectId}
          value={value}
          onChange={onChange}
          className={clsx(
            "w-full bg-glass text-text text-sm rounded-xl px-4 py-2.5 border transition-all duration-200 outline-none appearance-none cursor-pointer",
            "border-glass-border focus:border-primary focus:ring-2 focus:ring-primary/20",
            Icon && "pl-10",
            "pr-10",
            error ? "border-danger focus:border-danger focus:ring-danger/20" : "",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-bg-2 text-muted">
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const optVal = typeof opt === "string" ? opt : opt.value;
            const optLabel = typeof opt === "string" ? opt : opt.label;
            return (
              <option
                key={optVal}
                value={optVal}
                className="bg-bg-2 text-text py-1"
              >
                {optLabel}
              </option>
            );
          })}
        </select>

        <div className="absolute right-3.5 text-muted pointer-events-none">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-muted">{helperText}</span>
      ) : null}
    </div>
  );
}
