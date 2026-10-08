"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import { GlassCard, Button, Badge } from "@/components/ui";
import { HeartPulse, LogOut, Activity, Clock, ShieldAlert } from "lucide-react";

function EmergencyDashboardContent() {
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
        <GlassCard padding="p-8 sm:p-10" className="border-pink/40 shadow-glow-pink">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="p-4 rounded-2xl bg-pink/20 text-pink border border-pink/40 shadow-glow-pink animate-pulse">
                <HeartPulse className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="emergency" size="sm" pulse>
                    EMERGENCY CARGO HUD
                  </Badge>
                  <span className="text-xs text-pink font-semibold">
                    Cargo: {profile?.priority || "Medical – oxygen/medicines"}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-text">
                  Welcome, {profile?.name || "Emergency Medical Operator"}
                </h1>
                <p className="text-xs sm:text-sm text-muted">
                  ID: {profile?.driverId || "EMG-9014"} • Vehicle: {profile?.vehicleNumber || "TN 38 AL 9014"} • +91 {profile?.phone || "98421 88402"}
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
              Routing Priority Level
            </span>
            <p className="text-xl font-bold font-heading text-pink mt-2">Priority-Alpha Green Corridor</p>
            <p className="text-xs text-muted mt-1">Preempts all regular freight swarm slots</p>
          </GlassCard>

          <GlassCard padding="p-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Cargo Lifespan Countdown
            </span>
            <p className="text-xl font-bold font-heading text-safe mt-2">3.5 Hours Reserve</p>
            <p className="text-xs text-muted mt-1">Cryogenic oxygen & vaccine temperature monitored</p>
          </GlassCard>

          <GlassCard padding="p-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Hospital Transit Corridor
            </span>
            <p className="text-xl font-bold font-heading text-cyan mt-2">KMCH & GH Priority</p>
            <p className="text-xs text-muted mt-1">Real-time emergency bypass through Avinashi rd</p>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}

export default function EmergencyPage() {
  return (
    <RoleGuard allowedRole="emergency">
      <EmergencyDashboardContent />
    </RoleGuard>
  );
}
