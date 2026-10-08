"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import { GlassCard, Button, Badge } from "@/components/ui";
import { ShieldAlert, LogOut, Truck, Compass, CheckCircle } from "lucide-react";

function AdminDashboardContent() {
  const { profile, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Welcome Banner */}
        <GlassCard padding="p-8 sm:p-10" className="border-primary/30 shadow-glow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="p-4 rounded-2xl bg-primary/20 text-primary border border-primary/40 shadow-glow">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="info" size="sm">
                    ADMIN COCKPIT
                  </Badge>
                  <span className="text-xs text-muted">
                    {profile?.companyId || "KS-COV-99"} • {profile?.department || "Logistics Team"}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-text">
                  Welcome, {profile?.name || "Operations Chief"}
                </h1>
                <p className="text-xs sm:text-sm text-muted">
                  Logged in as @{profile?.username} ({profile?.email})
                </p>
              </div>
            </div>

            <Button
              variant="danger"
              size="md"
              icon={LogOut}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </GlassCard>

        {/* Quick status placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard padding="p-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Live Fleet Telemetry
            </span>
            <p className="text-2xl font-bold font-heading text-text mt-2">24 Active</p>
            <p className="text-xs text-muted mt-1">Coimbatore City & Ghat routes active</p>
          </GlassCard>

          <GlassCard padding="p-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Swarm Optimization
            </span>
            <p className="text-2xl font-bold font-heading text-safe mt-2">QARS Standby</p>
            <p className="text-xs text-muted mt-1">Ready for autonomous swarm rebalancing</p>
          </GlassCard>

          <GlassCard padding="p-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Customer SMS Broadcast
            </span>
            <p className="text-2xl font-bold font-heading text-cyan mt-2">GSM Online</p>
            <p className="text-xs text-muted mt-1">Direct carrier delay advisories verified</p>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RoleGuard allowedRole="admin">
      <AdminDashboardContent />
    </RoleGuard>
  );
}
