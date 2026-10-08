"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RoleGuard from "@/components/RoleGuard";
import DashboardTopBar from "@/components/layout/DashboardTopBar";
import { useAuth } from "@/context/AuthContext";
import { GlassCard, Button, Badge } from "@/components/ui";
import FleetMap from "@/components/map";
import {
  ShieldAlert,
  LogOut,
  Truck,
  Compass,
  CheckCircle,
  MapPin,
  AlertTriangle,
  Radio,
  Send,
  Zap,
} from "lucide-react";

// Standard Coimbatore reference points
const COIMBATORE_CENTER = [11.0168, 76.9558];

const ADMIN_HAZARDS = [
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

const ADMIN_DELIVERIES = [
  {
    id: "del-01",
    code: "MED-KMCH",
    priority: "medical",
    lat: 11.0420,
    lng: 77.0350,
    status: "in_transit",
  },
  {
    id: "del-02",
    code: "FOOD-SING",
    priority: "food",
    lat: 10.9990,
    lng: 77.0250,
    status: "pending",
  },
  {
    id: "del-03",
    code: "STD-GANDHI",
    priority: "normal",
    lat: 11.0175,
    lng: 76.9580,
    status: "delivered",
  },
];

const ADMIN_VEHICLES = [
  {
    uid: "drv-01",
    name: "Karthik Raja",
    phone: "+91 98421 23011",
    driverId: "DRV-101",
    vehicleNumber: "TN 38 BX 4521",
    location: "Avinashi Road near Lakshmi Mills (11.0210, 76.9820)",
    lat: 11.0210,
    lng: 76.9820,
    status: "on_time",
    role: "driver",
    heading: 65,
    cargoType: "Standard Freight (Peelamedu → Gandhipuram)",
  },
  {
    uid: "drv-02",
    name: "Priya R",
    phone: "+91 98421 88402",
    driverId: "EMG-201",
    vehicleNumber: "TN 38 AZ 7790",
    location: "Saravanampatti Tech Corridor (11.0620, 76.9750)",
    lat: 11.0620,
    lng: 76.9750,
    status: "delayed",
    role: "emergency",
    priority: "medical",
    heading: 15,
    isEmergency: true,
    cargoType: "Medical Oxygen & Vaccines (Peelamedu → RS Puram)",
  },
  {
    uid: "drv-03",
    name: "Murugan K",
    phone: "+91 94433 11209",
    driverId: "EMG-202",
    vehicleNumber: "TN 37 CW 3321",
    location: "Singanallur Trichy Road Bypass (11.0020, 77.0280)",
    lat: 11.0020,
    lng: 77.0280,
    status: "at_risk",
    role: "emergency",
    priority: "food",
    heading: 190,
    isEmergency: true,
    cargoType: "Agricultural Perishables (Peelamedu → Singanallur)",
  },
];

function AdminDashboardContent() {
  const { profile } = useAuth();
  const [selectedUid, setSelectedUid] = useState("drv-02");

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Universal Dashboard Top Bar with Role Switcher & Live Map link */}
      <DashboardTopBar currentRole="admin" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="info" size="sm">
                DISPATCH MISSION CONTROL
              </Badge>
              <span className="text-xs text-muted font-mono">
                {profile?.companyId || "KS-CBE-01"} &bull; {profile?.department || "Logistics Team"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
              Operations Chief: {profile?.name || "Kavya S"}
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Active telemetry monitoring across Coimbatore urban grid and Nilgiris arterial passes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/live-map">
              <Button variant="cyan" size="sm" icon={MapPin} className="shadow-glow-cyan font-bold">
                Open Full Live Map
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick status metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard padding="p-5" className="border-cyan/30 shadow-glow-cyan/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Live Fleet Swarm
              </span>
              <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
            </div>
            <p className="text-2xl font-bold font-heading text-white mt-1.5">24 Active Units</p>
            <p className="text-[11px] text-muted mt-0.5">3 Disruption corridors actively rerouted</p>
          </GlassCard>

          <GlassCard padding="p-5" className="border-primary/30 shadow-glow/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                QARS Convergence
              </span>
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold font-heading text-primary mt-1.5">QPSO Optimal</p>
            <p className="text-[11px] text-muted mt-0.5">18.4% Average carbon & fuel savings</p>
          </GlassCard>

          <GlassCard padding="p-5" className="border-pink/30 shadow-glow-pink/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Emergency Priority Corridors
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-pink/20 text-pink font-bold">
                CRITICAL
              </span>
            </div>
            <p className="text-2xl font-bold font-heading text-pink mt-1.5">5 Medical Loads</p>
            <p className="text-[11px] text-muted mt-0.5">Cryogenic oxygen & vaccine lifelines active</p>
          </GlassCard>
        </div>

        {/* Embedded Fleet Map View */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-cyan-400" />
              Real-Time Coimbatore Swarm Map
            </h2>
            <span className="text-xs text-muted font-mono">
              Peelamedu Hub Center &bull; Live Telemetry
            </span>
          </div>

          <FleetMap
            center={COIMBATORE_CENTER}
            zoom={13}
            vehicles={ADMIN_VEHICLES}
            hazards={ADMIN_HAZARDS}
            deliveries={ADMIN_DELIVERIES}
            selectedUid={selectedUid}
            onVehicleClick={(uid) => setSelectedUid(uid)}
            height="460px"
          />
        </div>

        {/* Dispatcher Personnel & Vehicle Details (Admin Only) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Dispatcher Fleet Personnel Directory (Confidential Admin View)
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
              Restricted Dispatch Access
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ADMIN_VEHICLES.map((v) => (
              <GlassCard
                key={v.uid}
                padding="p-4"
                className={`transition-all border ${
                  selectedUid === v.uid ? "border-cyan-400 bg-cyan-500/10" : "border-glass-border"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>{v.name}</span>
                    {v.isEmergency && <span>🏥</span>}
                  </div>
                  <Badge
                    variant={v.status === "on_time" ? "success" : v.status === "delayed" ? "danger" : "warning"}
                    size="sm"
                  >
                    {v.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-muted">
                    <span>Driver ID:</span>
                    <span className="text-white font-semibold">{v.driverId}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Phone:</span>
                    <span className="text-cyan-300">{v.phone}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Vehicle Reg:</span>
                    <span className="text-white">{v.vehicleNumber}</span>
                  </div>
                  <div className="text-muted pt-1 border-t border-white/5">
                    <span className="block text-[10px]">Current Location:</span>
                    <span className="text-slate-300 text-[11px] truncate block">{v.location}</span>
                  </div>
                  <div className="text-muted pt-1">
                    <span className="block text-[10px]">Assigned Cargo:</span>
                    <span className="text-cyan-400 text-[11px] truncate block">{v.cargoType}</span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
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
