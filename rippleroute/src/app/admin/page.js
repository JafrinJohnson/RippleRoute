"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import RoleGuard from "@/components/RoleGuard";
import FleetMap from "@/components/map";
import { GlassCard, Button, Badge, StatCard, Modal, Input, Select, Skeleton, EmptyState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import {
  getDeliveries,
  updateDelivery,
  getHazards,
  subscribeHazards,
  addHazard,
  resolveHazard,
  planRoutes,
  runQars,
  getAdvisory,
  subscribeLiveLocations,
  sendMessage,
  subscribeMessages,
  sendCustomerSms,
  DEPOT_PEELAMEDU,
  COIMBATORE_CENTER,
} from "@/services/api";
import { haversineMeters } from "@/lib/geo";
import {
  Truck,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Navigation,
  Radio,
  Phone,
  MessageSquare,
  Sparkles,
  Clock,
  Compass,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  X,
  Send,
  Maximize2,
  Volume2,
  Layers,
  Activity,
  FileText,
  ChevronDown,
  ChevronUp,
  Bell,
  Sun,
  Moon,
  LogOut,
  Zap,
  Package,
  ExternalLink,
  Flame,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

/**
 * Audio beep alert using Web Audio API
 */
function triggerAdminAlertSound() {
  try {
    if (typeof window !== "undefined") {
      if (window.navigator?.vibrate) {
        window.navigator.vibrate([200, 100, 200]);
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    }
  } catch (err) {
    // Audio Context might require prior interaction, ignore safely
  }
}

export default function AdminPage() {
  return (
    <RoleGuard allowedRole="admin">
      <AdminControlRoom />
    </RoleGuard>
  );
}

function AdminControlRoom() {
  const { profile, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  // Navigation View: "map" (Control Room) vs "deliveries" (Dispatch Table)
  const [activeTab, setActiveTab] = useState("map");

  // Core Real-Time Streams
  const [vehicles, setVehicles] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingHazards, setLoadingHazards] = useState(true);
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);

  // Selected driver for Right Panel & Map focus
  const [selectedDriverUid, setSelectedDriverUid] = useState(null);
  const [flyToCoords, setFlyToCoords] = useState(null);

  // Left sidebar search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [driverFilter, setDriverFilter] = useState("all"); // all, driver, emergency, issues

  // Mark hazard toolbar
  const [markingHazardType, setMarkingHazardType] = useState(null); // accident, roadblock, landslide, rain

  // Bottom drawer disruption feed toggle
  const [isFeedDrawerOpen, setIsFeedDrawerOpen] = useState(false);

  // Responsive Drawer Toggles for Mobile/Tablet
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);

  // Live Clock
  const [currentTime, setCurrentTime] = useState("");

  // Messaging Modal / Drawer with selected driver
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // Re-optimization state
  const [isReoptimizing, setIsReoptimizing] = useState(false);

  // Customer SMS Notification Modal
  const [smsModalDelivery, setSmsModalDelivery] = useState(null);
  const [smsReason, setSmsReason] = useState("");
  const [smsEta, setSmsEta] = useState("");
  const [smsLang, setSmsLang] = useState("en");
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsLogs, setSmsLogs] = useState([
    {
      id: "log-init-01",
      deliveryCode: "DEL-MED-MTP-08",
      customerName: "Mettupalayam Government Hospital",
      phone: "+91 98450 11999",
      body: "Hi Mettupalayam Govt Hospital, your KovaiSwift order DEL-MED-MTP-08 is delayed due to landslide near Kallar pass. Our driver is taking a safer route. Assured arrival: by 5:55 PM today. – KovaiSwift Logistics",
      time: "10m ago",
      status: "Delivered",
    },
  ]);

  // Bottom-Left Urgent Hazard Alert Card (Audio + Vibration)
  const [activeUrgentAlert, setActiveUrgentAlert] = useState(null);
  const seenHazardsRef = useRef(new Set());

  // 1. Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Subscribe to Live Vehicles
  useEffect(() => {
    const unsub = subscribeLiveLocations((locs) => {
      setVehicles(locs || []);
      setLoadingVehicles(false);
    });
    return unsub;
  }, []);

  // 3. Subscribe to Hazards & Detect New Urgent Hazards
  useEffect(() => {
    const unsub = subscribeHazards((hazList) => {
      setHazards(hazList || []);
      setLoadingHazards(false);

      // Check for newly spawned critical hazards
      const criticalTypes = ["accident", "breakdown", "landslide"];
      for (const h of hazList || []) {
        if (h.active && criticalTypes.includes(h.type) && !seenHazardsRef.current.has(h.id)) {
          seenHazardsRef.current.add(h.id);
          // Trigger audio beep, vibration, and bottom-left danger alert
          triggerAdminAlertSound();
          setActiveUrgentAlert(h);
          toast.danger(
            language === "ta"
              ? `புதிய ஆபத்து கண்டறியப்பட்டது: ${h.type.toUpperCase()}`
              : `CRITICAL ALERT: New ${h.type.toUpperCase()} reported!`
          );
        }
      }
    });
    return unsub;
  }, [language, toast]);

  // 4. Initial Fetch Deliveries
  const fetchDeliveries = useCallback(async () => {
    try {
      const list = await getDeliveries();
      setDeliveries(list || []);
    } catch (err) {
      console.error("Failed fetching deliveries:", err);
    } finally {
      setLoadingDeliveries(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // 5. Selected Driver resolution
  const selectedDriver = useMemo(() => {
    if (!selectedDriverUid && vehicles.length > 0) {
      return vehicles[0];
    }
    return vehicles.find((v) => v.uid === selectedDriverUid) || vehicles[0] || null;
  }, [selectedDriverUid, vehicles]);

  // Set initial selected driver when vehicles load
  useEffect(() => {
    if (!selectedDriverUid && vehicles.length > 0) {
      setSelectedDriverUid(vehicles[0].uid);
    }
  }, [vehicles, selectedDriverUid]);

  // 6. Subscribe to Messages with selected driver
  useEffect(() => {
    if (!selectedDriver?.uid) return;
    const unsub = subscribeMessages(selectedDriver.uid, (msgs) => {
      setChatMessages(msgs || []);
    });
    return unsub;
  }, [selectedDriver?.uid]);

  // Handle Send Chat Message
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !selectedDriver) return;
    try {
      await sendMessage(profile?.uid || "admin", selectedDriver.uid, chatInput.trim());
      setChatInput("");
      toast.success(
        language === "ta"
          ? "ஓட்டுநருக்கு செய்தி அனுப்பப்பட்டது"
          : `Message dispatched to ${selectedDriver.name}`
      );
    } catch (err) {
      console.error("Send message error:", err);
      toast.error("Failed to send message");
    }
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    const activeVehicles = vehicles.filter((v) => v.status !== "idle").length;
    const emergencyVehicles = vehicles.filter(
      (v) => v.role === "emergency" || v.priority === "medical" || v.priority === "food"
    ).length;
    const activeHazards = hazards.filter((h) => h.active).length;
    const inTransit = deliveries.filter((d) => d.status === "in_transit").length;
    const delayed =
      deliveries.filter((d) => d.status === "delayed").length +
      vehicles.filter((v) => v.status === "delayed" || v.status === "at_risk").length;

    return {
      activeVehicles,
      emergencyVehicles,
      activeHazards,
      inTransit,
      delayed,
    };
  }, [vehicles, hazards, deliveries]);

  // Filtered drivers list
  const filteredDrivers = useMemo(() => {
    let list = [...vehicles];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (v) =>
          v.name?.toLowerCase().includes(q) ||
          v.vehicleNumber?.toLowerCase().includes(q) ||
          v.cargo?.toLowerCase().includes(q) ||
          v.driverId?.toLowerCase().includes(q)
      );
    }

    // Filter chip
    if (driverFilter === "driver") {
      list = list.filter((v) => v.role === "driver" && v.priority === "normal");
    } else if (driverFilter === "emergency") {
      list = list.filter((v) => v.role === "emergency" || v.priority === "medical" || v.priority === "food");
    } else if (driverFilter === "issues") {
      list = list.filter((v) => v.status === "delayed" || v.status === "at_risk" || v.status === "issue");
    }

    // Pin emergency vehicles to top
    return list.sort((a, b) => {
      const aIsEm = a.role === "emergency" || a.priority === "medical" || a.priority === "food";
      const bIsEm = b.role === "emergency" || b.priority === "medical" || b.priority === "food";
      if (aIsEm && !bIsEm) return -1;
      if (!aIsEm && bIsEm) return 1;
      return 0;
    });
  }, [vehicles, searchQuery, driverFilter]);

  // Nearest Hazard calculation for Selected Driver (Impact Box)
  const nearestHazardInfo = useMemo(() => {
    if (!selectedDriver || !hazards.length) return null;

    const activeList = hazards.filter((h) => h.active);
    if (!activeList.length) return null;

    let closest = null;
    let minDist = Infinity;

    for (const h of activeList) {
      const d = haversineMeters([selectedDriver.lat, selectedDriver.lng], [h.lat, h.lng]);
      if (d < minDist) {
        minDist = d;
        closest = h;
      }
    }

    return {
      hazard: closest,
      distanceMeters: minDist,
      distanceKm: (minDist / 1000).toFixed(1),
    };
  }, [selectedDriver, hazards]);

  // Handle Mark Hazard on Map Click
  const handleMapClick = async (e) => {
    if (!markingHazardType || !e?.latlng) return;
    try {
      const { lat, lng } = e.latlng;
      const radiusMap = {
        accident: 300,
        roadblock: 300,
        rain: 800,
        landslide: 1500,
      };
      const severityMap = {
        accident: "high",
        roadblock: "high",
        rain: "medium",
        landslide: "critical",
      };

      await addHazard({
        type: markingHazardType,
        lat,
        lng,
        radiusM: radiusMap[markingHazardType] || 400,
        severity: severityMap[markingHazardType] || "high",
        note: `Dispatcher placed ${markingHazardType.toUpperCase()} at [${lat.toFixed(4)}, ${lng.toFixed(4)}]`,
        reportedBy: `${profile?.name || "Kavya S"} (Admin Dispatcher)`,
      });

      toast.success(
        language === "ta"
          ? `${markingHazardType.toUpperCase()} அபாயம் வரைபடத்தில் பதிவு செய்யப்பட்டது!`
          : `Marked ${markingHazardType.toUpperCase()} hazard on Coimbatore corridor!`
      );
      setMarkingHazardType(null);
    } catch (err) {
      console.error("Mark hazard error:", err);
      toast.error("Failed to mark hazard on map");
    }
  };

  // Handle Resolve Hazard
  const handleResolveHazard = async (id) => {
    try {
      await resolveHazard(id);
      toast.success(
        language === "ta"
          ? "அபாயம் தீர்க்கப்பட்டதாக குறிக்கப்பட்டது"
          : "Hazard marked as resolved & corridor cleared"
      );
      if (activeUrgentAlert?.id === id) {
        setActiveUrgentAlert(null);
      }
    } catch (err) {
      console.error("Resolve hazard error:", err);
      toast.error("Failed to resolve hazard");
    }
  };

  // Handle Re-optimize Driver Route via QARS
  const handleReoptimizeDriver = async () => {
    if (!selectedDriver) return;
    try {
      setIsReoptimizing(true);
      // Plan candidates from driver's current position to destination
      const dest = selectedDriver.destinationCoords || { lat: 11.0168, lng: 76.9670 };
      const routesRes = await planRoutes({ lat: selectedDriver.lat, lng: selectedDriver.lng }, dest);

      await runQars({
        from: { lat: selectedDriver.lat, lng: selectedDriver.lng },
        to: dest,
        routes: routesRes.routes,
        hazards,
        priority: selectedDriver.priority,
      });

      // Send dispatch notification message to the driver
      await sendMessage(
        profile?.uid || "admin",
        selectedDriver.uid,
        `QARS ADVISORY: Dynamic bypass synthesized. Avoid reported incident. Reroute corridor confirmed.`
      );

      toast.success(
        language === "ta"
          ? `புதிய பாதை ${selectedDriver.name} அவர்களுக்கு அனுப்பப்பட்டது!`
          : `New route sent to ${selectedDriver.name}!`
      );
    } catch (err) {
      console.error("Re-optimize error:", err);
      toast.error("Failed to compute new route");
    } finally {
      setIsReoptimizing(false);
    }
  };

  // Open SMS modal for a delivery
  const openSmsModal = (del) => {
    setSmsModalDelivery(del);
    // Find closest hazard to prefill reason
    let defaultReason = "heavy traffic congestion along arterial road";
    if (hazards.length > 0) {
      const active = hazards.filter((h) => h.active);
      if (active.length > 0) {
        const closest = active.reduce((best, h) => {
          const d = haversineMeters([del.lat, del.lng], [h.lat, h.lng]);
          if (!best || d < best.d) return { h, d };
          return best;
        }, null);
        if (closest?.h) {
          defaultReason =
            closest.h.type === "accident"
              ? "an accident on Avinashi Road"
              : closest.h.type === "roadblock"
              ? "a roadblock near the junction"
              : closest.h.type === "landslide"
              ? "landslide clearance along Kallar pass"
              : closest.h.type === "rain"
              ? "monsoon waterlogging under the flyover"
              : closest.h.note || "unforeseen road disruption";
        }
      }
    }
    setSmsReason(defaultReason);
    setSmsEta(del.etaText || "by 4:45 PM today");
    setSmsLang(language === "ta" ? "ta" : "en");
  };

  // Send Customer SMS
  const handleSendCustomerSms = async () => {
    if (!smsModalDelivery) return;
    try {
      setIsSendingSms(true);
      const isTa = smsLang === "ta";
      const smsText = isTa
        ? `வணக்கம் ${smsModalDelivery.customerName}, உங்கள் கோவைஸ்விப்ட் டெலிவரி ${smsModalDelivery.code} ${smsReason} காரணமாக சிறிது தாமதமாகிறது. எங்கள் ஓட்டுநர் பாதுகாப்பான மாற்றுப்பாதையில் வருகிறார். உறுதிப்படுத்தப்பட்ட வருகை: ${smsEta}. – கோவைஸ்விப்ட் லாஜிஸ்டிக்ஸ்`
        : `Hi ${smsModalDelivery.customerName}, your KovaiSwift order ${smsModalDelivery.code} is delayed due to ${smsReason}. Our driver is taking a safer route. Assured arrival: ${smsEta}. – KovaiSwift Logistics`;

      await sendCustomerSms({
        to: smsModalDelivery.customerPhone,
        body: smsText,
        deliveryCode: smsModalDelivery.code,
      });

      // Add to local SMS log
      setSmsLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          deliveryCode: smsModalDelivery.code,
          customerName: smsModalDelivery.customerName,
          phone: smsModalDelivery.customerPhone,
          body: smsText,
          time: "Just now",
          status: "Delivered",
        },
        ...prev,
      ]);

      toast.success(
        language === "ta"
          ? "வாடிக்கையாளருக்கு எஸ்எம்எஸ் அனுப்பப்பட்டது!"
          : `Customer SMS sent to ${smsModalDelivery.customerName}!`
      );
      setSmsModalDelivery(null);
    } catch (err) {
      console.error("SMS send error:", err);
      toast.error("Failed to send customer SMS");
    } finally {
      setIsSendingSms(false);
    }
  };

  // Handle Delivery Driver Reassignment
  const handleReassignDriver = async (deliveryId, newDriverUid) => {
    try {
      await updateDelivery(deliveryId, { assignedTo: newDriverUid });
      fetchDeliveries();
      const drv = vehicles.find((v) => v.uid === newDriverUid);
      toast.success(
        language === "ta"
          ? `ஓட்டுநர் மாற்றப்பட்டார்: ${drv?.name || newDriverUid}`
          : `Driver reassigned to ${drv?.name || "Selected Driver"}`
      );
    } catch (err) {
      console.error("Reassign error:", err);
      toast.error("Failed to reassign driver");
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col select-none overflow-hidden font-sans">
      {/* =========================================================================
          1. TOP BAR: Branding, Profile, Clock, KPIs, Global Toggles
      ========================================================================= */}
      <header className="h-16 px-4 sm:px-6 bg-slate-950/95 border-b border-glass-border backdrop-blur-2xl flex items-center justify-between gap-3 shrink-0 z-30">
        {/* Left: Branding & Role */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-primary/20 to-pink/20 border border-cyan-500/40 flex items-center justify-center shadow-glow">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>KovaiSwift Logistics</span>
                <span className="text-cyan-400 font-mono text-xs font-semibold">· Coimbatore</span>
              </h1>
              <Badge variant="cyan" size="sm" className="hidden md:inline-flex">
                {language === "ta" ? "கட்டுப்பாட்டு அறை" : "Control Room"}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {profile?.name || "Kavya S"} &bull;{" "}
              <span className="text-slate-300">
                {language === "ta" ? "தளவாட செயல்பாடுகள்" : (profile?.department || "Logistics Operations")}
              </span>
            </p>
          </div>
        </div>

        {/* Center: Live Clock & Nav Tabs */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-glass-border">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-slate-200 tracking-wider">
              {currentTime || "LIVE TELEMETRY"}
            </span>
          </div>

          {/* View Tab Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-glass-border">
            <button
              onClick={() => setActiveTab("map")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 btn-hover ${
                activeTab === "map"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{language === "ta" ? "கட்டுப்பாட்டு வரைபடம்" : "Control Map"}</span>
            </button>
            <button
              onClick={() => setActiveTab("deliveries")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 btn-hover ${
                activeTab === "deliveries"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>{language === "ta" ? "விநியோகங்கள்" : "Deliveries"} ({deliveries.length})</span>
            </button>
          </div>
        </div>

        {/* Right: Controls & Profile Action */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Mobile Tab Toggle */}
          <div className="flex lg:hidden items-center p-0.5 rounded-lg bg-white/5 border border-glass-border">
            <button
              onClick={() => setActiveTab("map")}
              className={`p-1.5 rounded-md text-xs ${activeTab === "map" ? "bg-cyan-500/30 text-white" : "text-slate-400"}`}
              title="Map"
            >
              <Navigation className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab("deliveries")}
              className={`p-1.5 rounded-md text-xs ${activeTab === "deliveries" ? "bg-cyan-500/30 text-white" : "text-slate-400"}`}
              title="Deliveries"
            >
              <Package className="w-4 h-4" />
            </button>
          </div>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-glass-border text-xs font-bold text-slate-300 transition-colors"
            title="Toggle Language"
          >
            {language === "ta" ? "EN" : "தமிழ்"}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-glass-border text-slate-300 hover:text-white transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-300" />}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-glass-border text-slate-400 hover:text-red-300 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* KPI STATCARDS STRIP */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-950/80 border-b border-glass-border backdrop-blur-md grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 shrink-0 z-20">
        <StatCard
          title={language === "ta" ? "செயலில் உள்ள வாகனங்கள்" : "Active Vehicles"}
          value={kpis.activeVehicles}
          icon={Truck}
          variant="cyan"
          helperText={language === "ta" ? "நேரலை தொலை அளவியல்" : "Simulated & Live Telemetry"}
        />
        <StatCard
          title={language === "ta" ? "அவசரப் பிரிவுகள்" : "Emergency Units"}
          value={kpis.emergencyVehicles}
          icon={ShieldAlert}
          variant="pink"
          helperText={language === "ta" ? "மருத்துவ / அழுகும் முன்னுரிமை" : "Medical / Perishable Priority"}
        />
        <StatCard
          title={language === "ta" ? "செயலில் உள்ள ஆபத்துகள்" : "Active Hazards"}
          value={kpis.activeHazards}
          icon={AlertTriangle}
          variant="warn"
          helperText={language === "ta" ? "பாதை இடர்ப்பாடுகள்" : "Corridor Disruptions"}
        />
        <StatCard
          title={language === "ta" ? "பயணத்தில்" : "In Transit"}
          value={kpis.inTransit}
          icon={Navigation}
          variant="primary"
          helperText={language === "ta" ? "இயங்கும் விநியோகங்கள்" : "Moving Shipments"}
        />
        <StatCard
          title={language === "ta" ? "தாமதம் / ஆபத்தில்" : "Delayed / At Risk"}
          value={kpis.delayed}
          icon={AlertOctagon}
          variant="danger"
          helperText={language === "ta" ? "மறுசீரமைப்பு நிலுவையில்" : "Pending Re-optimization"}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* =========================================================================
          MAIN CONTENT AREA
      ========================================================================= */}
      {activeTab === "deliveries" ? (
        /* TAB 2: DELIVERIES & DISPATCH MANAGEMENT TABLE */
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/60 backdrop-blur-md flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-400" />
                <span>Delivery Commitments & Dispatch Control</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time KovaiSwift shipment roster, driver assignment, and customer delay broadcast
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchDeliveries}
                icon={RefreshCw}
              >
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Deliveries Table Card */}
          <div className="rounded-2xl border border-glass-border bg-slate-950/85 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-glass-border bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                    <th className="p-3.5 pl-4">{language === "ta" ? "குறியீடு" : "Code"}</th>
                    <th className="p-3.5">{language === "ta" ? "வாடிக்கையாளர்" : "Customer"}</th>
                    <th className="p-3.5">{language === "ta" ? "சரக்கு விவரம்" : "Cargo Details"}</th>
                    <th className="p-3.5">{language === "ta" ? "முன்னுரிமை" : "Priority"}</th>
                    <th className="p-3.5">{language === "ta" ? "ஒதுக்கப்பட்ட ஓட்டுநர்" : "Assigned Driver"}</th>
                    <th className="p-3.5">{language === "ta" ? "நிலை" : "Status"}</th>
                    <th className="p-3.5">{language === "ta" ? "வருகை நேரம்" : "ETA"}</th>
                    <th className="p-3.5">{language === "ta" ? "தொலைபேசி" : "Phone"}</th>
                    <th className="p-3.5 pr-4 text-right">{language === "ta" ? "செயல்கள்" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border/60">
                  {loadingDeliveries ? (
                    [1, 2, 3, 4, 5].map((n) => (
                      <tr key={n}>
                        <td className="p-3.5 pl-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="p-3.5"><Skeleton className="h-4 w-32 mb-1" /><Skeleton className="h-3 w-44" /></td>
                        <td className="p-3.5"><Skeleton className="h-4 w-28" /></td>
                        <td className="p-3.5"><Skeleton className="h-4 w-16 rounded-full" /></td>
                        <td className="p-3.5"><Skeleton className="h-7 w-28 rounded-lg" /></td>
                        <td className="p-3.5"><Skeleton className="h-4 w-16" /></td>
                        <td className="p-3.5"><Skeleton className="h-6 w-20" /></td>
                        <td className="p-3.5"><Skeleton className="h-6 w-24" /></td>
                        <td className="p-3.5 pr-4 text-right"><Skeleton className="h-7 w-28 ml-auto rounded-xl" /></td>
                      </tr>
                    ))
                  ) : deliveries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center">
                        <EmptyState
                          icon={Package}
                          title={language === "ta" ? "விநியோகங்கள் எதுவும் இல்லை" : "No Deliveries Queued"}
                          description={
                            language === "ta"
                              ? "தற்போது ஒதுக்கப்பட்ட விநியோகங்கள் பட்டியலில் இல்லை."
                              : "No shipment commitments found in the dispatch roster."
                          }
                        />
                      </td>
                    </tr>
                  ) : (
                    deliveries.map((del) => {
                      const isMedical = del.priority === "medical";
                      const isFood = del.priority === "food";

                      return (
                        <tr key={del.id} className="hover:bg-white/[0.03] transition-colors">
                          <td className="p-3.5 pl-4 font-mono font-bold text-cyan-300">
                            {del.code}
                          </td>
                          <td className="p-3.5">
                            <div className="font-semibold text-slate-200">{del.customerName}</div>
                            <div className="text-[10px] text-slate-400 line-clamp-1">{del.address}</div>
                          </td>
                          <td className="p-3.5 text-slate-300">{del.cargo}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                isMedical
                                  ? "bg-red-500/20 text-red-300 border-red-500/40"
                                  : isFood
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                  : "bg-slate-500/20 text-slate-300 border-slate-500/40"
                              }`}
                            >
                              {del.priority}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {/* Driver Reassignment Dropdown */}
                            <select
                              value={del.assignedTo || ""}
                              onChange={(e) => handleReassignDriver(del.id, e.target.value)}
                              className="bg-slate-900 border border-glass-border text-slate-200 text-xs rounded-lg px-2 py-1 outline-none focus:border-cyan-400"
                            >
                              <option value="">{language === "ta" ? "ஒதுக்கப்படவில்லை" : "Unassigned"}</option>
                              {vehicles.map((v) => (
                                <option key={v.uid} value={v.uid}>
                                  {v.name} ({v.vehicleNumber})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                                del.status === "delivered"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : del.status === "in_transit"
                                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                  : del.status === "delayed"
                                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                  : "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                              }`}
                            >
                              {del.status}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {/* Editable ETA */}
                            <input
                              type="text"
                              defaultValue={del.etaText || "by 4:45 PM"}
                              onBlur={(e) => updateDelivery(del.id, { etaText: e.target.value })}
                              className="w-24 bg-white/5 border border-glass-border px-2 py-1 rounded text-xs text-slate-200 font-mono focus:border-cyan-400 outline-none"
                              title="Click to edit ETA"
                            />
                          </td>
                          <td className="p-3.5">
                            {/* Editable Phone */}
                            <input
                              type="text"
                              defaultValue={del.customerPhone || "+91 98421 00000"}
                              onBlur={(e) => updateDelivery(del.id, { customerPhone: e.target.value })}
                              className="w-28 bg-white/5 border border-glass-border px-2 py-1 rounded text-xs text-slate-200 font-mono focus:border-cyan-400 outline-none"
                              title="Click to edit customer phone"
                            />
                          </td>
                          <td className="p-3.5 pr-4 text-right">
                            <button
                              onClick={() => openSmsModal(del)}
                              className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 ml-auto transition-all"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{language === "ta" ? "SMS அனுப்பு" : "Notify Customer"}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SMS Broadcast Audit Log */}
          <div className="rounded-2xl border border-glass-border bg-slate-950/85 backdrop-blur-xl p-5 shadow-2xl flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>{language === "ta" ? "வாடிக்கையாளர் SMS வரலாறு" : "Customer SMS Broadcast History"} ({smsLogs.length})</span>
            </h3>
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              {smsLogs.length === 0 ? (
                <EmptyState
                  icon={Send}
                  title={language === "ta" ? "SMS வரலாறு இல்லை" : "No Broadcasts Recorded"}
                  description={
                    language === "ta"
                      ? "வாடிக்கையாளர்களுக்கு அனுப்பப்பட்ட SMS தகவல்கள் இங்கே தோன்றும்."
                      : "Delay alert logs dispatched to customers will appear here."
                  }
                  compact
                />
              ) : (
                smsLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-white/[0.02] border border-glass-border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-cyan-300">{log.deliveryCode}</span>
                        <span className="text-xs text-slate-200 font-semibold">&bull; {log.customerName}</span>
                        <span className="text-[11px] font-mono text-slate-400">({log.phone})</span>
                      </div>
                      <p className="text-xs text-slate-300 font-sans italic">&ldquo;{log.body}&rdquo;</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-slate-400 font-mono">{log.time}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TAB 1: MISSION CONTROL (LEFT SIDEBAR + CENTER MAP + RIGHT PANEL) */
        <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
          {/* =========================================================================
              2. LEFT SIDEBAR: Live Drivers List, Search, Filter Chips
          ========================================================================= */}
          <aside className="w-full lg:w-72 xl:w-80 bg-slate-950/90 lg:bg-slate-950/80 backdrop-blur-2xl border-b lg:border-b-0 lg:border-r border-glass-border p-3.5 sm:p-4 flex flex-col gap-3 shrink-0 z-20">
            {/* Header & Search */}
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Fleet ({filteredDrivers.length})</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                {vehicles.length} Units Online
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === "ta" ? "ஓட்டுநர், வாகனம், சரக்கு தேடு..." : "Search driver, vehicle, cargo..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-glass-border text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {[
                { id: "all", label: language === "ta" ? "அனைத்தும்" : "All" },
                { id: "driver", label: language === "ta" ? "ஓட்டுநர்" : "Driver" },
                { id: "emergency", label: language === "ta" ? "அவசரம்" : "Emergency" },
                { id: "issues", label: language === "ta" ? "சிக்கல்கள்" : "Issues" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDriverFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 ${
                    driverFilter === f.id
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-white/5 text-slate-400 hover:text-white border border-transparent"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Drivers Scroll List */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 max-h-[35vh] lg:max-h-[calc(100vh-270px)] pr-1">
              {loadingVehicles ? (
                [1, 2, 3, 4].map((n) => (
                  <div key={n} className="p-3 rounded-xl border border-glass-border bg-white/[0.02] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                    <Skeleton className="h-3 w-36" />
                  </div>
                ))
              ) : filteredDrivers.length === 0 ? (
                <EmptyState
                  icon={Truck}
                  title={language === "ta" ? "வாகனங்கள் இல்லை" : "No Drivers Found"}
                  description={
                    language === "ta"
                      ? "தேடல் அல்லது வடிகட்டலுக்கு பொருந்தும் வாகனங்கள் எதுவும் இல்லை."
                      : "No active fleet vehicles match your search or filter."
                  }
                  compact
                />
              ) : (
                filteredDrivers.map((driver) => {
                  const isSelected = selectedDriver?.uid === driver.uid;
                  const isEmergency =
                    driver.role === "emergency" ||
                    driver.priority === "medical" ||
                    driver.priority === "food";
                  const isDelayed = driver.status === "delayed" || driver.status === "at_risk";

                  return (
                    <div
                      key={driver.uid}
                      onClick={() => {
                        setSelectedDriverUid(driver.uid);
                        setFlyToCoords([driver.lat, driver.lng]);
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all relative ${
                        isSelected
                          ? isEmergency
                            ? "bg-red-500/15 border-red-500 shadow-md shadow-red-500/10"
                            : "bg-cyan-500/15 border-cyan-400 shadow-md shadow-cyan-500/10"
                          : "bg-white/[0.02] hover:bg-white/[0.05] border-glass-border"
                      }`}
                    >
                      {/* Top Row: Name, Vehicle No, Status Dot */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Status Dot */}
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isDelayed
                                ? "bg-red-500 animate-ping"
                                : driver.status === "at_risk"
                                ? "bg-amber-400"
                                : "bg-emerald-400"
                            }`}
                          />
                          <span className="font-bold text-xs text-white">{driver.name}</span>
                        </div>

                        {/* Pinned Red Emergency Badge */}
                        {isEmergency ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-red-500/25 border border-red-500 text-red-300 animate-pulse">
                            🚨 {language === "ta" ? "அவசரம்" : "Emergency"}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400">
                            {driver.speedKmh || 40} km/h
                          </span>
                        )}
                      </div>

                      {/* Middle Row: Vehicle Number & Priority */}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px] font-mono font-semibold text-cyan-300">
                          {driver.vehicleNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">3s ago</span>
                      </div>

                      {/* Bottom Row: Cargo summary */}
                      {driver.cargo && (
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 font-sans">
                          📦 {driver.cargo}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* =========================================================================
              3. CENTER: FleetMap + Mark Hazard Toolbar
          ========================================================================= */}
          <main className="flex-1 relative h-[50vh] lg:h-[calc(100vh-120px)] flex flex-col overflow-hidden">
            <FleetMap
              center={COIMBATORE_CENTER}
              zoom={13}
              vehicles={vehicles}
              hazards={hazards}
              deliveries={deliveries}
              selectedUid={selectedDriver?.uid}
              flyTo={flyToCoords}
              onMapClick={handleMapClick}
              height="100%"
              showDepot={true}
              depotCoords={[DEPOT_PEELAMEDU.lat, DEPOT_PEELAMEDU.lng]}
            />

            {/* "MARK HAZARD" FLOATING TOOLBAR */}
            <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-glass-border shadow-2xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 hidden sm:inline">
                Mark Hazard:
              </span>

              <button
                onClick={() =>
                  setMarkingHazardType(markingHazardType === "accident" ? null : "accident")
                }
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  markingHazardType === "accident"
                    ? "bg-red-500 text-white shadow-glow-danger"
                    : "bg-white/5 text-red-300 hover:bg-red-500/20 border border-white/5"
                }`}
              >
                <span>💥</span>
                <span>Accident</span>
                <span className="text-[9px] opacity-75">(300m)</span>
              </button>

              <button
                onClick={() =>
                  setMarkingHazardType(markingHazardType === "roadblock" ? null : "roadblock")
                }
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  markingHazardType === "roadblock"
                    ? "bg-amber-500 text-slate-950 shadow-glow-warn font-bold"
                    : "bg-white/5 text-amber-300 hover:bg-amber-500/20 border border-white/5"
                }`}
              >
                <span>🚧</span>
                <span>Roadblock</span>
                <span className="text-[9px] opacity-75">(300m)</span>
              </button>

              <button
                onClick={() =>
                  setMarkingHazardType(markingHazardType === "rain" ? null : "rain")
                }
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  markingHazardType === "rain"
                    ? "bg-cyan-500 text-slate-950 shadow-glow-cyan font-bold"
                    : "bg-white/5 text-cyan-300 hover:bg-cyan-500/20 border border-white/5"
                }`}
              >
                <span>🌧</span>
                <span>Rain</span>
                <span className="text-[9px] opacity-75">(800m)</span>
              </button>

              <button
                onClick={() =>
                  setMarkingHazardType(markingHazardType === "landslide" ? null : "landslide")
                }
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  markingHazardType === "landslide"
                    ? "bg-purple-600 text-white shadow-glow font-bold"
                    : "bg-white/5 text-purple-300 hover:bg-purple-600/20 border border-white/5"
                }`}
              >
                <span>⛰</span>
                <span>Landslide</span>
                <span className="text-[9px] opacity-75">(1500m)</span>
              </button>

              {markingHazardType && (
                <button
                  onClick={() => setMarkingHazardType(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                  title="Cancel marking"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Active Hazard Marking Guidance Chip */}
            {markingHazardType && (
              <div className="absolute top-16 left-4 z-10 p-2 px-3 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold shadow-2xl animate-pulse flex items-center gap-2">
                <Navigation className="w-4 h-4 fill-current" />
                <span>
                  Click anywhere on the satellite road to plant {markingHazardType.toUpperCase()} hazard!
                </span>
                <button
                  onClick={() => setMarkingHazardType(null)}
                  className="ml-2 text-slate-950 hover:opacity-75 underline text-[11px]"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* =========================================================================
                5. BOTTOM DRAWER: Disruption Feed (Collapsible)
            ========================================================================= */}
            <div
              className={`absolute bottom-0 left-0 right-0 z-20 bg-slate-950/95 backdrop-blur-2xl border-t border-glass-border transition-all duration-300 ${
                isFeedDrawerOpen ? "h-64" : "h-10"
              }`}
            >
              {/* Drawer Handle */}
              <button
                onClick={() => setIsFeedDrawerOpen(!isFeedDrawerOpen)}
                className="w-full h-10 px-4 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>
                    Disruption Feed &bull; {hazards.filter((h) => h.active).length} Active Disruptions
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                  <span>{isFeedDrawerOpen ? "Collapse Feed" : "Expand Disruption Feed"}</span>
                  {isFeedDrawerOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
              </button>

              {/* Feed Content */}
              {isFeedDrawerOpen && (
                <div className="p-4 h-[calc(100%-40px)] overflow-y-auto flex flex-col gap-2">
                  {loadingHazards ? (
                    [1, 2].map((n) => (
                      <div key={n} className="p-3 rounded-xl bg-white/[0.02] border border-glass-border flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-lg" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                        <Skeleton className="h-7 w-20 rounded-xl" />
                      </div>
                    ))
                  ) : hazards.filter((h) => h.active).length === 0 ? (
                    <EmptyState
                      icon={ShieldAlert}
                      title={language === "ta" ? "அனைத்து வழிகளும் பாதுகாப்பானவை" : "All Corridors Safe"}
                      description={
                        language === "ta"
                          ? "கோயம்புத்தூரில் தற்போது செயலில் உள்ள சாலைத் தடைகள் எதுவும் இல்லை."
                          : "No active corridor hazards reported across Coimbatore."
                      }
                      compact
                    />
                  ) : (
                    hazards
                      .filter((h) => h.active)
                      .map((h) => (
                        <div
                          key={h.id}
                          className="p-3 rounded-xl bg-white/[0.02] border border-glass-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="text-xl shrink-0 mt-0.5">
                              {h.type === "accident"
                                ? "💥"
                                : h.type === "roadblock"
                                ? "🚧"
                                : h.type === "landslide"
                                ? "⛰"
                                : "🌧"}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold uppercase text-white">
                                  {h.type}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                                  {h.severity}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Radius: {h.radiusM}m
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 mt-1">{h.note}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                Reported by: {h.reportedBy || "Driver Karthik V"} &bull; [
                                {Number(h.lat).toFixed(4)}, {Number(h.lng).toFixed(4)}]
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleResolveHazard(h.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{language === "ta" ? "சரிசெய்" : "Resolve"}</span>
                          </button>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          </main>

          {/* =========================================================================
              4. RIGHT PANEL: Selected Driver, Comms, QARS Re-optimize, 3-Step Impact
          ========================================================================= */}
          <aside className="w-full lg:w-80 xl:w-96 bg-slate-950/95 lg:bg-slate-950/85 backdrop-blur-2xl border-t lg:border-t-0 lg:border-l border-glass-border p-4 sm:p-5 flex flex-col gap-4 shrink-0 overflow-y-auto max-h-[50vh] lg:max-h-[calc(100vh-120px)] z-20">
            {selectedDriver ? (
              <>
                {/* Driver Header Card */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-glass-border flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-extrabold text-base">
                        {selectedDriver.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-white">{selectedDriver.name}</h3>
                        <p className="text-xs font-mono text-cyan-400 font-bold">
                          {selectedDriver.vehicleNumber}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {selectedDriver.phone || "+91 98421 23011"}
                        </p>
                      </div>
                    </div>

                    {/* Role & Priority Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase border ${
                        selectedDriver.role === "emergency"
                          ? "bg-red-500/20 text-red-300 border-red-500/40"
                          : "bg-slate-500/20 text-slate-300 border-slate-500/40"
                      }`}
                    >
                      {selectedDriver.priority === "medical"
                        ? "MED OXYGEN"
                        : selectedDriver.priority === "food"
                        ? "FOOD AGRO"
                        : "DRIVER"}
                    </span>
                  </div>

                  {/* Status & Position Coordinates */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-glass-border/60">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-bold text-slate-200 capitalize flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {selectedDriver.status || "In Transit"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>GPS Telemetry:</span>
                    <span className="text-slate-300">
                      {selectedDriver.lat.toFixed(4)}, {selectedDriver.lng.toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Current Delivery Details */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-glass-border flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Active Shipment:</span>
                    <span className="font-mono font-bold text-cyan-300">
                      {selectedDriver.deliveryCode || "DEL-ACTIVE-01"}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200">
                    {selectedDriver.destination || "Gandhipuram Logistics Hub"}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Cargo:{" "}
                    <span className="text-slate-300">
                      {selectedDriver.cargo || "High-Priority Freight"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-400">Delivery Status:</span>
                    <span className="text-emerald-400 font-bold">
                      {selectedDriver.delivered ? "Delivered ✓" : "In Progress"}
                    </span>
                  </div>
                </div>

                {/* ACTION BUTTONS: Call, Message, Re-optimize */}
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={`tel:${selectedDriver.phone || "+919842145210"}`}
                    className="py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-glass-border text-white text-xs font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Call</span>
                  </a>

                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-glass-border text-white text-xs font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Chat</span>
                  </button>

                  <button
                    onClick={handleReoptimizeDriver}
                    disabled={isReoptimizing}
                    className="py-2 px-2 rounded-xl bg-gradient-to-r from-cyan-500/30 to-primary/30 hover:from-cyan-500/40 hover:to-primary/40 border border-cyan-400/50 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-sm"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isReoptimizing ? "animate-spin" : ""}`} />
                    <span>Re-optimize</span>
                  </button>
                </div>

                {/* =========================================================================
                    IMPACT BOX: 3 Steps (What changed? What is affected? What next?)
                ========================================================================= */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-cyan-500/30 shadow-2xl flex flex-col gap-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Disruption Impact Analysis</span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">QARS Engine</span>
                  </div>

                  {/* Step 1: What changed? */}
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-glass-border">
                    <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1">
                      <span>1. What Changed?</span>
                    </div>
                    <p className="text-xs text-slate-200 mt-1">
                      {nearestHazardInfo
                        ? `Active ${nearestHazardInfo.hazard.type.toUpperCase()} (${nearestHazardInfo.hazard.severity}) detected ${nearestHazardInfo.distanceKm} km away near ${nearestHazardInfo.hazard.note}.`
                        : "Normal arterial traffic flow; corridor clear across KovaiSwift sector."}
                    </p>
                  </div>

                  {/* Step 2: What is affected? */}
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-glass-border">
                    <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1">
                      <span>2. What is Affected?</span>
                    </div>
                    <p className="text-xs text-slate-200 mt-1">
                      {nearestHazardInfo && nearestHazardInfo.distanceMeters < 8000
                        ? `Shipment ${selectedDriver.deliveryCode || "DEL-01"} (${selectedDriver.cargo}) impacted by ~${Math.round(nearestHazardInfo.distanceMeters / 150)} min delay. Customer commitment at risk.`
                        : "Shipment on schedule; dynamic ETA variance within ±2 minutes."}
                    </p>
                  </div>

                  {/* Step 3: What next? */}
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-glass-border flex flex-col gap-2">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                      <span>3. What Should We Do Next?</span>
                    </div>
                    <p className="text-xs text-slate-200">
                      {nearestHazardInfo && nearestHazardInfo.distanceMeters < 8000
                        ? "Execute Quantum Swarm (QARS) dynamic bypass to reroute driver around bottleneck."
                        : "Monitor regular cruising speed & maintain automated ETA synchronisation."}
                    </p>
                    <button
                      onClick={handleReoptimizeDriver}
                      disabled={isReoptimizing}
                      className="w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md mt-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {nearestHazardInfo && nearestHazardInfo.distanceMeters < 8000
                          ? "Engage QARS Bypass Route"
                          : "Refresh Optimal Corridor"}
                      </span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Select a vehicle from the fleet list to inspect telemetry and dispatch actions.
              </div>
            )}
          </aside>
        </div>
      )}

      {/* =========================================================================
          7. BOTTOM-LEFT URGENT HAZARD NOTIFICATION CARD (Audio + Vibration)
      ========================================================================= */}
      {activeUrgentAlert && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm w-full p-4 rounded-2xl bg-slate-950/95 border-2 border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.5)] backdrop-blur-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl animate-bounce">🚨</span>
              <div>
                <h4 className="text-sm font-extrabold text-red-400">
                  CRITICAL DISRUPTION DETECTED!
                </h4>
                <p className="text-xs text-slate-200 font-semibold mt-0.5">
                  {activeUrgentAlert.type.toUpperCase()} &bull; Severity: {activeUrgentAlert.severity}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveUrgentAlert(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-2 line-clamp-2">
            {activeUrgentAlert.note}
          </p>

          <div className="grid grid-cols-2 gap-2 mt-3.5">
            <button
              onClick={() => {
                setFlyToCoords([activeUrgentAlert.lat, activeUrgentAlert.lng]);
                setActiveUrgentAlert(null);
              }}
              className="py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Locate on Map</span>
            </button>

            <button
              onClick={() => handleResolveHazard(activeUrgentAlert.id)}
              className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-1 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolve</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: 💬 DRIVER CHAT THREAD MODAL
      ========================================================================= */}
      {isChatOpen && selectedDriver && (
        <Modal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          title={`Dispatcher Comms · ${selectedDriver.name} (${selectedDriver.vehicleNumber})`}
          description="Direct two-way dispatch instructions & telemetry log"
          size="md"
        >
          <div className="flex flex-col gap-3 h-80">
            {/* Messages Log */}
            <div className="flex-1 overflow-y-auto p-3 rounded-xl bg-white/[0.02] border border-glass-border flex flex-col gap-2.5">
              {chatMessages.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  No prior messages with this driver. Send a dispatch instruction below.
                </div>
              ) : (
                chatMessages.map((m) => {
                  const isAdmin = m.fromUid === "admin" || m.fromUid === profile?.uid;
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[85%] p-2.5 rounded-xl text-xs ${
                        isAdmin
                          ? "ml-auto bg-cyan-500/20 border border-cyan-500/40 text-cyan-100"
                          : "mr-auto bg-white/10 border border-white/10 text-slate-200"
                      }`}
                    >
                      <p className="font-sans leading-relaxed">{m.text}</p>
                      <span className="text-[9px] text-slate-400 block mt-1 font-mono">
                        {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Row */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Type dispatch advisory or instructions..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendChatMessage}
                icon={Send}
              >
                Send
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL 2: 📩 NOTIFY CUSTOMER SMS MODAL & LIVE PREVIEW
      ========================================================================= */}
      {smsModalDelivery && (
        <Modal
          isOpen={!!smsModalDelivery}
          onClose={() => setSmsModalDelivery(null)}
          title={`Notify Customer · ${smsModalDelivery.customerName}`}
          description={`Order #${smsModalDelivery.code} Delay Broadcast & Assured ETA`}
          size="lg"
        >
          <div className="flex flex-col gap-4">
            {/* Form Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Delay Reason (Prefilled from Hazard):
                </label>
                <input
                  type="text"
                  value={smsReason}
                  onChange={(e) => setSmsReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Assured Arrival ETA:
                </label>
                <input
                  type="text"
                  value={smsEta}
                  onChange={(e) => setSmsEta(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Broadcast Language:</span>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-glass-border">
                <button
                  type="button"
                  onClick={() => setSmsLang("en")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    smsLang === "en" ? "bg-cyan-500 text-slate-950" : "text-slate-400"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setSmsLang("ta")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    smsLang === "ta" ? "bg-cyan-500 text-slate-950" : "text-slate-400"
                  }`}
                >
                  தமிழ் (Tamil)
                </button>
              </div>
            </div>

            {/* LIVE SMS PREVIEW CARD */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 shadow-2xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live SMS Gateway Preview &bull; {smsModalDelivery.customerPhone}
                </span>
                <span className="text-[10px] font-mono text-slate-400">Twilio / Karix SMS</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-slate-200 font-sans leading-relaxed">
                {smsLang === "ta"
                  ? `வணக்கம் ${smsModalDelivery.customerName}, உங்கள் கோவைஸ்விப்ட் டெலிவரி ${smsModalDelivery.code} ${smsReason} காரணமாக சிறிது தாமதமாகிறது. எங்கள் ஓட்டுநர் பாதுகாப்பான மாற்றுப்பாதையில் வருகிறார். உறுதிப்படுத்தப்பட்ட வருகை: ${smsEta}. – கோவைஸ்விப்ட் லாஜிஸ்டிக்ஸ்`
                  : `Hi ${smsModalDelivery.customerName}, your KovaiSwift order ${smsModalDelivery.code} is delayed due to ${smsReason}. Our driver is taking a safer route. Assured arrival: ${smsEta}. – KovaiSwift Logistics`}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setSmsModalDelivery(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSendCustomerSms}
                disabled={isSendingSms}
                icon={Send}
              >
                {isSendingSms ? "Dispatching..." : "Send Customer SMS"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
