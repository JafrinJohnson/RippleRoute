"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function PasswordInput({
  label,
  error,
  helperText,
  className = "",
  containerClassName = "",
  id,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : "password-input");

  return (
    <div className={clsx("w-full flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-muted tracking-wide"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-muted pointer-events-none">
          <Lock className="w-4 h-4" />
        </div>

        <input
          id={inputId}
          type={showPassword ? "text" : "password"}
          className={clsx(
            "w-full bg-glass text-text placeholder-muted/60 text-sm rounded-xl pl-10 pr-11 py-2.5 border transition-all duration-200 outline-none",
            "border-glass-border focus:border-primary focus:ring-2 focus:ring-primary/20",
            error ? "border-danger focus:border-danger focus:ring-danger/20" : "",
            className
          )}
          {...props}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 text-muted hover:text-text transition-colors p-1 rounded-lg focus:outline-none"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>

      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-muted">{helperText}</span>
      ) : null}
    </div>
  );
}
