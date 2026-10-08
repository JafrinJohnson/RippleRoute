"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import {
  GlassCard,
  Button,
  Badge,
  Input,
  Select,
  PasswordInput,
  Tabs,
  Modal,
  Drawer,
  Skeleton,
  Avatar,
  StatCard,
  useToast,
} from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  getSystemMetrics,
  optimizeRouteWithQARS,
  sendCustomerSMS,
  getHazards,
} from "@/services/api";
import {
  Zap,
  ShieldAlert,
  Truck,
  Clock,
  Compass,
  AlertTriangle,
  Flame,
  CheckCircle,
  Radio,
  Send,
  Sliders,
  Layers,
  MapPin,
  Sparkles,
  RefreshCw,
  Bell,
  HeartPulse,
} from "lucide-react";

export default function HomePage() {
  const { t, isTamil } = useLanguage();
  const { role, switchRole } = useAuth();
  const { toast } = useToast();

  // Component test states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isQarsLoading, setIsQarsLoading] = useState(false);
  const [qarsResult, setQarsResult] = useState(null);
  const [isSmsLoading, setIsSmsLoading] = useState(false);

  // Form input states
  const [testEmail, setTestEmail] = useState("dispatcher@kovaiswift.com");
  const [testPassword, setTestPassword] = useState("KovaiSwift#2026");
  const [testRole, setTestRole] = useState("admin");

  // Telemetry metrics from api.js
  const [metrics, setMetrics] = useState({
    activeDrivers: 24,
    onTimeRate: 96.4,
    activeHazards: 3,
    emergencyPriorityLoads: 5,
    totalTimeSavedTodayMin: 342,
  });

  // Fetch metrics safely on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await getSystemMetrics();
        if (res.success && isMounted) {
          setMetrics(res.data);
        }
      } catch (err) {
        console.warn("Failed fetching initial metrics:", err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle QARS Swarm Optimization
  const handleOptimizeQars = async () => {
    setIsQarsLoading(true);
    try {
      const res = await optimizeRouteWithQARS("route-02");
      if (res.success) {
        setQarsResult(res.data);
        toast({
          type: "success",
          title: t("qars_optimized_success"),
          description: `${t("qars_time_saved")}: ${res.data.timeSavedMin} mins saved via Karamadai corridor bypass.`,
          duration: 5000,
          action: {
            label: "Inspect Swarm",
            onClick: () => setIsDrawerOpen(true),
          },
        });
      }
    } catch (err) {
      toast({
        type: "danger",
        title: "QARS Optimization Failed",
        description: err.message,
      });
    } finally {
      setIsQarsLoading(false);
    }
  };

  // Handle Customer SMS dispatch simulation
  const handleSendSMS = async () => {
    setIsSmsLoading(true);
    try {
      const res = await sendCustomerSMS({
        recipient: "+91 99940 12890",
        message: t("sms_sample_message"),
      });
      if (res.success) {
        toast({
          type: "info",
          title: t("sms_sent_success"),
          description: res.data.content,
          duration: 4000,
        });
      }
    } catch (err) {
      toast({
        type: "danger",
        title: "SMS Dispatch Error",
        description: err.message,
      });
    } finally {
      setIsSmsLoading(false);
    }
  };

  // Tabs Definition
  const showcaseTabs = [
    {
      id: "cockpit",
      label: "Mission Cockpit",
      icon: Compass,
      badge: "LIVE",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard padding="p-5" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Active Ghat Section Telemetry
              </span>
              <Badge variant="emergency" pulse size="sm">
                CRITICAL
              </Badge>
            </div>
            <h4 className="text-base font-bold font-heading text-text">
              {t("hazard_ghat_advisory")}
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Active rockfall near KM 14 hairpin turns. Fleet #2 carrying refrigerated medical oxygen automatically switched to QPSO swarm bypass.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                icon={Zap}
                loading={isQarsLoading}
                onClick={handleOptimizeQars}
              >
                {t("qars_btn_optimize")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Send}
                loading={isSmsLoading}
                onClick={handleSendSMS}
              >
                {t("btn_notify_customer")}
              </Button>
            </div>
          </GlassCard>

          <GlassCard padding="p-5" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Fleet Distribution Hub
              </span>
              <Badge variant="safe" size="sm">
                98.2% HEALTH
              </Badge>
            </div>
            <h4 className="text-base font-bold font-heading text-text">
              {t("depot_name")}
            </h4>
            <div className="flex items-center gap-3">
              <Avatar name="Karthik Raja" status="online" size="md" />
              <div>
                <p className="text-xs font-bold text-text">TN-37-BY-4512 (EV Van)</p>
                <p className="text-[11px] text-muted">Peelamedu to Gandhipuram • ETA 14m</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Avatar name="Praveen Kumar" status="emergency" size="md" />
              <div>
                <p className="text-xs font-bold text-pink">TN-38-AL-9014 (Medical)</p>
                <p className="text-[11px] text-muted">Short-lifespan Oxygen • 3.5 hrs reserve</p>
              </div>
            </div>
          </GlassCard>
        </div>
      ),
    },
    {
      id: "swarm",
      label: "QARS Swarm Engine",
      icon: Zap,
      badge: "QPSO",
      content: (
        <GlassCard padding="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h4 className="text-base font-bold font-heading text-text">
                {t("qars_title")}
              </h4>
              <p className="text-xs text-muted mt-1 max-w-xl">
                {t("qars_fullname")} evaluates 128 dynamic swarm fitness trajectories across Coimbatore arterial roads, factoring in precipitation, grade resistance, and live roadblock reports.
              </p>
            </div>
            <Button
              variant="cyan"
              size="sm"
              icon={Sparkles}
              loading={isQarsLoading}
              onClick={handleOptimizeQars}
            >
              {t("qars_btn_optimize")}
            </Button>
          </div>

          {qarsResult ? (
            <div className="mt-4 p-4 rounded-xl bg-glass border border-cyan/30 shadow-glow-cyan animate-in fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <span className="text-[10px] text-muted uppercase">Original ETA</span>
                  <p className="text-lg font-bold text-text">{qarsResult.originalTimeMin} mins</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted uppercase">QARS ETA</span>
                  <p className="text-lg font-bold text-cyan">{qarsResult.optimizedTimeMin} mins</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted uppercase">{t("qars_time_saved")}</span>
                  <p className="text-lg font-bold text-safe">+{qarsResult.timeSavedMin} mins</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted uppercase">Fuel Conserved</span>
                  <p className="text-lg font-bold text-primary">{qarsResult.fuelSavingsPercent}%</p>
                </div>
              </div>
              <p className="text-xs text-muted mt-3 pt-3 border-t border-glass-border">
                {qarsResult.advisory}
              </p>
            </div>
          ) : (
            <div className="mt-4 p-4 rounded-xl bg-glass border border-glass-border text-center text-xs text-muted">
              Click &quot;{t("qars_btn_optimize")}&quot; to simulate instant quantum-inspired particle swarm convergence.
            </div>
          )}
        </GlassCard>
      ),
    },
    {
      id: "hazards",
      label: "Hazards & AI Advisories",
      icon: ShieldAlert,
      badge: "3",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <GlassCard padding="p-4" className="border-danger/30 shadow-glow-danger">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="danger" size="sm" pulse>
                {t("hazard_landslide")}
              </Badge>
              <span className="text-[10px] text-muted">10m ago</span>
            </div>
            <h5 className="text-xs font-bold text-text">Mettupalayam Ghat KM 14</h5>
            <p className="text-[11px] text-muted mt-1">
              Active rockfall. Ghat pass closed for heavy trucks. Diverted via Annur–Karamadai.
            </p>
          </GlassCard>

          <GlassCard padding="p-4" className="border-warn/30 shadow-glow-warn">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="warn" size="sm">
                {t("hazard_accident")}
              </Badge>
              <span className="text-[10px] text-muted">25m ago</span>
            </div>
            <h5 className="text-xs font-bold text-text">Avinashi Road Flyover</h5>
            <p className="text-[11px] text-muted mt-1">
              West-bound lane pileup. Moderate delay of 18 minutes expected.
            </p>
          </GlassCard>

          <GlassCard padding="p-4" className="border-cyan/30 shadow-glow-cyan">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="info" size="sm">
                {t("hazard_rain")}
              </Badge>
              <span className="text-[10px] text-muted">40m ago</span>
            </div>
            <h5 className="text-xs font-bold text-text">Lanka Corner Underpass</h5>
            <p className="text-[11px] text-muted mt-1">
              Waterlogging under bridge. Diverted via Town Hall arterial.
            </p>
          </GlassCard>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Glass Navbar */}
      <Navbar
        onOpenAuthModal={(mode) => {
          setIsModalOpen(true);
        }}
        onQuickAction={() => setIsDrawerOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        
        {/* ====================================================================
            HERO SECTION
            ==================================================================== */}
        <section className="relative text-center max-w-4xl mx-auto space-y-5 pt-4 sm:pt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-glass border border-glass-border backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 text-safe animate-pulse" />
            <span className="text-xs font-semibold tracking-wide text-text">
              KovaiSwift Logistics Telemetry Grid Active
            </span>
            <Badge variant="info" size="sm">
              Coimbatore, TN
            </Badge>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black font-heading tracking-tight text-text leading-tight">
            Disruption-Aware{" "}
            <span className="bg-gradient-to-r from-primary via-cyan to-pink bg-clip-text text-transparent">
              Logistics Control
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            {t("subtagline")}. Answering three questions continuously:{" "}
            <span className="text-text font-semibold">What changed?</span>{" "}
            <span className="text-text font-semibold">What is affected?</span>{" "}
            <span className="text-primary font-semibold">What should we do next?</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              icon={Zap}
              loading={isQarsLoading}
              onClick={handleOptimizeQars}
            >
              {t("qars_btn_optimize")}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              icon={Sliders}
              onClick={() => setIsDrawerOpen(true)}
            >
              Open Fleet Drawer
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setIsModalOpen(true)}
            >
              Open Mission Modal
            </Button>
          </div>
        </section>

        {/* ====================================================================
            STAT CARDS (Animated Counting Numbers)
            ==================================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold font-heading text-text flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              <span>Real-Time Fleet Telemetry (StatCard Showcase)</span>
            </h2>
            <Badge variant="safe" pulse size="sm">
              LIVE STREAM
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title={t("stat_active_fleet")}
              value={metrics.activeDrivers}
              suffix=" Vans"
              trend={8.5}
              trendLabel="vs yesterday"
              icon={Truck}
              variant="primary"
            />
            <StatCard
              title={t("stat_on_time_rate")}
              value={metrics.onTimeRate}
              suffix="%"
              decimals={1}
              trend={2.4}
              trendLabel="high SLA"
              icon={CheckCircle}
              variant="safe"
            />
            <StatCard
              title={t("stat_active_hazards")}
              value={metrics.activeHazards}
              suffix=" Alerts"
              trend={-12.0}
              trendLabel="clearing"
              icon={AlertTriangle}
              variant="warn"
            />
            <StatCard
              title={t("stat_emergency_loads")}
              value={metrics.emergencyPriorityLoads}
              suffix=" Med/O2"
              trend={15.0}
              trendLabel="high priority"
              icon={HeartPulse}
              variant="pink"
            />
            <StatCard
              title={t("stat_total_time_saved")}
              value={metrics.totalTimeSavedTodayMin}
              suffix=" min"
              trend={22.5}
              trendLabel="via QARS"
              icon={Clock}
              variant="cyan"
            />
          </div>
        </section>

        {/* ====================================================================
            TABS COMPONENT SHOWCASE
            ==================================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold font-heading text-text flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan" />
              <span>Operational Modules (Tabs Showcase)</span>
            </h2>
          </div>

          <Tabs tabs={showcaseTabs} />
        </section>

        {/* ====================================================================
            UI KIT SHOWCASE: Buttons, Badges, Inputs, Avatars, Skeletons
            ==================================================================== */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold font-heading text-text flex items-center gap-2">
              <Sliders className="w-5 h-5 text-pink" />
              <span>Complete UI Kit Component Gallery</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Card: Buttons & Badges */}
            <GlassCard padding="p-6" className="space-y-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-3">
                  Button Variants & Micro-Interactions
                </h3>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Button variant="primary">Primary (Glow)</Button>
                  <Button variant="cyan">Cyan Accent</Button>
                  <Button variant="secondary">Secondary Glass</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="primary" loading>
                    Loading
                  </Button>
                  <Button variant="primary" icon={Bell} size="icon" aria-label="Notifications" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-3">
                  Badge Variants (Status & Priority)
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="safe" pulse>Safe (Pulsing)</Badge>
                  <Badge variant="warn">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="emergency" pulse>Emergency Medical</Badge>
                  <Badge variant="neutral">Neutral</Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-3">
                  Toast System Controls (Stacks Bottom-Left)
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      toast({
                        type: "success",
                        title: "Mission Completed",
                        description: "Medical oxygen delivery verified at Mettupalayam GH.",
                      })
                    }
                  >
                    Success Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      toast({
                        type: "warn",
                        title: t("hazard_accident"),
                        description: "Avinashi Road west-bound slowed by 15 mins.",
                      })
                    }
                  >
                    Warn Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      toast({
                        type: "danger",
                        title: t("hazard_landslide"),
                        description: "Kallar Ghat Pass hairpin 3 blocked.",
                      })
                    }
                  >
                    Danger Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      toast({
                        type: "emergency",
                        title: "High Priority Cargo Alert",
                        description: "Antivenom delivery rerouted to KMCH Coimbatore.",
                        action: {
                          label: "View Telemetry",
                          onClick: () => setIsDrawerOpen(true),
                        },
                      })
                    }
                  >
                    Emergency Toast
                  </Button>
                </div>
              </div>
            </GlassCard>

            {/* Right Card: Inputs, Selects, Avatars & Skeletons */}
            <GlassCard padding="p-6" className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
                Form Inputs & Glass Controls
              </h3>

              <div className="space-y-3.5">
                <Input
                  label={t("auth_email_label")}
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder={t("auth_email_placeholder")}
                  helperText="Enterprise single sign-on enabled"
                />

                <PasswordInput
                  label={t("auth_password_label")}
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder={t("auth_password_placeholder")}
                />

                <Select
                  label={t("auth_switch_role")}
                  value={testRole}
                  onChange={(e) => {
                    setTestRole(e.target.value);
                    switchRole(e.target.value);
                    toast({
                      type: "info",
                      title: "Role Switched",
                      description: `Active role changed to ${e.target.value}`,
                    });
                  }}
                  options={[
                    { value: "admin", label: t("role_admin") },
                    { value: "driver", label: t("role_driver") },
                    { value: "emergency", label: t("role_emergency") },
                  ]}
                />
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-3">
                  Avatars & Skeleton Loaders
                </h3>
                <div className="flex items-center gap-4 flex-wrap">
                  <Avatar name="Kovai Swift" status="online" size="lg" />
                  <Avatar name="Selvi Ramasamy" status="busy" size="md" />
                  <Avatar name="Emergency Cargo" status="emergency" size="md" />
                  <Avatar name="Karthik R" status="offline" size="sm" />

                  {/* Skeleton samples */}
                  <div className="flex flex-col gap-1.5 w-32">
                    <Skeleton variant="text" width="100%" />
                    <Skeleton variant="text" width="70%" />
                  </div>
                </div>
              </div>
            </GlassCard>

          </div>
        </section>

      </main>

      {/* ====================================================================
          SAMPLE MODAL COMPONENT
          ==================================================================== */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="KovaiSwift Mission Briefing"
        description="Hazard Disruption Response & Dispatch Protocol"
        size="md"
      >
        <div className="space-y-4 text-xs sm:text-sm text-muted">
          <p>
            When disruptions like landslides on the Mettupalayam ghat or Avinashi road pileups are detected, the system immediately assesses all active deliveries.
          </p>
          <div className="p-3.5 rounded-xl bg-glass border border-glass-border space-y-2">
            <div className="flex items-center justify-between text-text font-semibold">
              <span>Automatic Protocol:</span>
              <Badge variant="safe" size="sm">ACTIVE</Badge>
            </div>
            <ul className="list-disc list-inside space-y-1 text-muted text-xs">
              <li>Emergency medical loads receive instant green-corridor priority.</li>
              <li>Customers receive real-time transparent SMS notifications with revised ETAs.</li>
              <li>Drivers receive QARS adaptive swarm alternatives with a single tap.</li>
            </ul>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              {t("btn_close")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsModalOpen(false);
                toast({
                  type: "success",
                  title: "Protocol Confirmed",
                  description: "All dispatcher channels synchronized.",
                });
              }}
            >
              {t("btn_confirm")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ====================================================================
          SAMPLE DRAWER COMPONENT
          ==================================================================== */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Fleet Telemetry Console"
        description="KovaiSwift Logistics Coimbatore Live Monitoring"
        position="right"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-glass-border">
            <span className="text-xs font-semibold text-muted">Driver Telemetry</span>
            <Badge variant="info" size="sm">4 Connected</Badge>
          </div>

          <div className="space-y-3">
            <GlassCard padding="p-3.5" hover className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name="Karthik Raja" status="online" size="sm" />
                <div>
                  <p className="text-xs font-bold text-text">Karthik Raja</p>
                  <p className="text-[10px] text-muted">TN-37-BY-4512 • 82% Battery</p>
                </div>
              </div>
              <Badge variant="safe" size="sm">Active</Badge>
            </GlassCard>

            <GlassCard padding="p-3.5" hover className="flex items-center justify-between border-pink/30">
              <div className="flex items-center gap-3">
                <Avatar name="Praveen Kumar" status="emergency" size="sm" />
                <div>
                  <p className="text-xs font-bold text-pink">Praveen Kumar</p>
                  <p className="text-[10px] text-muted">Medical O2 • 3.5 hrs reserve</p>
                </div>
              </div>
              <Badge variant="emergency" size="sm">Disrupted</Badge>
            </GlassCard>

            <GlassCard padding="p-3.5" hover className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name="Senthil Nathan" status="online" size="sm" />
                <div>
                  <p className="text-xs font-bold text-text">Senthil Nathan</p>
                  <p className="text-[10px] text-muted">Singanallur Terminal • 22m ETA</p>
                </div>
              </div>
              <Badge variant="safe" size="sm">Optimal</Badge>
            </GlassCard>
          </div>

          <div className="pt-4 border-t border-glass-border">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              icon={Zap}
              loading={isQarsLoading}
              onClick={handleOptimizeQars}
            >
              {t("qars_btn_optimize")}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
