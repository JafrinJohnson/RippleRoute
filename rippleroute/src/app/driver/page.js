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
  Truck,
  Navigation,
  Compass,
  AlertTriangle,
  Zap,
  MapPin,
  CheckCircle,
  Phone,
  Radio,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

const COIMBATORE_CENTER = [11.0168, 76.9558];

const DRIVER_HAZARDS = [
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
  {
    id: "haz-03",
    type: "rain",
    severity: "medium",
    lat: 10.9850,
    lng: 76.9600,
    radiusM: 380,
    note: "Waterlogging 2.2ft deep under railway bridge. Light vehicles diverted.",
    roadName: "Lanka Corner Railway Underpass",
  },
];

const DRIVER_DELIVERIES = [
  {
    id: "del-01",
    code: "DEL-GANDHI-01",
    priority: "normal",
    lat: 11.0168,
    lng: 76.9558,
    status: "in_transit",
  },
  {
    id: "del-02",
    code: "DEL-SING-02",
    priority: "food",
    lat: 10.9990,
    lng: 77.0300,
    status: "pending",
  },
];

const DRIVER_ROUTE = [
  {
    id: "route-drv",
    label: "Assigned: Peelamedu → Gandhipuram",
    color: "#00E5FF",
    highlighted: true,
    coords: [
      [11.0270, 77.0100],
      [11.0220, 76.9950],
      [11.0180, 76.9620],
      [11.0168, 76.9558],
    ],
  },
];

function DriverDashboardContent() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [qarsOptimized, setQarsOptimized] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const driverVehicle = [
    {
      uid: "drv-active",
      name: profile?.name || "Murugan K",
      vehicleNumber: profile?.vehicleNumber || "TN 38 BX 4521",
      lat: 11.0220,
      lng: 76.9950,
      status: qarsOptimized ? "on_time" : "at_risk",
      role: "driver",
      heading: 65,
      cargoType: "Standard Freight (Peelamedu → Gandhipuram)",
    },
  ];

  const handleQarsOptimize = () => {
    setOptimizing(true);
    setTimeout(() => {
      setOptimizing(false);
      setQarsOptimized(true);
      toast({
        type: "success",
        title: "QARS Swarm Converged",
        description: "Bypassed Avinashi bottleneck: -7 mins saved, 14.2% carbon reduction.",
        duration: 4500,
      });
    }, 700);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Universal Dashboard Top Bar with Role Switcher & Live Map link */}
      <DashboardTopBar currentRole="driver" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Cockpit Status Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="safe" size="sm">
                DRIVER COCKPIT
              </Badge>
              <span className="text-xs text-muted font-mono">
                Unit ID: {profile?.driverId || "DRV-4521"} &bull; {profile?.vehicleNumber || "TN 38 BX 4521"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
              Driver: {profile?.name || "Murugan K"}
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
                <Navigation className="w-4 h-4 text-cyan-400" />
                Active Route Corridor & Hazards
              </h2>
              <span className="text-xs text-cyan-400 font-mono">
                Centered on Coimbatore &bull; Live GPS
              </span>
            </div>

            <FleetMap
              center={COIMBATORE_CENTER}
              zoom={13}
              vehicles={driverVehicle}
              routes={DRIVER_ROUTE}
              hazards={DRIVER_HAZARDS}
              deliveries={DRIVER_DELIVERIES}
              selectedUid="drv-active"
              height="580px"
            />
          </div>

          {/* RIGHT SIDE: Turn-by-Turn Guidance & QARS Controls */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Turn-by-turn HUD Card */}
            <GlassCard padding="p-5" className="border-cyan/30 shadow-glow-cyan/15">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  Turn-By-Turn Guidance
                </span>
                <Badge variant={qarsOptimized ? "safe" : "warn"} size="sm">
                  {qarsOptimized ? "OPTIMAL" : "BOTTLENECK"}
                </Badge>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 mb-3">
                <div className="text-xs text-muted uppercase tracking-wider">Next Maneuver</div>
                <div className="text-base font-bold text-white mt-1">
                  In 350m: Take Nava India Flyover bypass
                </div>
                <div className="text-xs text-cyan-400 font-mono mt-1">
                  Avinashi Road Arterial Corridor
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-muted block text-[10px]">REMAINING ETA</span>
                  <span className="text-base font-bold text-white">{qarsOptimized ? "11 mins" : "18 mins"}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-muted block text-[10px]">DISTANCE</span>
                  <span className="text-base font-bold text-white">4.8 km</span>
                </div>
              </div>
            </GlassCard>

            {/* QARS Swarm Optimizer Card */}
            <GlassCard padding="p-5" className="border-primary/40 shadow-glow/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-white">QARS Swarm Optimization</h3>
              </div>
              <p className="text-xs text-muted mb-4 leading-relaxed">
                One-tap Quantum Particle Swarm Optimization. Collapses candidate routes to bypass Avinashi accident bottleneck.
              </p>

              <Button
                variant={qarsOptimized ? "secondary" : "primary"}
                size="md"
                icon={Zap}
                onClick={handleQarsOptimize}
                loading={optimizing}
                disabled={qarsOptimized}
                className="w-full shadow-glow font-bold"
              >
                {qarsOptimized ? "Route QARS Optimized ✓" : "Optimize with QARS"}
              </Button>

              {qarsOptimized && (
                <div className="mt-3 p-2.5 rounded-xl bg-safe/10 border border-safe/30 text-[11px] text-safe font-medium flex items-center gap-2 animate-in fade-in">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Swarm synthesized optimal bypass (-7m saved).</span>
                </div>
              )}
            </GlassCard>

            {/* Rapid Hazard Hotline */}
            <GlassCard padding="p-5" className="border-warn/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-warn" />
                  Hazard / Dispatch Link
                </h3>
                <span className="text-[10px] text-safe font-mono">ONLINE</span>
              </div>
              <p className="text-xs text-muted mb-3">
                Report road obstructions or contact Peelamedu central dispatch team instantly.
              </p>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={AlertTriangle}
                  className="w-full text-xs text-warn border-warn/30 hover:bg-warn/10"
                >
                  Report Hazard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Phone}
                  className="w-full text-xs"
                >
                  Call Dispatch
                </Button>
              </div>
            </GlassCard>
          </div>
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
