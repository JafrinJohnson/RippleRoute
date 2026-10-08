"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RoleGuard from "@/components/RoleGuard";
import DashboardTopBar from "@/components/layout/DashboardTopBar";
import { useAuth } from "@/context/AuthContext";
import { GlassCard, Button, Badge, useToast } from "@/components/ui";
import FleetMap from "@/components/map";
import {
  HeartPulse,
  Clock,
  Activity,
  ShieldAlert,
  AlertTriangle,
  MapPin,
  CheckCircle,
  Phone,
  Zap,
  Navigation,
} from "lucide-react";

const COIMBATORE_CENTER = [11.0168, 76.9558];

const EMERGENCY_HAZARDS = [
  {
    id: "haz-01",
    type: "landslide",
    severity: "critical",
    lat: 11.1350,
    lng: 76.9380,
    radiusM: 500,
    note: "Rockfall debris at Kallar hairpin #4. Ghat road restricted.",
    roadName: "Mettupalayam–Coonoor Pass (KM 14)",
  },
  {
    id: "haz-02",
    type: "accident",
    severity: "high",
    lat: 11.0250,
    lng: 76.9800,
    radiusM: 320,
    note: "Multi-vehicle incident west-bound lane. 18 min delay.",
    roadName: "Avinashi Road Flyover near Lakshmi Mills",
  },
];

const EMERGENCY_DELIVERIES = [
  {
    id: "del-kmch",
    code: "MED-KMCH-01",
    priority: "medical",
    lat: 11.0420,
    lng: 77.0350,
    status: "in_transit",
  },
  {
    id: "del-cbe-gh",
    code: "MED-CBE-GH",
    priority: "medical",
    lat: 11.0010,
    lng: 76.9650,
    status: "pending",
  },
];

const EMERGENCY_ROUTE = [
  {
    id: "route-emg",
    label: "Priority-Alpha Corridor: Peelamedu → RS Puram GH",
    color: "#EF4444",
    highlighted: true,
    coords: [
      [11.0270, 77.0100],
      [11.0350, 76.9920],
      [11.0280, 76.9700],
      [11.0150, 76.9550],
      [11.0089, 76.9500],
    ],
  },
];

function EmergencyDashboardContent() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [greenCorridorActive, setGreenCorridorActive] = useState(true);

  const emergencyVehicle = [
    {
      uid: "emg-active",
      name: profile?.name || "Priya R",
      vehicleNumber: profile?.vehicleNumber || "TN 38 AZ 7790",
      lat: 11.0310,
      lng: 76.9820,
      status: "delayed",
      role: "emergency",
      priority: "medical",
      heading: 230,
      isEmergency: true,
      cargoType: profile?.priority || "Medical – oxygen/medicines",
    },
  ];

  const handleToggleGreenCorridor = () => {
    const nextState = !greenCorridorActive;
    setGreenCorridorActive(nextState);
    toast({
      type: nextState ? "success" : "warn",
      title: nextState ? "Green Corridor Active" : "Corridor Standby",
      description: nextState
        ? "Preemptive signal priority granted across Coimbatore core."
        : "Standard transit rules restored.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Universal Dashboard Top Bar with Role Switcher & Live Map link */}
      <DashboardTopBar currentRole="emergency" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Emergency HUD Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="emergency" size="sm" pulse>
                PRIORITY-ALPHA EMERGENCY HUD
              </Badge>
              <span className="text-xs text-pink font-semibold font-mono">
                Cargo: {profile?.priority || "Medical – oxygen/medicines"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
              Operator: {profile?.name || "Priya R"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/live-map">
              <Button variant="cyan" size="sm" icon={MapPin} className="shadow-glow-cyan font-bold">
                Open Full Live Map
              </Button>
            </Link>
          </div>
        </div>

        {/* 2-Column Main Section: Map Immediately Visible on Left */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDE: FleetMap visible immediately on page load */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-pink animate-pulse" />
                Live Green Corridor & Medical Nodes
              </h2>
              <span className="text-xs text-pink font-mono">
                Centered on Coimbatore &bull; High-Priority Route
              </span>
            </div>

            <FleetMap
              center={COIMBATORE_CENTER}
              zoom={13}
              vehicles={emergencyVehicle}
              routes={EMERGENCY_ROUTE}
              hazards={EMERGENCY_HAZARDS}
              deliveries={EMERGENCY_DELIVERIES}
              selectedUid="emg-active"
              height="580px"
            />
          </div>

          {/* RIGHT SIDE: Cryogenic Countdown & Priority Controls */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Lifespan Countdown Card */}
            <GlassCard padding="p-5" className="border-pink/40 shadow-glow-pink/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-pink flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-pink" />
                  Cargo Lifespan Countdown
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-pink/20 text-pink font-bold animate-pulse">
                  CRITICAL
                </span>
              </div>

              <div className="p-4 rounded-xl bg-pink/10 border border-pink/30 text-center mb-3">
                <div className="text-3xl font-black font-heading text-white">
                  03h : 28m : 14s
                </div>
                <div className="text-xs text-pink font-semibold mt-1">
                  Liquid Oxygen Tank Temperature: -183°C (Nominal)
                </div>
              </div>

              <p className="text-[11px] text-muted leading-relaxed">
                Automated cold-chain monitoring. Re-routing triggered automatically if ETA exceeds safe shelf-life threshold.
              </p>
            </GlassCard>

            {/* Green Corridor Control Card */}
            <GlassCard padding="p-5" className="border-safe/30 shadow-glow-safe/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-safe" />
                  Signal Preemption Status
                </h3>
                <Badge variant={greenCorridorActive ? "safe" : "secondary"} size="sm">
                  {greenCorridorActive ? "ACTIVE" : "STANDBY"}
                </Badge>
              </div>

              <p className="text-xs text-muted mb-4 leading-relaxed">
                Green Corridor signals traffic synchronization through Lakshmi Mills and Town Hall corridors.
              </p>

              <Button
                variant={greenCorridorActive ? "danger" : "primary"}
                size="md"
                onClick={handleToggleGreenCorridor}
                className="w-full font-bold"
              >
                {greenCorridorActive ? "Disengage Green Corridor" : "Activate Green Corridor"}
              </Button>
            </GlassCard>

            {/* Hospital Hotlines Card */}
            <GlassCard padding="p-5" className="border-glass-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  Hospital Emergency Line
                </h3>
                <span className="text-[10px] text-muted font-mono">PRIORITY</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">KMCH Avinashi Road</div>
                    <div className="text-[10px] text-muted">ICU Reception: Ready</div>
                  </div>
                  <Button variant="ghost" size="sm" icon={Phone} className="h-7 text-xs px-2">
                    Call
                  </Button>
                </div>

                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Coimbatore GH Terminal</div>
                    <div className="text-[10px] text-muted">Oxygen Bay: Cleared</div>
                  </div>
                  <Button variant="ghost" size="sm" icon={Phone} className="h-7 text-xs px-2">
                    Call
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>
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
