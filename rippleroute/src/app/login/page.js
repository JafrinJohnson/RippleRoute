"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import {
  GlassCard,
  Button,
  Badge,
  Input,
  PasswordInput,
  useToast,
} from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  LogIn,
  UserCheck,
  Mail,
  ArrowRight,
  ShieldAlert,
  Truck,
  HeartPulse,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { login, loading } = useAuth();
  const { toast } = useToast();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError(t("val_required"));
      return;
    }
    if (!password) {
      setError(t("val_required"));
      return;
    }

    const res = await login(identifier, password);

    if (res && res.ok) {
      const activeRole = res.role || res.profile?.role || "admin";
      const displayName = res.profile?.name || "Operator";
      toast({
        type: "success",
        title: t("auth_success_login"),
        description: `Welcome back, ${displayName} (${activeRole.toUpperCase()})`,
      });

      // Role-agnostic routing by profile role
      const destination =
        activeRole === "admin"
          ? "/admin"
          : activeRole === "driver"
          ? "/driver"
          : "/emergency";
      router.push(destination);
    } else {
      setError(res?.error || "Authentication failed. Please verify credentials.");
      toast({
        type: "danger",
        title: "Login Error",
        description: res?.error || "Authentication failed.",
      });
    }
  };

  // 1-Click quick fill demo accounts for hackathon judges & testers
  const fillDemoAccount = (demoId, demoPass) => {
    setIdentifier(demoId);
    setPassword(demoPass);
    setError("");
  };

  return (
    <AuthLayout>
      <GlassCard padding="p-6 sm:p-9" className="border-glass-border shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col gap-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black font-heading text-text">
                {t("nav_login")}
              </h1>
              <p className="text-xs text-muted mt-0.5">
                {t("auth_login_subtitle")}
              </p>
            </div>
            <Badge variant="info" size="sm">
              TERMINAL SECURE
            </Badge>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-xs text-danger font-medium animate-in fade-in">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <Input
              label={t("auth_login_identifier")}
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setError("");
              }}
              icon={UserCheck}
              placeholder="e.g. admin01 or operator@gmail.com"
              required
            />

            <PasswordInput
              label={t("auth_password")}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="••••••••••••"
              required
            />

            {/* Remember Me Checkbox & Reset Link */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-muted hover:text-text">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-glass-border bg-glass text-primary focus:ring-primary/20"
                />
                <span>{t("auth_remember_me")}</span>
              </label>

              <span className="text-primary hover:underline cursor-pointer">
                {t("auth_forgot_pass")}
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-4"
              loading={loading}
              iconRight={ArrowRight}
            >
              {t("nav_login")} — Enter Mission Control
            </Button>
          </form>

          {/* Quick Demo Credentials Bar for Easy Evaluation */}
          <div className="pt-3 border-t border-glass-border">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-2 text-center">
              Quick 1-Click Evaluation Accounts
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount("admin01", "password123")}
                className="p-2 rounded-xl bg-glass border border-glass-border hover:border-primary/50 text-left transition-all"
              >
                <div className="flex items-center gap-1.5 text-primary text-[11px] font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </div>
                <span className="text-[10px] text-muted block mt-0.5 truncate">admin01</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount("drive01", "password123")}
                className="p-2 rounded-xl bg-glass border border-glass-border hover:border-cyan/50 text-left transition-all"
              >
                <div className="flex items-center gap-1.5 text-cyan text-[11px] font-bold">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Driver</span>
                </div>
                <span className="text-[10px] text-muted block mt-0.5 truncate">drive01</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount("emerg01", "password123")}
                className="p-2 rounded-xl bg-glass border border-glass-border hover:border-pink/50 text-left transition-all"
              >
                <div className="flex items-center gap-1.5 text-pink text-[11px] font-bold">
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span>Emergency</span>
                </div>
                <span className="text-[10px] text-muted block mt-0.5 truncate">emerg01</span>
              </button>
            </div>
          </div>

          {/* Link to Signup */}
          <div className="text-center pt-2 text-xs text-muted border-t border-glass-border">
            <span>{t("auth_dont_have_acc")} </span>
            <Link href="/signup" className="text-primary font-bold hover:underline">
              {t("auth_btn_signup")}
            </Link>
          </div>

        </div>
      </GlassCard>
    </AuthLayout>
  );
}
