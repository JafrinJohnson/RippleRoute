"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Home,
  MapPin,
  ChevronDown,
  ShieldAlert,
  Truck,
  HeartPulse,
  LogOut,
  Radio,
  Sparkles,
} from "lucide-react";
import Button from "@/components/ui/Button";

export default function DashboardTopBar({ currentRole = "admin" }) {
  const router = useRouter();
  const { profile, logout, loginDemo } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleRoleSwitch = async (targetRole) => {
    setDropdownOpen(false);
    if (targetRole === currentRole) return;
    await loginDemo(targetRole);
    router.push(`/${targetRole}`);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const roleConfigs = {
    admin: {
      label: "Admin",
      icon: ShieldAlert,
      color: "text-primary",
      badgeClass: "bg-primary/20 text-primary border-primary/30",
    },
    driver: {
      label: "Driver",
      icon: Truck,
      color: "text-cyan",
      badgeClass: "bg-cyan/20 text-cyan border-cyan/30",
    },
    emergency: {
      label: "Emergency",
      icon: HeartPulse,
      color: "text-pink",
      badgeClass: "bg-pink/20 text-pink border-pink/30",
    },
  };

  const currentConfig = roleConfigs[currentRole] || roleConfigs.admin;
  const CurrentIcon = currentConfig.icon;

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-xl border-b border-glass-border sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left Links: Home & Live Map */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              icon={Home}
              className="text-slate-300 hover:text-white hover:bg-white/10"
            >
              Home
            </Button>
          </Link>

          <Link href="/live-map">
            <Button
              variant="cyan"
              size="sm"
              icon={MapPin}
              className="shadow-glow-cyan text-xs font-bold"
            >
              Live Map
            </Button>
          </Link>

          <div className="hidden md:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
            <span>KovaiSwift Node CBE-01</span>
          </div>
        </div>

        {/* Right Navigation & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role Switcher Dropdown (for demo and evaluation) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-glass border border-glass-border hover:border-primary/50 text-xs font-semibold text-text transition-all select-none"
            >
              <CurrentIcon className={`w-3.5 h-3.5 ${currentConfig.color}`} />
              <span>Switch View:</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold border ${currentConfig.badgeClass}`}>
                {currentConfig.label}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-bg-2/95 border border-glass-border shadow-2xl backdrop-blur-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted border-b border-glass-border">
                    Select Evaluation Cockpit
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRoleSwitch("admin")}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                      currentRole === "admin"
                        ? "bg-primary/20 text-white font-bold"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-primary" />
                      <span>Admin Cockpit</span>
                    </span>
                    <span className="text-[10px] text-muted font-mono">Kavya S</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSwitch("driver")}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                      currentRole === "driver"
                        ? "bg-cyan/20 text-white font-bold"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-cyan" />
                      <span>Driver Cockpit</span>
                    </span>
                    <span className="text-[10px] text-muted font-mono">Murugan K</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSwitch("emergency")}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                      currentRole === "emergency"
                        ? "bg-pink/20 text-white font-bold"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-pink" />
                      <span>Emergency HUD</span>
                    </span>
                    <span className="text-[10px] text-muted font-mono">Priya R</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Quick Logout */}
          <Button
            variant="ghost"
            size="sm"
            icon={LogOut}
            onClick={handleLogout}
            className="text-xs text-muted hover:text-danger hover:bg-danger/10"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
