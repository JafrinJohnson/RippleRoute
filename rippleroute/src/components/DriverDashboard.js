"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { GlassCard, Button, Badge, Drawer, Skeleton, EmptyState, useToast } from "@/components/ui";
import FleetMap from "@/components/map";
import {
  DEPOT_PEELAMEDU,
  getDeliveries,
  updateDelivery,
  getHazards,
  subscribeHazards,
  addHazard,
  resolveHazard,
  planRoutes,
  runQars,
  getAdvisory,
  updateLiveLocation,
  sendMessage,
  subscribeMessages,
} from "@/services/api";
import { haversineMeters, minDistanceToPolylineMeters } from "@/lib/geo";
import { buildPath, pointAtDistance } from "@/lib/routeAnimator";
import useRouteMover from "@/hooks/useRouteMover";
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
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Square,
  MessageSquare,
  Send,
  Sparkles,
  RefreshCw,
  Globe,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Clock,
  Activity,
  Layers,
  HeartPulse,
  UtensilsCrossed,
  Package,
  X,
  AlertCircle,
} from "lucide-react";

export default function DriverDashboard({ mode = "driver" }) {
  const isEmergency = mode === "emergency";
  const { profile, logout } = useAuth();
  const { t, locale, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const router = useRouter();

  // Color palettes based on mode
  const accentColor = isEmergency ? "#EF4444" : "#00E5FF";
  const accentBorder = isEmergency ? "border-red-500/40" : "border-cyan-500/30";
  const accentGlow = isEmergency ? "shadow-[0_0_25px_rgba(239,68,68,0.35)]" : "shadow-[0_0_25px_rgba(0,229,255,0.25)]";

  // State: Deliveries & selection
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);

  // State: Hazards
  const [hazards, setHazards] = useState([]);
  const seenHazardIdsRef = useRef(new Set());
  const [activeHazardAlert, setActiveHazardAlert] = useState(null);

  // State: Position & Telemetry
  const [startLocationType, setStartLocationType] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("rippleroute_start_location");
        if (saved === "gps" || saved === "depot") return saved;
      } catch (e) {
        console.warn("Failed to read start location from localStorage:", e);
      }
    }
    return "depot";
  });
  const [currentPosition, setCurrentPosition] = useState({
    lat: DEPOT_PEELAMEDU.lat,
    lng: DEPOT_PEELAMEDU.lng,
  });
  const [currentHeading, setCurrentHeading] = useState(45);
  const [tripStatus, setTripStatus] = useState("open"); // "open" | "in_transit" | "delivered" | "delayed" | "issue"
  const [demoSpeedFactor, setDemoSpeedFactor] = useState(10); // 1x, 5x, 10x (default 10x for demo)
  const [followTruck, setFollowTruck] = useState(true); // Follow truck toggle (default on)
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationStepRef = useRef(0);
  const lastLocationUpdateRef = useRef(0);
  const gpsTimeoutRef = useRef(null);
  const hasFittedInitialBoundsRef = useRef(false);

  // State: Routing & QARS
  const [plannedRoutes, setPlannedRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isPlanningRoutes, setIsPlanningRoutes] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [qarsResult, setQarsResult] = useState(null);
  const [mapFitBoundsCoords, setMapFitBoundsCoords] = useState(null);

  // In-flight guards and tracking refs
  const isPlanningRef = useRef(false);
  const isOptimizingRef = useRef(false);
  const lastPlannedDestinationIdRef = useRef(null);

  // Value refs for decoupled effects & async actions
  const currentPositionRef = useRef(currentPosition);
  useEffect(() => {
    currentPositionRef.current = currentPosition;
  }, [currentPosition]);

  const currentHeadingRef = useRef(currentHeading);
  useEffect(() => {
    currentHeadingRef.current = currentHeading;
  }, [currentHeading]);

  const selectedDeliveryRef = useRef(selectedDelivery);
  useEffect(() => {
    selectedDeliveryRef.current = selectedDelivery;
  }, [selectedDelivery]);

  const hazardsRef = useRef(hazards);
  useEffect(() => {
    hazardsRef.current = hazards;
  }, [hazards]);

  const plannedRoutesRef = useRef(plannedRoutes);
  useEffect(() => {
    plannedRoutesRef.current = plannedRoutes;
  }, [plannedRoutes]);

  const qarsResultRef = useRef(qarsResult);
  useEffect(() => {
    qarsResultRef.current = qarsResult;
  }, [qarsResult]);

  const selectedRouteIndexRef = useRef(selectedRouteIndex);
  useEffect(() => {
    selectedRouteIndexRef.current = selectedRouteIndex;
  }, [selectedRouteIndex]);

  const moverRef = useRef(null);
  const demoSpeedFactorRef = useRef(demoSpeedFactor);
  useEffect(() => {
    demoSpeedFactorRef.current = demoSpeedFactor;
  }, [demoSpeedFactor]);

  // Toggle Start Location: Depot vs Browser GPS
  const handleToggleStartLocation = useCallback((type) => {
    if (gpsTimeoutRef.current) {
      clearTimeout(gpsTimeoutRef.current);
      gpsTimeoutRef.current = null;
    }

    try {
      localStorage.setItem("rippleroute_start_location", type);
    } catch (e) {
      console.warn("Failed to save start location to localStorage:", e);
    }

    // When the start mode changes: clear old routes, and require "Plan route" again
    setPlannedRoutes([]);
    setQarsResult(null);
    setSelectedRouteIndex(0);
    setMapFitBoundsCoords(null);
    lastPlannedDestinationIdRef.current = null;

    if (type === "depot") {
      setStartLocationType("depot");
      const depotPos = { lat: DEPOT_PEELAMEDU.lat, lng: DEPOT_PEELAMEDU.lng };
      // Move truck marker there immediately
      setCurrentPosition(depotPos);
      toast.info(
        locale === "ta"
          ? "தொடக்க இடம்: கோவைஸ்விப்ட் டிப்போ, பீளமேடு"
          : "Start point: KovaiSwift Depot, Peelamedu"
      );
      if (deliveries.length > 0) {
        setMapFitBoundsCoords([
          [depotPos.lat, depotPos.lng],
          [DEPOT_PEELAMEDU.lat, DEPOT_PEELAMEDU.lng],
          ...deliveries.map((d) => [d.lat, d.lng]),
        ]);
      }
    } else if (type === "gps") {
      setStartLocationType("gps");
      if (typeof window === "undefined" || !navigator?.geolocation) {
        toast.warning(
          locale === "ta"
            ? "உலாவி GPS ஆதரிக்கப்படவில்லை — டிப்போவிற்கு மாற்றப்பட்டது"
            : "Browser GPS not supported — switched back to Depot"
        );
        setStartLocationType("depot");
        try { localStorage.setItem("rippleroute_start_location", "depot"); } catch (e) {}
        setCurrentPosition({ lat: DEPOT_PEELAMEDU.lat, lng: DEPOT_PEELAMEDU.lng });
        return;
      }

      toast.info(locale === "ta" ? "GPS கண்டறியப்படுகிறது..." : "Acquiring browser GPS...");

      let resolved = false;

      // 5 s timeout guard: if GPS not available within 5 s, show toast and switch back to Depot
      gpsTimeoutRef.current = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          toast.warning(
            locale === "ta"
              ? "GPS நேரம் முடிந்தது (5 விநாடிகள்) — டிப்போவிற்கு மாற்றப்பட்டது"
              : "GPS not available within 5 s — switched back to Depot"
          );
          setStartLocationType("depot");
          try { localStorage.setItem("rippleroute_start_location", "depot"); } catch (e) {}
          setCurrentPosition({ lat: DEPOT_PEELAMEDU.lat, lng: DEPOT_PEELAMEDU.lng });
          if (deliveries.length > 0) {
            setMapFitBoundsCoords([
              [DEPOT_PEELAMEDU.lat, DEPOT_PEELAMEDU.lng],
              ...deliveries.map((d) => [d.lat, d.lng]),
            ]);
          }
        }
      }, 5000);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (resolved) return;
          resolved = true;
          if (gpsTimeoutRef.current) {
            clearTimeout(gpsTimeoutRef.current);
            gpsTimeoutRef.current = null;
          }
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const newPos = { lat, lng };
          // Move truck marker there immediately
          setCurrentPosition(newPos);
          if (typeof pos.coords.heading === "number" && !isNaN(pos.coords.heading)) {
            setCurrentHeading(pos.coords.heading);
          }
          if (deliveries.length > 0) {
            setMapFitBoundsCoords([
              [newPos.lat, newPos.lng],
              [DEPOT_PEELAMEDU.lat, DEPOT_PEELAMEDU.lng],
              ...deliveries.map((d) => [d.lat, d.lng]),
            ]);
          }
          toast.success(
            locale === "ta"
              ? "உங்கள் ஜிபிஎஸ் இருப்பிடம் அமைக்கப்பட்டது"
              : `Acquired GPS location: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`
          );
        },
        (err) => {
          if (resolved) return;
          resolved = true;
          if (gpsTimeoutRef.current) {
            clearTimeout(gpsTimeoutRef.current);
            gpsTimeoutRef.current = null;
          }
          console.warn("GPS error:", err?.message || err);
          toast.warning(
            locale === "ta"
              ? "GPS கிடைக்கவில்லை — டிப்போவிற்கு மாற்றப்பட்டது"
              : "Could not access GPS — switched back to Depot"
          );
          setStartLocationType("depot");
          try { localStorage.setItem("rippleroute_start_location", "depot"); } catch (e) {}
          setCurrentPosition({ lat: DEPOT_PEELAMEDU.lat, lng: DEPOT_PEELAMEDU.lng });
          if (deliveries.length > 0) {
            setMapFitBoundsCoords([
              [DEPOT_PEELAMEDU.lat, DEPOT_PEELAMEDU.lng],
              ...deliveries.map((d) => [d.lat, d.lng]),
            ]);
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [deliveries, locale, toast]);

  // If saved start mode is GPS, attempt GPS acquisition with 5s timeout on mount
  useEffect(() => {
    if (startLocationType === "gps") {
      handleToggleStartLocation("gps");
    }
    return () => {
      if (gpsTimeoutRef.current) {
        clearTimeout(gpsTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map camera on page load: fit bounds to the truck + depot + driver's deliveries (padding 60px)
  useEffect(() => {
    if (!loadingDeliveries && deliveries.length > 0 && !hasFittedInitialBoundsRef.current) {
      hasFittedInitialBoundsRef.current = true;
      const initialPoints = [
        [currentPosition.lat, currentPosition.lng],
        [DEPOT_PEELAMEDU.lat, DEPOT_PEELAMEDU.lng],
        ...deliveries.map((d) => [d.lat, d.lng]),
      ];
      setMapFitBoundsCoords(initialPoints);
    }
  }, [loadingDeliveries, deliveries, currentPosition]);


  // State: Safety & Advisory
  const [advisoryLines, setAdvisoryLines] = useState({ en: [], ta: [] });
  const [isSpeaking, setIsSpeaking] = useState(false);

  // State: Dispatcher Chat Drawer
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // Live digital clock
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString("en-GB", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Audio beep for hazard alert
  const playHazardBeep = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(620, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch (e) {
      console.warn("Web Audio API beep error:", e);
    }
  }, []);

  // Vibration alert
  const triggerHaptic = useCallback((pattern = [300, 150, 300]) => {
    if (typeof window === "undefined") return;
    try {
      if (navigator?.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
  }, []);

  // Load initial deliveries (Privacy by role: only assignedTo == me, or open deliveries they can pick)
  const refreshDeliveries = useCallback(async () => {
    try {
      setLoadingDeliveries(true);
      const data = await getDeliveries();
      const myUid = profile?.uid || profile?.driverId;
      const myDeliveries = data.filter((d) => {
        return d.assignedTo === myUid || !d.assignedTo || d.status === "open";
      });
      setDeliveries(myDeliveries);
      if (!selectedDelivery && myDeliveries.length > 0) {
        // In emergency mode, prefer first medical or food delivery
        if (isEmergency) {
          const priorityItem = myDeliveries.find((d) => d.priority === "medical" || d.priority === "food") || myDeliveries[0];
          setSelectedDelivery(priorityItem);
        } else {
          setSelectedDelivery(myDeliveries[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load deliveries:", err);
    } finally {
      setLoadingDeliveries(false);
    }
  }, [isEmergency, selectedDelivery, profile]);


  useEffect(() => {
    refreshDeliveries();
  }, [refreshDeliveries]);

  // Subscribe to real-time hazards & monitor proximity
  useEffect(() => {
    const unsubscribe = subscribeHazards((updatedHazards) => {
      setHazards((prevHazards) => {
        // Check if a previously active hazard was cleared
        prevHazards.forEach((prevH) => {
          if (prevH.active) {
            const currentH = updatedHazards.find((h) => h.id === prevH.id);
            if (currentH && !currentH.active) {
              toast.success(locale === "ta" ? "பாதை பாதுகாப்பானது: தடை அகற்றப்பட்டது" : "Route cleared: Active hazard resolved");
              setActiveHazardAlert((alert) => (alert && alert.id === prevH.id ? null : alert));
            }
          }
        });

        // Check for new hazards near driver or touching route
        const activeList = updatedHazards.filter((h) => h.active !== false);
        const currPos = currentPositionRef.current;
        const currentRoute = qarsResultRef.current?.best?.coords || plannedRoutesRef.current[selectedRouteIndexRef.current]?.coords || [];

        activeList.forEach((h) => {
          if (!seenHazardIdsRef.current.has(h.id)) {
            const hPt = { lat: h.lat, lng: h.lng };
            const distToDriver = currPos ? haversineMeters(currPos, hPt) : Infinity;
            const distToRoute = currentRoute.length > 0 ? minDistanceToPolylineMeters(hPt, currentRoute) : Infinity;

            const isNearDriver = distToDriver <= 1000;
            const isTouchingRoute = distToRoute <= ((h.radiusM || 300) + 150);

            if (isNearDriver || isTouchingRoute) {
              seenHazardIdsRef.current.add(h.id);
              const effectiveDist = Math.min(distToDriver, distToRoute);
              setActiveHazardAlert({
                ...h,
                distMeters: Math.round(effectiveDist),
              });
              playHazardBeep();
              triggerHaptic([300, 150, 300]);
            }
          }
        });

        return updatedHazards;
      });
    });

    return () => unsubscribe();
  }, [locale, playHazardBeep, triggerHaptic, toast]);

  // Subscribe to Dispatcher Messages
  useEffect(() => {
    const uid = profile?.uid || profile?.driverId || "driver-me";
    const unsubscribe = subscribeMessages(uid, (msgs) => {
      setMessages(msgs || []);
    });
    return () => unsubscribe();
  }, [profile]);

  // Native Geolocation Watcher
  // Do not let GPS updates move the truck while "Depot" is selected or while a simulated trip is running
  useEffect(() => {
    if (typeof window === "undefined" || !navigator?.geolocation) return;
    if (startLocationType !== "gps") return;
    if (tripStatus === "in_transit" || moverRef.current?.running || isSimulating) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (startLocationType === "gps" && tripStatus !== "in_transit" && !moverRef.current?.running && !isSimulating) {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentPosition(newPos);
          if (typeof pos.coords.heading === "number" && !isNaN(pos.coords.heading)) {
            setCurrentHeading(pos.coords.heading);
          }
        }
      },
      (err) => {
        // Quietly ignore watch errors
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [startLocationType, tripStatus, isSimulating]);

  // Route Planning Logic (Runs ONLY on explicit user trigger, destination change, or alternative route)
  const handlePlanRoute = useCallback(async (deliveryOverride = null, fromPosOverride = null) => {
    const targetDelivery = deliveryOverride || selectedDeliveryRef.current;
    if (!targetDelivery) return;
    if (isPlanningRef.current) return;

    isPlanningRef.current = true;
    setIsPlanningRoutes(true);
    setQarsResult(null);

    const fromPt = fromPosOverride || currentPositionRef.current || DEPOT_PEELAMEDU;

    try {
      const res = await planRoutes(fromPt, {
        lat: targetDelivery.lat,
        lng: targetDelivery.lng,
      });
      if (res && Array.isArray(res.routes) && res.routes.length > 0) {
        setPlannedRoutes(res.routes);
        setSelectedRouteIndex(0);
        // After Plan route: fitBounds to all candidate routes (padding 60 px)
        const allCandidateCoords = res.routes.flatMap((r) => r.coords || []);
        if (allCandidateCoords.length > 1) {
          setMapFitBoundsCoords(allCandidateCoords);
        }
        toast.info(
          locale === "ta"
            ? `${res.routes.length} சாத்தியமான வழிகள் கண்டறியப்பட்டன`
            : `${res.routes.length} candidate road routes generated`
        );
      } else {
        setPlannedRoutes([]);
        toast.error(
          locale === "ta"
            ? "சாலை வழிகளை ஏற்ற முடியவில்லை — இணையத்தை சரிபார்த்து மீண்டும் முயற்சிக்கவும்"
            : "Could not load road routes — check internet and press Retry"
        );
      }
    } catch (err) {
      console.error("Plan route error:", err?.message || err);
      setPlannedRoutes([]);
      toast.error(
        locale === "ta"
          ? "சாலை வழிகளை ஏற்ற முடியவில்லை — இணையத்தை சரிபார்த்து மீண்டும் முயற்சிக்கவும்"
          : "Could not load road routes — check internet and press Retry"
      );
    } finally {
      isPlanningRef.current = false;
      setIsPlanningRoutes(false);
    }
  }, [locale, toast]);

  // Automatically plan route when delivery selection changes (depend ONLY on destination id, at most once per destination)
  const selectedDeliveryId = selectedDelivery?.id;
  useEffect(() => {
    if (!selectedDeliveryId) return;
    if (lastPlannedDestinationIdRef.current === selectedDeliveryId) return;
    lastPlannedDestinationIdRef.current = selectedDeliveryId;
    handlePlanRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeliveryId]);

  // QARS Quantum-Inspired Route Optimization
  const handleRunQars = useCallback(async () => {
    const targetDelivery = selectedDeliveryRef.current;
    const currentRoutes = plannedRoutesRef.current;
    if (!currentRoutes.length || !targetDelivery) return;
    if (isOptimizingRef.current) return;

    isOptimizingRef.current = true;
    try {
      setIsOptimizing(true);
      const currPos = currentPositionRef.current || DEPOT_PEELAMEDU;
      const res = await runQars({
        from: currPos,
        to: { lat: targetDelivery.lat, lng: targetDelivery.lng },
        routes: currentRoutes,
        hazards: hazardsRef.current,
        priority: targetDelivery.priority,
      });

      setQarsResult(res);

      // Find index of best route and set route bounds to fit map view
      if (res.best) {
        const bestIdx = currentRoutes.findIndex((r) => r.id === res.best.id);
        if (bestIdx !== -1) {
          setSelectedRouteIndex(bestIdx);
        }
        // After Optimize with QARS: fitBounds to the best route (padding 60 px)
        if (Array.isArray(res.best.coords) && res.best.coords.length > 1) {
          setMapFitBoundsCoords(res.best.coords);
        }
      }

      // Fetch AI advisory for best route
      const bestHits = res.best?.hits || [];
      const adv = await getAdvisory({
        hazardsOnRoute: bestHits,
        rain: hazardsRef.current.some((h) => h.active && h.type === "rain"),
        lang: locale,
      });
      setAdvisoryLines(adv);

      toast.success(
        locale === "ta"
          ? `QARS உகந்த வழி தயார்! ${res.timeSavedMin} நிமிடங்கள் சேமிப்பு.`
          : `QARS optimal swarm selected! ${res.timeSavedMin} min delay saved.`
      );
    } catch (err) {
      console.error("QARS error:", err);
      toast.error(locale === "ta" ? "QARS இயக்கத்தில் பிழை" : "QARS optimization failed");
    } finally {
      isOptimizingRef.current = false;
      setIsOptimizing(false);
    }
  }, [locale, toast]);

  // Speech Synthesis for Safety Advisory
  const toggleSpeech = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.warning(locale === "ta" ? "குரல் வசதி ஆதரிக்கப்படவில்லை" : "Speech synthesis not supported in browser");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const lines = locale === "ta" ? advisoryLines.ta : advisoryLines.en;
    if (!lines || lines.length === 0) return;

    window.speechSynthesis.cancel();
    const fullText = lines.join(". ");
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = locale === "ta" ? "ta-IN" : "en-IN";
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, advisoryLines, locale, toast]);

  // Active selected or QARS best road route
  const activeRoute = qarsResult?.best || plannedRoutes[selectedRouteIndex];
  const moverCoords = useMemo(() => {
    return activeRoute?.coords || [];
  }, [activeRoute]);

  // Delivered callback when mover reaches the destination
  const handleTripFinished = useCallback(async () => {
    setTripStatus("delivered");
    if (selectedDelivery) {
      await updateDelivery(selectedDelivery.id, { status: "delivered" });
      refreshDeliveries();
      toast.success(
        locale === "ta"
          ? `விநியோகம் முடிந்தது! ${selectedDelivery.code} இலக்கை அடைந்தது.`
          : `Package ${selectedDelivery.code} delivered! Destination reached.`
      );
    }
  }, [selectedDelivery, refreshDeliveries, locale, toast]);

  // Shared road movement engine hook (Advances frame-by-frame along OSRM road geometry)
  const mover = useRouteMover(moverCoords, {
    speedKmh: 40,
    demoSpeedFactor,
    loop: false,
    autoStart: false,
    onEnd: handleTripFinished,
  });

  moverRef.current = mover;

  // Keep truck position and road heading synced with mover
  useEffect(() => {
    if (mover.position && (mover.running || tripStatus === "in_transit")) {
      setCurrentPosition({ lat: mover.position.lat, lng: mover.position.lng });
      if (typeof mover.position.heading === "number") {
        setCurrentHeading(mover.position.heading);
      }
    }
  }, [mover.position, mover.running, tripStatus]);

  // Trip Status actions
  const handleStartTrip = async () => {
    const targetDelivery = selectedDeliveryRef.current;
    if (!targetDelivery) return;
    try {
      setTripStatus("in_transit");
      await updateDelivery(targetDelivery.id, { status: "in_transit" });
      refreshDeliveries();
      mover.start();
      toast.info(locale === "ta" ? "பயணம் தொடங்கியது" : `Trip started for ${targetDelivery.code}`);
    } catch (err) {
      console.error("Start trip error:", err?.message || err);
      toast.error(locale === "ta" ? "பயணத்தை தொடங்குவதில் பிழை" : "Failed to start trip");
    }
  };

  const handleTogglePause = () => {
    if (mover.running) {
      mover.pause();
      toast.info(locale === "ta" ? "பயணம் இடைநிறுத்தப்பட்டது" : "Trip paused");
    } else {
      mover.start();
      toast.info(locale === "ta" ? "பயணம் தொடர்கிறது" : "Trip resumed");
    }
  };

  const handleResetTrip = () => {
    mover.reset();
    setTripStatus("open");
    toast.info(locale === "ta" ? "பயணம் மீட்டமைக்கப்பட்டது" : "Trip reset to start");
  };

  const handleMarkDelivered = async () => {
    const targetDelivery = selectedDeliveryRef.current;
    if (!targetDelivery) return;
    try {
      mover.pause();
      setTripStatus("delivered");
      await updateDelivery(targetDelivery.id, { status: "delivered" });
      refreshDeliveries();
      toast.success(locale === "ta" ? "வெற்றிகரமாக விநியோகிக்கப்பட்டது!" : `Package ${targetDelivery.code} marked as delivered!`);
    } catch (err) {
      console.error("Mark delivered error:", err?.message || err);
      toast.error(locale === "ta" ? "விநியோகம் பதிவு செய்வதில் பிழை" : "Failed to mark as delivered");
    }
  };

  // Reroute from CURRENT position when alternative route is chosen on hazard alert
  const handleRerouteFromCurrentPosition = useCallback(async () => {
    const targetDelivery = selectedDeliveryRef.current;
    if (!targetDelivery) return;
    if (isPlanningRef.current || isOptimizingRef.current) return;

    isPlanningRef.current = true;
    isOptimizingRef.current = true;

    try {
      setActiveHazardAlert(null);
      setIsPlanningRoutes(true);
      toast.info(
        locale === "ta"
          ? "தற்போதைய இடத்திலிருந்து புதிய மாற்றுப்பாதை கணக்கிடப்படுகிறது..."
          : "Calculating alternative route from current position..."
      );
      const currPos = currentPositionRef.current || DEPOT_PEELAMEDU;
      const res = await planRoutes(currPos, {
        lat: targetDelivery.lat,
        lng: targetDelivery.lng,
      });
      if (res && Array.isArray(res.routes) && res.routes.length > 0) {
        setPlannedRoutes(res.routes);
        setIsOptimizing(true);
        const qRes = await runQars({
          from: currPos,
          to: { lat: targetDelivery.lat, lng: targetDelivery.lng },
          routes: res.routes,
          hazards: hazardsRef.current,
          priority: targetDelivery.priority,
        });
        setQarsResult(qRes);
        if (qRes?.best) {
          const bIdx = res.routes.findIndex((r) => r.id === qRes.best.id);
          setSelectedRouteIndex(bIdx !== -1 ? bIdx : 0);
          if (Array.isArray(qRes.best.coords) && qRes.best.coords.length > 1) {
            setMapFitBoundsCoords(qRes.best.coords);
          }
        }
        if (tripStatus === "in_transit") {
          moverRef.current?.start();
        }
        toast.success(
          locale === "ta"
            ? "மாற்று வழித்தடம் அமைக்கப்பட்டது!"
            : "Alternative bypass route activated from current position!"
        );
      } else {
        toast.error(
          locale === "ta"
            ? "மாற்றுப்பாதை கிடைக்கவில்லை"
            : "Could not compute alternative route"
        );
      }
    } catch (err) {
      console.error("Reroute error:", err);
      toast.error(locale === "ta" ? "மாற்றுப்பாதை அமைப்பதில் பிழை" : "Failed to reroute");
    } finally {
      isPlanningRef.current = false;
      isOptimizingRef.current = false;
      setIsPlanningRoutes(false);
      setIsOptimizing(false);
    }
  }, [tripStatus, locale, toast]);

  // Report Field Hazard
  const handleReportHazard = async (type) => {
    try {
      const currPos = currentPositionRef.current || DEPOT_PEELAMEDU;
      const res = await addHazard({
        type,
        lat: currPos.lat,
        lng: currPos.lng,
        radiusM: 300,
        severity: "high",
        note: `Driver ${profile?.name || "Karthik"} reported ${type} at field location`,
      });

      await sendMessage(
        profile?.uid || "driver-me",
        "admin",
        `FIELD REPORT: ${type.toUpperCase()} reported near [${currPos.lat.toFixed(4)}, ${currPos.lng.toFixed(4)}]`
      );

      toast.success(
        locale === "ta"
          ? `${type} அறிக்கை கட்டுப்பாட்டு அறைக்கு அனுப்பப்பட்டது!`
          : `${type.toUpperCase()} reported to KovaiSwift Control Room!`
      );
    } catch (err) {
      console.error("Report hazard error:", err?.message || err);
      toast.error(locale === "ta" ? "அறிக்கை அனுப்புவதில் பிழை" : "Failed to report incident");
    }
  };

  // Live Location Broadcaster (every 3s)
  useEffect(() => {
    const timer = setInterval(() => {
      if (tripStatus === "in_transit" || tripStatus === "open") {
        const currPos = currentPositionRef.current || DEPOT_PEELAMEDU;
        const targetDel = selectedDeliveryRef.current;
        const m = moverRef.current;
        const speed = demoSpeedFactorRef.current || 10;
        updateLiveLocation(profile, {
          lat: currPos.lat,
          lng: currPos.lng,
          heading: currentHeadingRef.current || 0,
          status: tripStatus,
          destination: targetDel ? `${targetDel.code} - ${targetDel.customerName}` : null,
          progress: m?.progress || 0,
          etaMinutes: Math.max(1, Math.round((m?.remainingM || 0) / ((40 * 1000 / 60) * speed))),
          remainingM: m?.remainingM || 0,
        });
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [tripStatus, profile]);

  // Send message to Admin
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    try {
      await sendMessage(profile?.uid || "driver-me", "admin", text.trim());
      setChatInput("");
      toast.success(locale === "ta" ? "செய்தி அனுப்பப்பட்டது" : "Message dispatched to dispatcher");
    } catch (err) {
      console.error("Send message error:", err?.message || err);
      toast.error(locale === "ta" ? "செய்தி அனுப்புவதில் பிழை" : "Failed to send message");
    }
  };

  // Deliveries sorting: In emergency mode, medical & food come first
  const sortedDeliveries = useMemo(() => {
    if (!isEmergency) return deliveries;
    return [...deliveries].sort((a, b) => {
      const aRank = a.priority === "medical" ? 0 : a.priority === "food" ? 1 : 2;
      const bRank = b.priority === "medical" ? 0 : b.priority === "food" ? 1 : 2;
      return aRank - bRank;
    });
  }, [deliveries, isEmergency]);

  // Map Routes Configuration (Real road coordinates + completed/remaining split)
  const mapRoutes = useMemo(() => {
    if (!plannedRoutes.length) return [];

    const ROUTE_COLORS = ["#00E5FF", "#A855F7", "#F59E0B"]; // Cyan, Violet, Amber

    // If QARS has optimized, show the best route glowing, and fade others
    if (qarsResult?.best) {
      return plannedRoutes.map((r, idx) => {
        const isBest = r.id === qarsResult.best.id;
        return {
          id: r.id,
          coords: r.coords,
          completedCoords: isBest ? mover.completedCoords : undefined,
          remainingCoords: isBest ? mover.remainingCoords : undefined,
          color: isBest ? (isEmergency ? "#EF4444" : "#00E5FF") : ROUTE_COLORS[idx % ROUTE_COLORS.length],
          isHighlighted: isBest,
          isDashed: true,
          snappedStart: r.snappedStart,
          snappedEnd: r.snappedEnd,
          fromCoords: r.fromCoords || [currentPosition.lat, currentPosition.lng],
          toCoords: r.toCoords || (selectedDelivery ? [selectedDelivery.lat, selectedDelivery.lng] : null),
          label: isBest
            ? `${isEmergency ? "🚨 Emergency Bypass" : "⚡ QARS Optimal"} • ${Math.round(r.distanceM / 1000)} km`
            : `${r.label || `Route ${String.fromCharCode(65 + idx)}`} • ${Math.round(r.distanceM / 1000)} km`,
        };
      });
    }

    // Default candidate routes: Route A (cyan), Route B (violet), Route C (amber), all dashed
    return plannedRoutes.map((r, idx) => {
      const isSelected = idx === selectedRouteIndex;
      return {
        id: r.id,
        coords: r.coords,
        completedCoords: isSelected ? mover.completedCoords : undefined,
        remainingCoords: isSelected ? mover.remainingCoords : undefined,
        color: r.color || ROUTE_COLORS[idx % ROUTE_COLORS.length],
        isHighlighted: isSelected,
        isDashed: true,
        snappedStart: r.snappedStart,
        snappedEnd: r.snappedEnd,
        fromCoords: r.fromCoords || [currentPosition.lat, currentPosition.lng],
        toCoords: r.toCoords || (selectedDelivery ? [selectedDelivery.lat, selectedDelivery.lng] : null),
        label: `${r.label || `Route ${String.fromCharCode(65 + idx)}`} • ${Math.round(r.distanceM / 1000)} km • ${Math.round(r.durationS / 60)} min`,
      };
    });
  }, [plannedRoutes, qarsResult, selectedRouteIndex, isEmergency, selectedDelivery, currentPosition, mover.completedCoords, mover.remainingCoords]);

  // Vehicles list for FleetMap (Privacy by role: ONLY the logged-in user's own vehicle)
  const mapVehicles = useMemo(() => {
    return [
      {
        uid: profile?.uid || profile?.driverId || "my-truck",
        name: profile?.name || "My Vehicle",
        vehicleNumber: profile?.vehicleNumber || "TN-37-XX",
        lat: currentPosition.lat,
        lng: currentPosition.lng,
        heading: currentHeading,
        status: tripStatus === "issue" ? "issue" : tripStatus === "in_transit" ? "on_time" : "idle",
        role: isEmergency ? "emergency" : "driver",
        isEmergency,
        priority: selectedDelivery?.priority || (isEmergency ? "medical" : "normal"),
        cargoType: selectedDelivery?.cargo || (isEmergency ? "Liquid Medical Oxygen" : "Freight"),
        routeCoords: activeRoute?.coords,
        currentDistM: mover.distanceCoveredM,
        progress: mover.progress,
        etaMinutes: Math.max(1, Math.round(mover.remainingM / ((40 * 1000 / 60) * demoSpeedFactor))),
      },
    ];
  }, [profile, currentPosition, currentHeading, tripStatus, isEmergency, selectedDelivery, activeRoute, mover.distanceCoveredM, mover.progress, mover.remainingM, demoSpeedFactor]);


  // Sparkline coordinates generator
  const sparklinePoints = useMemo(() => {
    if (!qarsResult?.convergence || qarsResult.convergence.length === 0) return null;
    const vals = qarsResult.convergence;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const w = 150;
    const h = 36;

    const points = vals
      .map((v, i) => {
        const x = (i / (vals.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    const area = `0,${h} ${points} ${w},${h}`;
    return { points, area };
  }, [qarsResult]);

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="h-16 px-4 sm:px-6 border-b border-glass-border bg-slate-950/80 backdrop-blur-xl flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${accentBorder} bg-white/5`}>
              <Truck className={`w-5 h-5 ${isEmergency ? "text-red-400" : "text-cyan-400"}`} />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold tracking-tight text-white flex items-center gap-1.5">
                RippleRoute
                {isEmergency && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 uppercase font-mono tracking-wider font-extrabold animate-pulse">
                    PRIORITY ROUTING
                  </span>
                )}
              </span>
              <span className="text-[11px] text-slate-400 block -mt-1 font-mono">
                {isEmergency ? "Emergency Rapid Transit" : "Driver Cockpit"}
              </span>
            </div>
          </Link>
        </div>

        {/* Center telemetry: Driver & Vehicle Info */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-glass-border">
            <span className="text-xs text-slate-300 font-medium">{profile?.name || "Karthik Raja"}</span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs font-mono text-cyan-300">{profile?.vehicleNumber || "TN-37-BY-4512"}</span>
            <Badge variant={tripStatus === "in_transit" ? "success" : tripStatus === "issue" ? "danger" : "default"}>
              {tripStatus === "in_transit" ? "In Transit" : tripStatus === "delivered" ? "Delivered" : "Standby"}
            </Badge>
          </div>

          {/* Live digital clock */}
          <div className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 font-mono text-xs text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTimeStr || "--:--:--"}</span>
          </div>
        </div>

        {/* Right Tools: Language, Theme, Chat Drawer trigger, Logout */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(locale === "en" ? "ta" : "en")}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 border border-glass-border transition-colors flex items-center gap-1"
            title="Toggle English / தமிழ்"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{locale === "en" ? "தமிழ்" : "EN"}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-glass-border transition-colors text-slate-300"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>

          {/* Dispatcher Chat Drawer Trigger */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="relative p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-glass-border transition-colors text-cyan-400"
            title="Open Dispatcher Comms"
          >
            <MessageSquare className="w-4 h-4" />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
            )}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-glass-border transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout: Desktop = ~68% Map left + Side Panel right; Mobile = Map top + Bottom Sheet */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Left: Map Section (~68% on desktop) */}
        <div className="w-full lg:w-[68%] h-[42vh] lg:h-[calc(100vh-64px)] relative flex-shrink-0">
          <FleetMap
            center={[currentPosition.lat, currentPosition.lng]}
            zoom={13}
            vehicles={mapVehicles}
            routes={mapRoutes}
            hazards={hazards}
            deliveries={deliveries}
            selectedUid={profile?.uid || profile?.driverId || "my-truck"}
            height="100%"
            showDepot={true}
            depotCoords={[DEPOT_PEELAMEDU.lat, DEPOT_PEELAMEDU.lng]}
            fitBoundsCoords={mapFitBoundsCoords}
            followCoords={[currentPosition.lat, currentPosition.lng]}
            followEnabled={followTruck && (tripStatus === "in_transit" || mover.running)}
          />

          {/* Telemetry & Follow Truck Floating Bar on Map */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFollowTruck(!followTruck)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border shadow-lg flex items-center gap-1.5 transition-all ${
                followTruck
                  ? isEmergency
                    ? "bg-red-500/20 border-red-500/60 text-red-300"
                    : "bg-cyan-500/20 border-cyan-500/60 text-cyan-300"
                  : "bg-slate-900/80 border-glass-border text-slate-400 hover:text-white"
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{locale === "ta" ? "வாகனம் தொடர்" : "Follow truck"} {followTruck ? "ON" : "OFF"}</span>
            </button>

            <div className="px-3 py-1.5 rounded-xl text-xs bg-slate-900/80 backdrop-blur-md border border-glass-border text-slate-300 font-mono hidden sm:flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>{Math.round(currentHeading)}°</span>
              <span className="text-slate-600">|</span>
              <span>{currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}</span>
            </div>
          </div>

          {/* Retry chip on the map when road data is unavailable */}
          {plannedRoutes.length === 0 && !isPlanningRoutes && selectedDelivery && (
            <div className="absolute top-16 left-4 z-10 flex items-center gap-2 p-2 rounded-xl bg-slate-950/90 border border-amber-500/40 shadow-xl backdrop-blur-md">
              <span className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Road data unavailable</span>
              </span>
              <button
                onClick={handlePlanRoute}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>


        {/* Right: Glass Side Panel (~32% on desktop, bottom sheet on mobile) */}
        <div className="w-full lg:w-[32%] flex-1 lg:h-[calc(100vh-64px)] overflow-y-auto bg-slate-950/95 lg:bg-slate-950/85 backdrop-blur-2xl border-t lg:border-t-0 lg:border-l border-glass-border p-4 sm:p-5 flex flex-col gap-5">
          {/* Mobile Drag Indicator */}
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto lg:hidden -mt-1 mb-1" />

          {/* SECTION 1: Driver Cockpit Header */}
          <div className={`p-4 sm:p-5 rounded-2xl bg-white/[0.03] border ${accentBorder} relative min-h-fit h-auto flex flex-col gap-3.5`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block break-words leading-tight">
                  {isEmergency
                    ? (locale === "ta" ? "முன்னுரிமை வழித்தடங்கள் இயக்கப்பட்டுள்ளன" : "PRIORITY CORRIDORS ENABLED")
                    : (locale === "ta" ? "செயலில் உள்ள வாகனப் பிரிவு" : "ACTIVE VEHICLE UNIT")}
                </span>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mt-1">
                  {profile?.vehicleNumber || "TN-37-BY-4512"}
                  {isEmergency && (
                    <span className="text-base" title="Emergency Priority Cargo">
                      🏥
                    </span>
                  )}
                </h2>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-[11px] text-slate-400 block font-mono">
                  {locale === "ta" ? "நிலை" : "Status"}
                </span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 justify-end mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  {tripStatus.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Start Point Toggle: Segmented Control */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs">
              <span className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>{locale === "ta" ? "தொடக்க இடம்:" : "Start from:"}</span>
              </span>
              <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-white/10">
                <button
                  type="button"
                  onClick={() => handleToggleStartLocation("depot")}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                    startLocationType === "depot"
                      ? isEmergency
                        ? "bg-red-500 text-white shadow-md shadow-red-500/30 border border-red-400"
                        : "bg-cyan-500 text-white shadow-md shadow-cyan-500/30 border border-cyan-400"
                      : "bg-transparent text-slate-300 hover:text-white border border-white/20 hover:border-white/40"
                  }`}
                >
                  <span className="text-sm leading-none">🏭</span>
                  <span>{locale === "ta" ? "டிப்போ" : "Depot"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleStartLocation("gps")}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                    startLocationType === "gps"
                      ? isEmergency
                        ? "bg-red-500 text-white shadow-md shadow-red-500/30 border border-red-400"
                        : "bg-cyan-500 text-white shadow-md shadow-cyan-500/30 border border-cyan-400"
                      : "bg-transparent text-slate-300 hover:text-white border border-white/20 hover:border-white/40"
                  }`}
                >
                  <span className="text-sm leading-none">📍</span>
                  <span>{locale === "ta" ? "என் ஜிபிஎஸ்" : "My GPS"}</span>
                </button>
              </div>
            </div>

            {/* Quick Trip Controls */}
            {tripStatus === "in_transit" ? (
              <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                    <span>In Transit</span>
                  </span>
                  <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
                    {[1, 5, 10].map((factor) => (
                      <button
                        key={factor}
                        onClick={() => {
                          setDemoSpeedFactor(factor);
                          mover.setSpeedFactor(factor);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                          demoSpeedFactor === factor
                            ? isEmergency
                              ? "bg-red-500 text-white"
                              : "bg-cyan-500 text-slate-950"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {factor}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                    <span>{Math.round(mover.progress * 100)}%</span>
                    <span className="text-cyan-300">{(mover.remainingM / 1000).toFixed(1)} km left</span>
                    <span className="text-emerald-400">ETA ~{Math.max(1, Math.round(mover.remainingM / ((40 * 1000 / 60) * demoSpeedFactor)))}m</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, Math.round(mover.progress * 100)))}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    onClick={handleTogglePause}
                    className="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    {mover.running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                    <span>{mover.running ? "Pause" : "Resume"}</span>
                  </button>
                  <button
                    onClick={handleResetTrip}
                    className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                  <button
                    onClick={handleMarkDelivered}
                    className="py-1.5 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Delivered</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleStartTrip}
                  disabled={tripStatus === "delivered" || !selectedDelivery}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    tripStatus === "delivered" || !selectedDelivery
                      ? "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                      : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>▶ {locale === "ta" ? "பயணத்தை தொடங்கு" : "Start trip"}</span>
                </button>

                <button
                  onClick={handleMarkDelivered}
                  disabled={tripStatus === "delivered" || !selectedDelivery}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    tripStatus === "delivered" || !selectedDelivery
                      ? "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                      : "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40"
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{locale === "ta" ? "டெலிவரி முடிந்தது" : "Mark Delivered"}</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: My Deliveries */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-cyan-400" />
                <span>My Deliveries ({deliveries.length})</span>
              </h3>
              <button
                onClick={refreshDeliveries}
                className="text-[11px] text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loadingDeliveries ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              {loadingDeliveries ? (
                [1, 2, 3].map((n) => (
                  <div key={n} className="p-3 rounded-xl border border-glass-border bg-white/[0.02] flex items-center justify-between gap-3">
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3.5 w-36" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-md" />
                  </div>
                ))
              ) : sortedDeliveries.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title={locale === "ta" ? "விநியோகங்கள் எதுவும் இல்லை" : "No Deliveries Assigned"}
                  description={
                    locale === "ta"
                      ? "தற்போது உங்களுக்கு எந்த விநியோகப் பணிகளும் ஒதுக்கப்படவில்லை."
                      : "No shipment drops currently queued for your unit."
                  }
                  compact
                />
              ) : (
                sortedDeliveries.map((del) => {
                  const isSelected = selectedDelivery?.id === del.id;
                  const isMed = del.priority === "medical";
                  const isFood = del.priority === "food";

                  return (
                    <div
                      key={del.id}
                      onClick={() => {
                        setSelectedDelivery(del);
                        setTripStatus(del.status || "open");
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-left flex items-start justify-between gap-3 ${
                        isSelected
                          ? isEmergency
                            ? "bg-red-500/15 border-red-500 shadow-md"
                            : "bg-cyan-500/15 border-cyan-400 shadow-md"
                          : "bg-white/[0.02] hover:bg-white/[0.06] border-glass-border"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-white">{del.code}</span>
                          {isMed && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-0.5">
                              <HeartPulse className="w-3 h-3 text-red-400" />
                              <span>{locale === "ta" ? "மருத்துவம்" : "Medical"}</span>
                            </span>
                          )}
                          {isFood && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                              <UtensilsCrossed className="w-3 h-3 text-amber-400" />
                              <span>{locale === "ta" ? "அழுகும் பொருள்" : "Perishable"}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-medium text-slate-200 mt-1 truncate">
                          {del.customerName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {del.address}
                        </div>
                        <div className="text-[11px] text-cyan-400 font-mono mt-0.5">
                          📦 {del.cargo}
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end justify-between self-stretch">
                        <span className="text-[11px] font-mono text-slate-400">{del.etaText}</span>
                        <span
                          className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                            del.status === "delivered"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : del.status === "in_transit"
                              ? "bg-cyan-500/20 text-cyan-300"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {del.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SECTION 3: Plan Route & Candidates */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>{locale === "ta" ? "சாத்தியமான வழித்தடங்கள்" : "Candidate Routes"}</span>
              </h3>
              <button
                onClick={handlePlanRoute}
                disabled={isPlanningRoutes || !selectedDelivery}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isPlanningRoutes ? "animate-spin" : ""}`} />
                <span>{locale === "ta" ? "மறு கணக்கீடு" : "Re-plan"}</span>
              </button>
            </div>

            {/* Candidate Route Cards */}
            {isPlanningRoutes ? (
              <div className="flex items-stretch gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex-1 min-w-[115px] sm:min-w-[125px] p-2.5 rounded-xl border border-glass-border bg-white/[0.02] flex flex-col justify-between flex-shrink-0 gap-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-14" />
                      <Skeleton className="h-3 w-5 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            ) : plannedRoutes.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                <span className="text-xs text-amber-300 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Road data unavailable — Retry</span>
                </span>
                <button
                  onClick={handlePlanRoute}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="flex items-stretch gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                {plannedRoutes.map((route, idx) => {
                  const isSelected = selectedRouteIndex === idx;
                  const km = (route.distanceM / 1000).toFixed(1);
                  const min = Math.round(route.durationS / 60);

                  // Colors: cyan (#00E5FF), violet (#A855F7), amber (#F59E0B)
                  const routeColor = idx === 0 ? "#00E5FF" : idx === 1 ? "#A855F7" : "#F59E0B";
                  const selectedStyle = idx === 0
                    ? "border-cyan-400 bg-cyan-500/20 shadow-md shadow-cyan-500/20"
                    : idx === 1
                    ? "border-purple-400 bg-purple-500/20 shadow-md shadow-purple-500/20"
                    : "border-amber-400 bg-amber-500/20 shadow-md shadow-amber-500/20";

                  // Count hazards touching this candidate
                  const hitCount = hazards.filter((h) => {
                    if (!h.active) return false;
                    return minDistanceToPolylineMeters({ lat: h.lat, lng: h.lng }, route.coords) <= ((h.radiusM || 300) + 150);
                  }).length;

                  return (
                    <button
                      key={route.id}
                      onClick={() => {
                        setSelectedRouteIndex(idx);
                        setQarsResult(null); // Reset optimization if manually picking candidate
                      }}
                      className={`flex-1 min-w-[115px] sm:min-w-[125px] p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between flex-shrink-0 ${
                        isSelected
                          ? selectedStyle
                          : "bg-white/[0.02] hover:bg-white/[0.05] border-glass-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                            style={{ backgroundColor: routeColor }}
                          />
                          <span className="text-[11px] font-bold text-white font-mono">
                            Route {String.fromCharCode(65 + idx)}
                          </span>
                        </div>
                        {hitCount > 0 ? (
                          <span className="text-[10px] text-amber-400 flex items-center gap-0.5" title="Hazards on route">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>{hitCount}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-semibold" title="Safe corridor">
                            ✓ 0
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-extrabold text-slate-100 mt-1">{min} min</div>
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <span className="text-[10px] text-slate-400 font-mono">{km} km</span>
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-white/10 text-slate-300 border border-white/10 whitespace-nowrap">
                          Road data: OSM
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 4: Glowing QARS Button & Result Card */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleRunQars}
              disabled={isOptimizing || plannedRoutes.length === 0}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all relative overflow-hidden group ${
                isEmergency
                  ? "bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-[0_0_25px_rgba(239,68,68,0.5)] hover:shadow-[0_0_35px_rgba(239,68,68,0.8)]"
                  : "bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 text-white shadow-[0_0_25px_rgba(0,229,255,0.4)] hover:shadow-[0_0_35px_rgba(0,229,255,0.7)]"
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isOptimizing ? "animate-spin" : "group-hover:rotate-12 transition-transform"}`} />
              <span>{isOptimizing ? "Synthesizing Quantum Swarm..." : "Optimize with QARS ⚛"}</span>
            </button>

            {/* QARS Result Card with Sparkline */}
            {qarsResult && (
              <div className={`p-4 rounded-2xl bg-white/[0.04] border ${accentBorder} relative overflow-hidden`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Best Route Selected
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300 border border-white/10">
                      Road data: OSM
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                    Save {qarsResult.timeSavedMin} min
                  </span>
                </div>


                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Estimated Travel</span>
                    <span className="text-sm font-bold text-white">
                      {Math.round((qarsResult.best?.durationS || 0) / 60)} min
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Hazards Avoided</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {qarsResult.baselineDelayMin > qarsResult.bestDelayMin ? "100% Cleared" : "Direct Pass"}
                    </span>
                  </div>
                </div>

                {/* SVG Convergence Sparkline */}
                {sparklinePoints && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>Quantum Swarm Fitness</span>
                      <span className="text-cyan-400">40 Iterations</span>
                    </div>
                    <svg viewBox="0 0 150 36" className="w-full h-9 overflow-visible">
                      <polygon points={sparklinePoints.area} fill="rgba(0, 229, 255, 0.15)" />
                      <polyline
                        fill="none"
                        stroke="#00E5FF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={sparklinePoints.points}
                      />
                    </svg>
                  </div>
                )}
              </div>
            )}

            {/* Trip Action & Road Movement Card (Directly accessible after QARS or route selection) */}
            {(qarsResult || plannedRoutes.length > 0) && (
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-glass-border flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-200">
                    <Truck className={`w-4 h-4 ${isEmergency ? "text-red-400" : "text-cyan-400"}`} />
                    <span>{locale === "ta" ? "பயண இயக்கம்" : "Trip Action & Movement"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 5, 10].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setDemoSpeedFactor(s)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                          demoSpeedFactor === s
                            ? isEmergency
                              ? "bg-red-500 text-white shadow-sm"
                              : "bg-cyan-500 text-slate-950 shadow-sm"
                            : "bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                {tripStatus === "in_transit" ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-cyan-300 font-bold">
                        {(mover.remainingM / 1000).toFixed(1)} km remaining
                      </span>
                      <span className="text-emerald-400 font-bold">
                        ETA ~{Math.max(1, Math.round(mover.remainingM / ((40 * 1000 / 60) * demoSpeedFactor)))}m
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isEmergency
                            ? "bg-gradient-to-r from-red-500 to-amber-400"
                            : "bg-gradient-to-r from-cyan-400 to-emerald-400"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, Math.round(mover.progress * 100)))}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={handleTogglePause}
                        className="py-2 px-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                      >
                        {mover.running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{mover.running ? "Pause" : "Resume"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetTrip}
                        className="py-2 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleMarkDelivered}
                        className="py-2 px-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Delivered</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartTrip}
                    disabled={tripStatus === "delivered" || !selectedDelivery}
                    className={`w-full py-3 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                      tripStatus === "delivered" || !selectedDelivery
                        ? "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                        : isEmergency
                        ? "bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white shadow-red-500/30"
                        : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/30"
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>▶ {locale === "ta" ? "பயணத்தை தொடங்கு" : "Start trip"}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* SECTION 5: Safety & Options (Advisories + Audio Read-Aloud) */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Safety & Advisory</span>
              </h3>
              <button
                onClick={toggleSpeech}
                className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-xs ${
                  isSpeaking
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 animate-pulse"
                    : "bg-white/5 hover:bg-white/10 text-slate-300 border-glass-border"
                }`}
                title="Read aloud via Speech Synthesis"
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span className="text-[10px]">{isSpeaking ? "Stop" : "Speak"}</span>
              </button>
            </div>

            {/* Advisory Lines Card */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-glass-border flex flex-col gap-1.5 text-xs">
              {(locale === "ta" ? advisoryLines.ta : advisoryLines.en).length > 0 ? (
                (locale === "ta" ? advisoryLines.ta : advisoryLines.en).map((line, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-300 leading-relaxed">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{line}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 italic text-[11px]">
                  {locale === "ta"
                    ? "பாதை தெளிவு. வழியில் எவ்வித தீவிர ஆபத்துகளும் இல்லை."
                    : "Standard corridor confirmed. No active hazards blocking route path."}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 6: Report Field Hazards */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>Report Incident</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleReportHazard("accident")}
                className="py-2.5 px-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold flex flex-col items-center gap-1 transition-all"
              >
                <span className="text-base">🚧</span>
                <span className="text-[10px]">Accident</span>
              </button>

              <button
                onClick={() => handleReportHazard("breakdown")}
                className="py-2.5 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex flex-col items-center gap-1 transition-all"
              >
                <span className="text-base">🔧</span>
                <span className="text-[10px]">Breakdown</span>
              </button>

              <button
                onClick={() => handleReportHazard("roadblock")}
                className="py-2.5 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex flex-col items-center gap-1 transition-all"
              >
                <span className="text-base">⛔</span>
                <span className="text-[10px]">Roadblock</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM-LEFT HAZARD DANGER TOAST (Spec requirement) */}
      {activeHazardAlert && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm w-full p-4 rounded-2xl bg-slate-950/95 border-2 border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.5)] backdrop-blur-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-bounce">🚧</span>
              <div>
                <h4 className="text-sm font-extrabold text-red-400">
                  Hazard Ahead on Route!
                </h4>
                <p className="text-xs text-slate-200 mt-0.5">
                  {activeHazardAlert.type.toUpperCase()} — {activeHazardAlert.distMeters || 600} m
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveHazardAlert(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-300 mt-2 line-clamp-2">
            {activeHazardAlert.note || "Active disruption detected within your corridor perimeter."}
          </p>

          <div className="grid grid-cols-2 gap-2 mt-3.5">
            <button
              onClick={handleRerouteFromCurrentPosition}
              className="py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Alternative Route</span>
            </button>

            <button
              onClick={async () => {
                await sendMessage(
                  profile?.uid || "driver-me",
                  "admin",
                  `URGENT ALERT: Driver reported hazard ${activeHazardAlert.type} at ${activeHazardAlert.distMeters}m.`
                );
                setTripStatus("issue");
                setActiveHazardAlert(null);
                toast.warning(locale === "ta" ? "நிறுவனத்திற்கு தகவல் அனுப்பப்பட்டது" : "Control room notified of issue");
              }}
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 flex items-center justify-center gap-1 transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>Inform Company</span>
            </button>
          </div>
        </div>
      )}

      {/* DISPATCHER CHAT DRAWER */}
      <Drawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        title={locale === "ta" ? "கட்டுப்பாட்டு அறை தொடர்பு" : "Control Room Dispatch Comms"}
        description={locale === "ta" ? "KovaiSwift மேலாண்மை குழுவுடனான இருவழி நேரடி தகவல் தொடர்பு" : "Direct two-way channel with KovaiSwift Logistics management team"}
        position="right"
      >
        <div className="flex flex-col h-[75vh] justify-between">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto space-y-3 p-2">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <EmptyState
                  icon={MessageSquare}
                  title={locale === "ta" ? "செய்திகள் இல்லை" : "No Messages Yet"}
                  description={locale === "ta" ? "கீழே உள்ள விரைவு பதில்கள் அல்லது உரைப்பெட்டி மூலம் நிலவரத்தை அனுப்பவும்." : "Send a quick status update below to reach mission dispatch."}
                />
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.fromUid === (profile?.uid || "driver-me");
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                        isMe
                          ? "bg-cyan-500 text-slate-950 font-medium rounded-br-none"
                          : "bg-white/10 text-slate-200 rounded-bl-none border border-white/10"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 font-mono">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Reply Pills */}
          <div className="pt-3 border-t border-glass-border">
            <div className="text-[10px] font-mono text-slate-400 uppercase mb-2">
              {locale === "ta" ? "விரைவு பதில்கள்" : "Quick Replies"}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                { en: "Delayed", ta: "தாமதம்" },
                { en: "Delivered", ta: "வழங்கப்பட்டது" },
                { en: "Need help", ta: "உதவி தேவை" },
              ].map((qr) => (
                <button
                  key={qr.en}
                  onClick={() => handleSendMessage(locale === "ta" ? qr.ta : qr.en)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-glass-border text-xs text-slate-200 transition-colors"
                >
                  {locale === "ta" ? qr.ta : qr.en}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={locale === "ta" ? "செய்தி அல்லது நிலவரத்தை தட்டச்சு செய்க..." : "Type advisory or status..."}
                className="flex-1 bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 bg-cyan-500 disabled:opacity-40 text-slate-950 rounded-xl hover:bg-cyan-400 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
