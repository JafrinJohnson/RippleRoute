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
  subscribeDeliveries,
  updateDelivery,
  getHazards,
  subscribeHazards,
  addHazard,
  resolveHazard,
  planRoutes,
  runQars,
  getAdvisory,
  checkWeatherHazards,
  subscribeLiveLocations,
  sendMessage,
  subscribeMessages,
  logCustomerNotification,
  subscribeSmsLogs,
  DEPOT_PEELAMEDU,
  COIMBATORE_CENTER,
} from "@/services/api";
import { buildCustomerSms } from "@/lib/smsTemplate";
import { seedDemoData } from "@/lib/seed";
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
 * Validate Indian mobile number: 10 digits starting with 6–9 (with optional 0, 91, or +91 prefix)
 */
function validateIndianPhone(phone) {
  if (!phone) return { valid: false, digits: "" };
  const raw = String(phone).replace(/\D/g, "");
  let mobile10 = "";
  if (raw.length === 10) {
    mobile10 = raw;
  } else if (raw.length === 11 && raw.startsWith("0")) {
    mobile10 = raw.slice(1);
  } else if (raw.length === 12 && raw.startsWith("91")) {
    mobile10 = raw.slice(2);
  } else {
    return { valid: false, digits: "" };
  }
  if (/^[6-9]\d{9}$/.test(mobile10)) {
    return { valid: true, digits: `91${mobile10}` };
  }
  return { valid: false, digits: "" };
}

/**
 * Mask phone numbers for audit display: +91 75xxxxx940 format
 */
function maskPhoneNumber(phone) {
  if (!phone) return "+91 75xxxxx940";
  const digits = String(phone).replace(/\D/g, "");
  let mobile10 = "";
  if (digits.length === 10) {
    mobile10 = digits;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    mobile10 = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith("91")) {
    mobile10 = digits.slice(2);
  } else if (digits.length > 10) {
    mobile10 = digits.slice(-10);
  } else {
    return phone;
  }
  return `+91 ${mobile10.slice(0, 2)}xxxxx${mobile10.slice(-3)}`;
}

/**
 * Format timestamp for audit log display
 */
function formatLogTime(createdAt) {
  if (!createdAt) return "Just now";
  let d;
  if (typeof createdAt === "object" && createdAt?.toMillis) {
    d = new Date(createdAt.toMillis());
  } else if (typeof createdAt === "object" && createdAt?.seconds) {
    d = new Date(createdAt.seconds * 1000);
  } else {
    d = new Date(createdAt);
  }
  if (isNaN(d.getTime())) return String(createdAt);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * Official WhatsApp SVG icon component
 */
function WhatsAppIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

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
  const [weatherHazards, setWeatherHazards] = useState([]);
  const [isScanningWeather, setIsScanningWeather] = useState(false);
  const allMapHazards = useMemo(() => [...hazards, ...weatherHazards], [hazards, weatherHazards]);
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

  // Customer WhatsApp Notification Modal
  const [smsModalDelivery, setSmsModalDelivery] = useState(null);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsReason, setSmsReason] = useState("");
  const [smsEta, setSmsEta] = useState("");
  const [smsLang, setSmsLang] = useState("en");
  const [modalStep, setModalStep] = useState("compose"); // "compose" | "confirm" | "success"
  const [phoneError, setPhoneError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [smsLogs, setSmsLogs] = useState([]);

  // Subscribe to Customer SMS / WhatsApp Audit Logs
  useEffect(() => {
    const unsub = subscribeSmsLogs((logs) => {
      setSmsLogs(logs || []);
    });
    return unsub;
  }, []);

  // Live WhatsApp Preview using template builder (max 320 chars)
  const smsPreviewText = useMemo(() => {
    if (!smsModalDelivery) return "";
    return buildCustomerSms({
      customerName: smsModalDelivery.customerName,
      code: smsModalDelivery.code,
      reason: smsReason,
      etaText: smsEta,
      lang: smsLang,
    });
  }, [smsModalDelivery, smsReason, smsEta, smsLang]);

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

  // 4. Subscribe to Deliveries
  const [isSeeding, setIsSeeding] = useState(false);

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
    const unsub = subscribeDeliveries((list) => {
      setDeliveries(list || []);
      setLoadingDeliveries(false);
    });
    return unsub;
  }, []);

  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      const res = await seedDemoData();
      if (res.ok) {
        toast.success(
          language === "ta"
            ? "டெமோ தரவு வெற்றிகரமாக சேர்க்கப்பட்டது!"
            : `Demo data seeded successfully (${res.created} records)!`
        );
      } else {
        toast.error(res.error || "Failed to seed demo data");
      }
    } catch (err) {
      console.error("Seed demo data error:", err);
      toast.error("Failed to seed demo data");
    } finally {
      setIsSeeding(false);
    }
  };

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

  // In-flight guard for re-optimizing
  const isReoptimizingRef = useRef(false);

  // Handle Re-optimize Driver Route via QARS
  const handleReoptimizeDriver = async () => {
    if (!selectedDriver) return;
    if (isReoptimizingRef.current) return;
    isReoptimizingRef.current = true;
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
      isReoptimizingRef.current = false;
      setIsReoptimizing(false);
    }
  };

  // Open WhatsApp modal for a delivery
  const openSmsModal = (del) => {
    setSmsModalDelivery(del);
    setSmsPhone(del.customerPhone || "");
    setModalStep("compose");
    setPhoneError("");
    setIsConfirming(false);
    setSuccessData(null);

    // Find closest hazard to delivery's driver (or delivery destination)
    let defaultReason = "heavy traffic congestion along arterial road";
    const assignedVehicle = del.assignedTo
      ? vehicles.find((v) => v.uid === del.assignedTo || v.driverId === del.assignedTo)
      : null;
    const refPoint = assignedVehicle ? [assignedVehicle.lat, assignedVehicle.lng] : [del.lat, del.lng];

    const allHazards = [...hazards, ...weatherHazards];
    if (allHazards.length > 0) {
      const active = allHazards.filter((h) => h.active !== false);
      if (active.length > 0) {
        const closest = active.reduce((best, h) => {
          const hLat = h.lat ?? h.location?.lat;
          const hLng = h.lng ?? h.location?.lng;
          if (typeof hLat !== "number" || typeof hLng !== "number") return best;
          const d = haversineMeters(refPoint, [hLat, hLng]);
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
    setSmsEta(del.etaText || "by 4:45 PM");
    setSmsLang(language === "ta" ? "ta" : "en");
  };

  const closeSmsModal = () => {
    setSmsModalDelivery(null);
    setModalStep("compose");
    setPhoneError("");
    setIsConfirming(false);
    setSuccessData(null);
  };

  // 1. One big green primary button: "Send on WhatsApp"
  const handleSendOnWhatsApp = () => {
    if (isConfirming) return;
    const { valid, digits } = validateIndianPhone(smsPhone);
    if (!valid) {
      setPhoneError(
        language === "ta"
          ? "தொலைபேசி எண்ணைச் சரிபார்க்கவும்"
          : "Check the phone number"
      );
      return;
    }
    setPhoneError("");

    const encodedBody = encodeURIComponent(smsPreviewText);
    const waUrl = `https://wa.me/${digits}?text=${encodedBody}`;

    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }

    setModalStep("confirm");
  };

  // 2. Re-open WhatsApp in new tab
  const handleReopenWhatsApp = () => {
    if (isConfirming) return;
    const { valid, digits } = validateIndianPhone(smsPhone);
    if (!valid) return;
    const encodedBody = encodeURIComponent(smsPreviewText);
    const waUrl = `https://wa.me/${digits}?text=${encodedBody}`;
    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  };

  // 3. Admin clicks "✓ Message sent"
  const handleConfirmMessageSent = async () => {
    if (!smsModalDelivery || isConfirming) return;
    try {
      setIsConfirming(true);
      const { digits } = validateIndianPhone(smsPhone);
      const sentTime = new Date();
      const formattedSentTime = sentTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

      // Update delivery: etaText + status "delayed" + lastNotifiedAt + notifiedVia "whatsapp"
      await updateDelivery(smsModalDelivery.id, {
        etaText: smsEta,
        status: "delayed",
        customerPhone: smsPhone,
        lastNotifiedAt: sentTime.toISOString(),
        notifiedVia: "whatsapp",
      });

      // Add a log entry (smsLogs collection, channel "whatsapp", ok: true, to, body, deliveryCode, by, createdAt)
      await logCustomerNotification({
        to: smsPhone,
        body: smsPreviewText,
        deliveryCode: smsModalDelivery.code,
        channel: "whatsapp",
        ok: true,
        by: profile?.name || "Admin Dispatch",
        createdAt: sentTime.toISOString(),
      });

      // Refresh deliveries table
      fetchDeliveries();

      // Toast notification
      toast.success(
        language === "ta"
          ? `${smsModalDelivery.customerName}க்கு வாட்ஸ்அப் தகவல் அனுப்பப்பட்டது ✓`
          : `WhatsApp update sent to ${smsModalDelivery.customerName} ✓`
      );

      // Transition to success screen
      setSuccessData({
        customerName: smsModalDelivery.customerName,
        maskedPhone: maskPhoneNumber(smsPhone || digits),
        etaText: smsEta,
        time: formattedSentTime,
      });
      setModalStep("success");
    } catch (err) {
      console.error("Failed to confirm WhatsApp notification:", err);
      toast.error(
        language === "ta"
          ? "நிலையைப் புதுப்பிப்பதில் தோல்வி"
          : "Failed to update notification status"
      );
    } finally {
      setIsConfirming(false);
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

  // Weather scan for all active vehicle positions (max 8)
  const handleWeatherScan = async () => {
    if (isScanningWeather) return;
    setIsScanningWeather(true);
    try {
      const activePts = (vehicles || [])
        .filter((v) => typeof v.lat === "number" && typeof v.lng === "number")
        .slice(0, 8)
        .map((v) => ({ lat: v.lat, lng: v.lng }));

      const scanPts = activePts.length > 0 ? activePts : [
        { lat: DEPOT_PEELAMEDU.lat, lng: DEPOT_PEELAMEDU.lng },
        { lat: COIMBATORE_CENTER.lat, lng: COIMBATORE_CENTER.lng },
      ];

      const rainZones = await checkWeatherHazards(scanPts);
      const list = Array.isArray(rainZones) ? rainZones : [];
      setWeatherHazards(list);
      toast.success(
        language === "ta"
          ? `வானிலை ஸ்கேன் முடிந்தது — ${list.length} மழை மண்டலங்கள்`
          : `Weather scan complete — ${list.length} rain zones`
      );
    } catch (err) {
      console.error("Weather scan error:", err);
      toast.error("Weather scan failed");
    } finally {
      setIsScanningWeather(false);
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
          {/* Seed demo data button (visible only when there are 0 deliveries) */}
          {deliveries.length === 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSeedData}
              loading={isSeeding}
              icon={Sparkles}
              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/30 text-xs py-1 px-2.5"
            >
              Seed demo data
            </Button>
          )}

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
                            <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2">
                              {del.lastNotifiedAt && (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shrink-0"
                                  title={`Notified via WhatsApp at ${formatLogTime(del.lastNotifiedAt)}`}
                                >
                                  <WhatsAppIcon className="w-3 h-3 fill-current text-emerald-400 shrink-0" />
                                  <span>
                                    {language === "ta" ? "அறிவிக்கப்பட்டது" : "Notified"} {formatLogTime(del.lastNotifiedAt)}
                                  </span>
                                </span>
                              )}
                              <button
                                onClick={() => openSmsModal(del)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 ml-auto transition-all"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5 fill-current text-emerald-400" />
                                <span>{language === "ta" ? "வாட்ஸ்அப் அறிவிப்பு" : "Notify Customer"}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Notifications Audit Log */}
          <div className="rounded-2xl border border-glass-border bg-slate-950/85 backdrop-blur-xl p-5 shadow-2xl flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <WhatsAppIcon className="w-4 h-4 fill-current text-emerald-400" />
              <span>{language === "ta" ? "வாடிக்கையாளர் அறிவிப்புகள்" : "Customer notifications"} ({smsLogs.length})</span>
            </h3>
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              {smsLogs.length === 0 ? (
                <EmptyState
                  icon={WhatsAppIcon}
                  title={language === "ta" ? "அறிவிப்புகள் எதுவும் பதிவு செய்யப்படவில்லை" : "No Notifications Recorded"}
                  description={
                    language === "ta"
                      ? "வாட்ஸ்அப் மூலம் வாடிக்கையாளர்களுக்கு அனுப்பப்பட்ட தாமத அறிவிப்புகள் இங்கே தோன்றும்."
                      : "Delay alert logs dispatched to customers via WhatsApp will appear here."
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold font-mono text-xs ${log.ok !== false ? "text-emerald-400" : "text-red-400"}`}>
                          {log.ok !== false ? "✓" : "✕"}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          title="WhatsApp"
                        >
                          <WhatsAppIcon className="w-3 h-3 fill-current text-emerald-400 shrink-0" />
                          <span>WhatsApp</span>
                        </span>
                        <span className="font-mono font-bold text-xs text-cyan-300">{log.deliveryCode || "DEL"}</span>
                        <span className="text-xs font-mono text-slate-300 font-semibold">{maskPhoneNumber(log.to || log.phone)}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-sans italic">
                        &ldquo;{(log.body || "").slice(0, 60)}{(log.body || "").length > 60 ? "..." : ""}&rdquo;
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-slate-400 font-mono">{formatLogTime(log.createdAt || log.time)}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.ok !== false
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}>
                        {log.ok !== false ? (language === "ta" ? "அனுப்பப்பட்டது ✓" : "Delivered ✓") : (language === "ta" ? "தோல்வி ✕" : "Failed ✕")}
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
              hazards={allMapHazards}
              deliveries={deliveries}
              selectedUid={selectedDriver?.uid}
              flyTo={flyToCoords}
              onMapClick={handleMapClick}
              onVehicleClick={(uid) => {
                setSelectedDriverUid(uid);
                const drv = vehicles.find((v) => v.uid === uid);
                if (drv) setFlyToCoords([drv.lat, drv.lng]);
              }}
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

              {/* Weather Scan Button */}
              <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />
              <button
                onClick={handleWeatherScan}
                disabled={isScanningWeather}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Scan live weather hazards for active vehicles"
              >
                <span>{isScanningWeather ? "⏳" : "🌧️"}</span>
                <span>{isScanningWeather ? "Scanning..." : "Weather scan"}</span>
              </button>
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

                  {/* Road Progress Bar & Dynamic ETA */}
                  <div className="pt-2 border-t border-glass-border/60 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Road Progress:</span>
                      <span className="text-cyan-300 font-bold">
                        {Math.round((selectedDriver.progress || 0) * 100)}%
                        {selectedDriver.currentDistM ? ` (${(selectedDriver.currentDistM / 1000).toFixed(1)} km)` : ""}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, Math.round((selectedDriver.progress || 0) * 100)))}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Dynamic ETA:</span>
                      <span className="text-emerald-400 font-bold">
                        {selectedDriver.etaMinutes
                          ? `~${selectedDriver.etaMinutes} min remaining`
                          : (selectedDriver.etaText || "On schedule")}
                      </span>
                    </div>
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
          MODAL 2: 💬 NOTIFY CUSTOMER ON WHATSAPP & CONFIRMATION FLOW
      ========================================================================= */}
      {smsModalDelivery && (
        <Modal
          isOpen={!!smsModalDelivery}
          onClose={closeSmsModal}
          title={
            language === "ta"
              ? `வாட்ஸ்அப்பில் வாடிக்கையாளருக்கு அறிவிக்கவும் · ${smsModalDelivery.customerName}`
              : `Notify Customer on WhatsApp · ${smsModalDelivery.customerName}`
          }
          description={
            language === "ta"
              ? `ஆர்டர் #${smsModalDelivery.code} தாமத அறிவிப்பு மற்றும் உறுதிசெய்யப்பட்ட வருகை நேரம்`
              : `Order #${smsModalDelivery.code} Delay Broadcast & Assured ETA`
          }
          size="lg"
        >
          {modalStep === "compose" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Customer Phone (Editable with validation) */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === "ta" ? "வாடிக்கையாளர் வாட்ஸ்அப் எண்:" : "Customer Phone (WhatsApp):"}
                  </label>
                  <input
                    type="text"
                    value={smsPhone}
                    onChange={(e) => {
                      setSmsPhone(e.target.value);
                      if (phoneError) setPhoneError("");
                    }}
                    placeholder="+91 98450 11999"
                    className={`w-full px-3 py-2 rounded-xl bg-white/5 border text-xs text-slate-200 focus:outline-none transition-all ${
                      phoneError ? "border-red-500/80 bg-red-500/10 focus:border-red-400" : "border-glass-border focus:border-emerald-400"
                    }`}
                  />
                  {phoneError && (
                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1 font-semibold animate-in fade-in">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{phoneError}</span>
                    </p>
                  )}
                </div>

                {/* Assured Arrival ETA */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === "ta" ? "உறுதிசெய்யப்பட்ட வருகை நேரம்:" : "Assured Arrival ETA:"}
                  </label>
                  <input
                    type="text"
                    value={smsEta}
                    onChange={(e) => setSmsEta(e.target.value)}
                    placeholder="by 4:45 PM"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Delay Reason (Prefilled from hazard) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {language === "ta" ? "தாமதத்திற்கான காரணம் (விபத்து/தடை மூலம் பெறப்பட்டது):" : "Delay Reason (Prefilled from Hazard):"}
                </label>
                <input
                  type="text"
                  value={smsReason}
                  onChange={(e) => setSmsReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-glass-border text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Language Selector: English / தமிழ் */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  {language === "ta" ? "செய்தி மொழி:" : "Broadcast Language:"}
                </span>
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-glass-border">
                  <button
                    type="button"
                    onClick={() => setSmsLang("en")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      smsLang === "en" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmsLang("ta")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      smsLang === "ta" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    தமிழ் (Tamil)
                  </button>
                </div>
              </div>

              {/* Live WhatsApp Preview Box with WhatsApp Icon and Green Chat Bubble */}
              <div className="p-3.5 rounded-2xl bg-[#0b141a] border border-emerald-500/30 shadow-2xl flex flex-col gap-2 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center">
                      <WhatsAppIcon className="w-3.5 h-3.5 fill-current text-white" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        {language === "ta" ? "வாட்ஸ்அப் செய்தி முன்னோட்டம்" : "WhatsApp message preview"}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {smsPhone || smsModalDelivery.customerPhone || "Recipient"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {smsPreviewText.length} / 320 chars
                  </span>
                </div>

                {/* WhatsApp-Style Green Chat Bubble */}
                <div className="py-2 px-1 flex flex-col items-end">
                  <div className="max-w-[92%] sm:max-w-[85%] bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-sm p-3.5 shadow-md relative border border-emerald-400/20">
                    <p className="text-xs font-sans leading-relaxed whitespace-pre-wrap select-text">
                      {smsPreviewText}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-emerald-200/80 font-mono">
                      <span>{currentTime}</span>
                      <span className="text-[#53bdeb] font-bold tracking-tighter text-xs">✓✓</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Compose Actions: Cancel + Big Green Primary Button "Send on WhatsApp" */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-glass-border">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={closeSmsModal}
                  disabled={isConfirming}
                >
                  {language === "ta" ? "ரத்துசெய்" : "Cancel"}
                </Button>

                <button
                  type="button"
                  onClick={handleSendOnWhatsApp}
                  disabled={isConfirming}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/40 hover:shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <WhatsAppIcon className="w-5 h-5 fill-current text-white shrink-0" />
                  <span>{language === "ta" ? "வாட்ஸ்அப்பில் அனுப்பு" : "Send on WhatsApp"}</span>
                </button>
              </div>
            </div>
          )}

          {modalStep === "confirm" && (
            <div className="flex flex-col gap-4">
              {/* Confirmation Status Banner */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <WhatsAppIcon className="w-5 h-5 fill-current text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-emerald-300">
                    {language === "ta" ? "வாட்ஸ்அப் திறக்கப்பட்டது" : "WhatsApp opened with the message"}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {language === "ta"
                      ? "செய்தியுடன் வாட்ஸ்அப் திறக்கப்பட்டது. வாட்ஸ்அப்பில் அனுப்பு (Send) என்பதைத் தட்டிவிட்டு, பின்னர் இங்கே உறுதிப்படுத்தவும்."
                      : "WhatsApp opened with the message. Tap Send in WhatsApp, then confirm here."}
                  </p>
                </div>
              </div>

              {/* Target & Preview Snippet */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-glass-border flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">{language === "ta" ? "பெறுநர்:" : "Recipient:"}</span>
                  <span className="font-mono font-bold text-emerald-400">{maskPhoneNumber(smsPhone)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">{language === "ta" ? "ஆர்டர் குறியீடு:" : "Delivery Order:"}</span>
                  <span className="font-mono font-bold text-cyan-300">{smsModalDelivery.code}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-glass-border text-xs text-slate-300 italic font-sans leading-relaxed">
                  &ldquo;{smsPreviewText}&rdquo;
                </div>
              </div>

              {/* Confirm State Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-glass-border">
                <button
                  type="button"
                  onClick={() => setModalStep("compose")}
                  disabled={isConfirming}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  {language === "ta" ? "செய்தியைத் திருத்து" : "Edit message"}
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReopenWhatsApp}
                    disabled={isConfirming}
                    className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all"
                  >
                    <WhatsAppIcon className="w-4 h-4 fill-current text-emerald-400 shrink-0" />
                    <span>{language === "ta" ? "மீண்டும் வாட்ஸ்அப்பைத் திறக்கவும்" : "Open WhatsApp again"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmMessageSent}
                    disabled={isConfirming}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    <span>{isConfirming ? (language === "ta" ? "பதிவு செய்யப்படுகிறது..." : "Recording...") : (language === "ta" ? "✓ செய்தி அனுப்பப்பட்டது" : "✓ Message sent")}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {modalStep === "success" && (
            <div className="py-6 flex flex-col items-center justify-center text-center gap-4 animate-in zoom-in-95 duration-300">
              {/* Big Green Check Animation */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center animate-pulse">
                  <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.8)]">
                    <CheckCircle2 className="w-9 h-9 text-slate-950" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#075e54] border-2 border-slate-950 flex items-center justify-center">
                  <WhatsAppIcon className="w-4 h-4 fill-current text-white" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-white">
                  {language === "ta" ? "வாட்ஸ்அப்பில் வாடிக்கையாளருக்கு அறிவிக்கப்பட்டது ✓" : "Customer notified on WhatsApp ✓"}
                </h3>
                <p className="text-xs text-emerald-300 font-medium mt-1">
                  {language === "ta"
                    ? "டெலிவரி தாமத தகவல் வாடிக்கையாளருக்கு வெற்றிகரமாக உறுதிசெய்யப்பட்டது."
                    : "Delivery delay advisory verified and logged to dispatch audit."}
                </p>
              </div>

              {/* Customer, Masked Phone, ETA, Time Information */}
              <div className="w-full max-w-md p-4 rounded-2xl bg-white/[0.03] border border-glass-border grid grid-cols-2 gap-3 text-left">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    {language === "ta" ? "வாடிக்கையாளர்" : "Customer"}
                  </span>
                  <span className="text-xs font-semibold text-slate-100">
                    {successData?.customerName || smsModalDelivery?.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    {language === "ta" ? "தொலைபேசி எண்" : "Masked Number"}
                  </span>
                  <span className="text-xs font-mono font-semibold text-emerald-400">
                    {successData?.maskedPhone || maskPhoneNumber(smsPhone)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    {language === "ta" ? "உறுதிசெய்யப்பட்ட வருகை" : "Assured ETA"}
                  </span>
                  <span className="text-xs font-semibold text-cyan-300">
                    {successData?.etaText || smsEta}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    {language === "ta" ? "நேரம்" : "Notification Time"}
                  </span>
                  <span className="text-xs font-mono text-slate-200">
                    {successData?.time || currentTime}
                  </span>
                </div>
              </div>

              {/* Done Button */}
              <div className="w-full max-w-md pt-2">
                <button
                  type="button"
                  onClick={closeSmsModal}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{language === "ta" ? "முடிந்தது" : "Done"}</span>
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
