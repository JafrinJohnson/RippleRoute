"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import {
  GlassCard,
  Button,
  Badge,
  Input,
  Select,
  PasswordInput,
  useToast,
} from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldAlert,
  Truck,
  HeartPulse,
  ArrowRight,
  Lock,
  Mail,
  User,
  CheckCircle,
} from "lucide-react";

function SignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleParam = searchParams.get("role") || "admin";

  const { t } = useLanguage();
  const { login, user } = useAuth();
  const { toast } = useToast();

  const [role, setRole] = useState(roleParam);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (roleParam && ["admin", "driver", "emergency"].includes(roleParam)) {
      setRole(roleParam);
    }
  }, [roleParam]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login(role);
      if (res.success) {
        toast({
          type: "success",
          title: "Session Authenticated",
          description: `Logged in as ${res.user.displayName} (${role.toUpperCase()})`,
        });
      }
    } catch (err) {
      toast({
        type: "danger",
        title: "Auth Error",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const roleMeta = {
    admin: {
      badge: "MANAGEMENT RADAR",
      variant: "primary",
      icon: ShieldAlert,
      title: t("role_admin_title"),
      desc: "Coimbatore centralized dispatch, hazard marking & QARS swarm coordination.",
    },
    driver: {
      badge: "COCKPIT HUD",
      variant: "cyan",
      icon: Truck,
      title: t("role_driver_title"),
      desc: "Turn-by-turn ghat corridor guidance, QARS instant bypass & road alerts.",
    },
    emergency: {
      badge: "PRIORITY ALPHA",
      variant: "danger",
      icon: HeartPulse,
      title: t("role_emergency_title"),
      desc: "Dedicated green-corridor priority for medical oxygen & perishable cargo.",
    },
  };

  const currentMeta = roleMeta[role] || roleMeta.admin;
  const RoleIcon = currentMeta.icon;

  return (
    <div className="max-w-xl mx-auto w-full px-4 sm:px-6 py-12">
      <GlassCard padding="p-8 sm:p-10" className="border-glass-border shadow-2xl">
        <div className="flex flex-col gap-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30">
                <RoleIcon className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold font-heading text-text">
                  {currentMeta.title}
                </h1>
                <p className="text-xs text-muted">
                  KovaiSwift Logistics Terminal Access
                </p>
              </div>
            </div>
            <Badge variant={currentMeta.variant} size="sm">
              {currentMeta.badge}
            </Badge>
          </div>

          <p className="text-xs text-muted leading-relaxed">
            {currentMeta.desc}
          </p>

          {/* Role Pill Selector */}
          <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-glass border border-glass-border">
            {["admin", "driver", "emergency"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                  role === r
                    ? "bg-primary text-white shadow-glow"
                    : "text-muted hover:text-text"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <Input
              label="Full Operator Name"
              placeholder="e.g. Karthik Raja"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={User}
              required
            />

            <Input
              label={t("auth_email_label")}
              type="email"
              placeholder="operator@kovaiswift.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
            />

            <PasswordInput
              label={t("auth_password_label")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              loading={loading}
              iconRight={ArrowRight}
            >
              Enter {role.toUpperCase()} Cockpit
            </Button>
          </form>

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-glass-border flex items-center justify-between text-xs text-muted">
            <Link href="/" className="hover:text-text">
              ← Return to Landing
            </Link>
            <span className="text-safe flex items-center gap-1 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" /> Demo Access Enabled
            </span>
          </div>

        </div>
      </GlassCard>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <Suspense fallback={<div className="text-center p-8 text-muted">Loading cockpit credentials...</div>}>
          <SignupContent />
        </Suspense>
      </main>
    </div>
  );
}
