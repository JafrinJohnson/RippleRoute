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
  const { t, isTamil } = useLanguage();
  const { login, loginDemo, loading } = useAuth();
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

  const handleDemoInstantLogin = async (role, destination) => {
    const res = await loginDemo(role);
    if (res && res.ok) {
      toast({
        type: "success",
        title: "Demo Cockpit Loaded",
        description: `Logged in as ${res.profile?.name} (${role.toUpperCase()})`,
      });
      router.push(destination);
    }
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
              {t("nav_login")} — {isTamil ? "மிஷன் கட்டுப்பாட்டுக்குள் நுழைக" : "Enter Mission Control"}
            </Button>
          </form>

          {/* Demo Access Panel for Hackathon Reviewers */}
          <div className="pt-3 border-t border-glass-border">
            <div className="p-4 rounded-2xl bg-glass border border-cyan/30 shadow-glow-cyan/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  {isTamil ? "டெமோ அணுகல் (1-கிளிக் உடனடி உள்நுழைவு)" : "Demo Access (1-Click Instant Login)"}
                </span>
                <Badge variant="safe" size="sm">
                  {isTamil ? "தயார்" : "READY"}
                </Badge>
              </div>
              <p className="text-[11px] text-muted mb-3">
                {isTamil
                  ? "சான்றுகள் தேவையில்லை. முன் கட்டமைக்கப்பட்ட KovaiSwift மதிப்பீட்டு சுயவிவரங்களுடன் நேரடியாக நுழையுங்கள்:"
                  : "No credentials required. Enter directly with pre-seeded KovaiSwift evaluation profiles:"}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoInstantLogin("admin", "/admin")}
                  className="p-2.5 rounded-xl bg-primary/15 border border-primary/40 hover:bg-primary/25 text-left transition-all group interactive-hover"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-primary" />
                      {isTamil ? "நிர்வாகி" : "Admin"}
                    </span>
                    <ArrowRight className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[10px] text-slate-300 block mt-1 font-semibold">Kavya S</span>
                  <span className="text-[9px] text-muted block truncate">
                    {isTamil ? "தளவாடங்கள் குழு • KS-CBE-01" : "Logistics Team • KS-CBE-01"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoInstantLogin("driver", "/driver")}
                  className="p-2.5 rounded-xl bg-cyan/15 border border-cyan/40 hover:bg-cyan/25 text-left transition-all group interactive-hover"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-cyan" />
                      {isTamil ? "ஓட்டுநர்" : "Driver"}
                    </span>
                    <ArrowRight className="w-3 h-3 text-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[10px] text-slate-300 block mt-1 font-semibold">Murugan K</span>
                  <span className="text-[9px] text-muted block truncate">TN 38 BX 4521</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoInstantLogin("emergency", "/emergency")}
                  className="p-2.5 rounded-xl bg-pink/15 border border-pink/40 hover:bg-pink/25 text-left transition-all group interactive-hover"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-pink" />
                      {isTamil ? "அவசரப்பிரிவு" : "Emergency"}
                    </span>
                    <ArrowRight className="w-3 h-3 text-pink opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[10px] text-slate-300 block mt-1 font-semibold">Priya R</span>
                  <span className="text-[9px] text-muted block truncate">
                    TN 38 AZ 7790 &bull; {isTamil ? "மருத்துவப் பிரிவு" : "Medical"}
                  </span>
                </button>
              </div>
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
