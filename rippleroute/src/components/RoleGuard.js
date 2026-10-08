"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function RoleGuard({ children, allowedRole }) {
  const { profile, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // 1. Not authenticated -> redirect to login
    if (!profile) {
      router.push("/login");
      return;
    }

    // 2. Role mismatch -> redirect to their assigned dashboard
    if (allowedRole && profile.role !== allowedRole) {
      const destination =
        profile.role === "admin"
          ? "/admin"
          : profile.role === "driver"
          ? "/driver"
          : profile.role === "emergency"
          ? "/emergency"
          : "/login";
      router.push(destination);
    }
  }, [profile, loading, allowedRole, router]);

  // Branded mission-control loading screen while evaluating session
  if (loading || !profile || (allowedRole && profile.role !== allowedRole)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
        <div className="flex flex-col items-center gap-5 text-center">
          {/* Animated concentric Ripple Wave Logo */}
          <div className="relative w-16 h-16 rounded-3xl bg-glass border border-glass-border shadow-glow flex items-center justify-center">
            <svg
              viewBox="0 0 44 44"
              fill="none"
              className="w-10 h-10 animate-pulse"
            >
              <circle
                cx="22"
                cy="22"
                r="18"
                stroke="var(--primary)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <circle
                cx="22"
                cy="22"
                r="12"
                stroke="var(--cyan)"
                strokeWidth="1.8"
              />
              <path
                d="M14 26C16 20 20 16 25 15C29 14.3 32 17 33 22"
                stroke="var(--primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="29" cy="11" r="3" fill="var(--cyan)" />
            </svg>
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold font-heading text-text">
              Ripple<span className="text-primary font-black">Route</span>
            </h3>
            <p className="text-xs text-muted">
              {t("btn_loading")} — Verifying KovaiSwift Access Credentials
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
