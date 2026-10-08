"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import { GlassCard, Button, Badge } from "@/components/ui";
import { Truck, LogOut, Navigation, Phone, CheckCircle } from "lucide-react";

function DriverDashboardContent() {
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
        <GlassCard padding="p-8 sm:p-10" className="border-cyan/30 shadow-glow-cyan">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="p-4 rounded-2xl bg-cyan/20 text-cyan border border-cyan/40 shadow-glow-cyan">
                <Truck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="safe" size="sm">
                    DRIVER COCKPIT
                  </Badge>
                  <span className="text-xs text-muted">
                    ID: {profile?.driverId || "DRV-3801"} • Vehicle: {profile?.vehicleNumber || "TN 38 AB 1234"}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-text">
                  Welcome, {profile?.name || "Kovai Fleet Driver"}
                </h1>
                <p className="text-xs sm:text-sm text-muted">
                  Phone: +91 {profile?.phone || "98421 23011"} • @{profile?.username}
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
              Assigned Route
            </span>
            <p className="text-xl font-bold font-heading text-text mt-2">Peelamedu → Gandhipuram</p>
            <p className="text-xs text-muted mt-1">Status: Active Corridor • 14 min ETA</p>
          </GlassCard>

          <GlassCard padding="p-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              QARS Engine Link
            </span>
            <p className="text-xl font-bold font-heading text-cyan mt-2">1-Tap Optimize Ready</p>
            <p className="text-xs text-muted mt-1">Calculates instant bypass upon disruption</p>
          </GlassCard>

          <GlassCard padding="p-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Hazard Hotline
            </span>
            <p className="text-xl font-bold font-heading text-safe mt-2">Dispatch Connected</p>
            <p className="text-xs text-muted mt-1">Instant voice & hazard reporting link</p>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}

export default function DriverPage() {
  return (
    <RoleGuard allowedRole="driver">
      <DriverDashboardContent />
    </RoleGuard>
  );
}
