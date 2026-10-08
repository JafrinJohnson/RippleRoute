"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/layout/Navbar";
import FleetMap from "@/components/map";
import { getRoadRoutes } from "@/lib/roadRouting";
import { buildPath, pointAtDistance, advanceRouteDistance } from "@/lib/routeAnimator";
import {
  Truck,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  MapPin,
  AlertCircle,
  Radio,
  Maximize2,
  CheckCircle2,
  Layers,
  ShieldAlert,
  ArrowRight,
  Compass,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import Button from "@/components/ui/Button";
import { Skeleton, EmptyState } from "@/components/ui";

import demoRoutesData from "@/data/demoRoutes.json";

// Real Coimbatore Waypoints
const DEPOT_COORDS = { lat: 11.0270, lng: 77.0100 }; // Peelamedu Depot
const GANDHIPURAM_COORDS = { lat: 11.0168, lng: 76.9658 }; // Gandhipuram Hub
const RS_PURAM_COORDS = { lat: 11.0089, lng: 76.9500 }; // RS Puram Center
const SINGANALLUR_COORDS = { lat: 10.9990, lng: 77.0300 }; // Singanallur Terminal
const SAIBABA_COORDS = { lat: 11.0330, lng: 76.9480 }; // Saibaba Colony

// Base fleet vehicle profiles (Anonymised for Public Live Map - 4 moving trucks)
const FLEET_PROFILES = [
  {
    uid: "drv-01",
    name: "Truck 1",
    vehicleNumber: "Truck 1",
    status: "on_time",
    role: "driver",
    priority: "normal",
    speedKmh: 42,
    cargoType: "Standard Freight (Peelamedu → Gandhipuram)",
    routeTarget: "gandhipuram",
    progressRatio: 0.15,
  },
  {
    uid: "drv-02",
    name: "Emergency 1",
    vehicleNumber: "Emergency 1",
    status: "delayed",
    role: "emergency",
    priority: "medical",
    speedKmh: 56,
    cargoType: "Medical Oxygen & Vaccines (Peelamedu → RS Puram)",
    isEmergency: true,
    routeTarget: "rspuram",
    progressRatio: 0.45,
  },
  {
    uid: "drv-03",
    name: "Emergency 2",
    vehicleNumber: "Emergency 2",
    status: "at_risk",
    role: "emergency",
    priority: "food",
    speedKmh: 36,
    cargoType: "Perishable Produce (Peelamedu → Singanallur)",
    isEmergency: true,
    routeTarget: "singanallur",
    progressRatio: 0.28,
  },
  {
    uid: "drv-04",
    name: "Truck 2",
    vehicleNumber: "Truck 2",
    status: "on_time",
    role: "driver",
    priority: "normal",
    speedKmh: 40,
    cargoType: "Commercial Electronics (Peelamedu → Saibaba Colony)",
    routeTarget: "saibaba",
    progressRatio: 0.65,
  },
];


// Sample Coimbatore hazards
const SAMPLE_HAZARDS = [
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

// Sample deliveries
const SAMPLE_DELIVERIES = [
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

export default function LiveMapPage() {
  const { isTamil } = useLanguage();
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [roadError, setRoadError] = useState(false);
  const [selectedUid, setSelectedUid] = useState("drv-02");
  const [flyTo, setFlyTo] = useState(null);
  const [fitToRoutes, setFitToRoutes] = useState(false);
  const [lastClickedPoint, setLastClickedPoint] = useState(null);
  const [pingCount, setPingCount] = useState(0);
  // Auto simulation starts automatically when the page opens per requirements
  const [isAutoSimulating, setIsAutoSimulating] = useState(true);

  // Store precomputed path geometry objects
  const pathsRef = useRef({});

  // Fetch real road routes from OSRM
  const loadRealRoads = useCallback(async () => {
    setLoadingRoutes(true);
    setRoadError(false);

    try {
      // 1. Depot -> Gandhipuram (request alternatives)
      const rGandhipuram = await getRoadRoutes(DEPOT_COORDS, GANDHIPURAM_COORDS, {
        alternatives: true,
      });

      // 2. Depot -> RS Puram (direct)
      const rRsPuram = await getRoadRoutes(DEPOT_COORDS, RS_PURAM_COORDS, {
        alternatives: false,
      });

      // 3. Depot -> Singanallur (direct)
      const rSinganallur = await getRoadRoutes(DEPOT_COORDS, SINGANALLUR_COORDS, {
        alternatives: false,
      });

      if (
        (!rGandhipuram || rGandhipuram.length === 0) &&
        (!rRsPuram || rRsPuram.length === 0) &&
        (!rSinganallur || rSinganallur.length === 0)
      ) {
        setRoutes([]);
        setRoadError(true);
        setLoadingRoutes(false);
        return;
      }

      const activeRoutes = [];
      const pathsMap = {};

      // Route 1 Primary: Peelamedu to Gandhipuram
      if (rGandhipuram && rGandhipuram.length > 0) {
        const prim = rGandhipuram[0];
        const distKm = (prim.distanceM / 1000).toFixed(1);
        activeRoutes.push({
          id: "route-gandhipuram-prim",
          coords: prim.coords,
          color: "#00E5FF",
          highlighted: true,
          dashed: false,
          label: `Avinashi Rd Arterial (${distKm} km)`,
        });
        pathsMap.gandhipuram = buildPath(prim.coords);

        // Route 1 Alternative (if returned from OSRM)
        if (rGandhipuram.length > 1) {
          const alt = rGandhipuram[1];
          const altKm = (alt.distanceM / 1000).toFixed(1);
          activeRoutes.push({
            id: "route-gandhipuram-alt",
            coords: alt.coords,
            color: "#7C5CFF",
            highlighted: false,
            dashed: true,
            label: `100 Feet Rd Bypass (${altKm} km)`,
          });
        }
      }

      // Route 2: Peelamedu to RS Puram (Emergency Medical)
      if (rRsPuram && rRsPuram.length > 0) {
        const med = rRsPuram[0];
        const medKm = (med.distanceM / 1000).toFixed(1);
        activeRoutes.push({
          id: "route-rspuram",
          coords: med.coords,
          color: "#EF4444",
          highlighted: true,
          dashed: false,
          label: `Medical Lifeline to RS Puram (${medKm} km)`,
        });
        pathsMap.rspuram = buildPath(med.coords);
      }

      // Route 3: Peelamedu to Singanallur (Perishables)
      if (rSinganallur && rSinganallur.length > 0) {
        const sing = rSinganallur[0];
        const singKm = (sing.distanceM / 1000).toFixed(1);
        activeRoutes.push({
          id: "route-singanallur",
          coords: sing.coords,
          color: "#F59E0B",
          highlighted: false,
          dashed: false,
          label: `Trichy Rd Corridor to Singanallur (${singKm} km)`,
        });
        pathsMap.singanallur = buildPath(sing.coords);
      }

      // Route 4: Peelamedu to Saibaba Colony (Standard Freight - Truck 2)
      const saibabaCoords = demoRoutesData["del-03"]?.coords || [];
      if (saibabaCoords.length >= 2) {
        const sDist = demoRoutesData["del-03"].distanceM;
        const sKm = (sDist / 1000).toFixed(1);
        activeRoutes.push({
          id: "route-saibaba",
          coords: saibabaCoords,
          color: "#A855F7",
          highlighted: false,
          dashed: true,
          label: `MTP Rd Corridor to Saibaba Colony (${sKm} km)`,
        });
        pathsMap.saibaba = buildPath(saibabaCoords);
      }

      pathsRef.current = pathsMap;
      setRoutes(activeRoutes);

      // Initialize fleet vehicles onto their real road lines
      const initializedVehicles = FLEET_PROFILES.map((prof) => {
        const path = pathsMap[prof.routeTarget];
        if (path && path.coords.length >= 2) {
          const currentDistM = Math.round(path.totalDistance * prof.progressRatio);
          const pt = pointAtDistance(path, currentDistM);
          const remainingM = Math.max(0, path.totalDistance - currentDistM);
          const etaMinutes = prof.speedKmh > 0 ? Math.max(1, Math.round((remainingM / (prof.speedKmh * 1000 / 60)) / 8)) : 0;
          return {
            ...prof,
            lat: pt.lat,
            lng: pt.lng,
            heading: pt.heading,
            currentDistM,
            totalDistanceM: path.totalDistance,
            progress: prof.progressRatio,
            etaMinutes,
            routeCoords: path.coords,
          };
        }

        return {
          ...prof,
          lat: DEPOT_COORDS.lat,
          lng: DEPOT_COORDS.lng,
          heading: 0,
          currentDistM: 0,
          totalDistanceM: 0,
          progress: 0,
          etaMinutes: 0,
          routeCoords: null,
        };
      });

      setVehicles(initializedVehicles);
      setRoadError(false);
    } catch (err) {
      console.error("[LiveMap] Failed fetching road routes:", err);
      setRoutes([]);
      setRoadError(true);
    } finally {
      setLoadingRoutes(false);
    }
  }, []);

  useEffect(() => {
    loadRealRoads();
  }, [loadRealRoads]);

  // Step vehicle telemetry along its real road path
  const handleSimulateStep = useCallback(() => {
    setPingCount((prev) => prev + 1);
    setVehicles((prevVehicles) =>
      prevVehicles.map((v) => {
        const path = pathsRef.current[v.routeTarget];
        if (!path || !path.coords || path.coords.length < 2 || v.speedKmh <= 0) {
          return v;
        }

        const nextDistM = advanceRouteDistance(
          v.currentDistM ?? 0,
          v.speedKmh,
          8, // 8x demo acceleration
          1,
          path.totalDistance,
          true
        );

        const pt = pointAtDistance(path, nextDistM);
        const progress = path.totalDistance > 0 ? nextDistM / path.totalDistance : 0;
        const remainingM = Math.max(0, path.totalDistance - nextDistM);
        const etaMinutes = v.speedKmh > 0 ? Math.max(1, Math.round((remainingM / (v.speedKmh * 1000 / 60)) / 8)) : 0;

        return {
          ...v,
          lat: pt.lat,
          lng: pt.lng,
          heading: pt.heading,
          currentDistM: nextDistM,
          totalDistanceM: path.totalDistance,
          progress,
          etaMinutes,
        };
      })
    );
  }, []);

  // Automatic simulation ticker (1.1s loop)
  useEffect(() => {
    if (!isAutoSimulating) return;
    const interval = setInterval(() => {
      handleSimulateStep();
    }, 1100);
    return () => clearInterval(interval);
  }, [isAutoSimulating, handleSimulateStep]);

  const handleSelectVehicle = (v) => {
    setSelectedUid(v.uid);
    setFlyTo({
      lat: v.lat,
      lng: v.lng,
      zoom: 15,
    });
  };

  const handleResetView = () => {
    setSelectedUid(null);
    setFlyTo({
      lat: 11.0168,
      lng: 76.9658,
      zoom: 13,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-safe/15 text-safe border border-safe/30 flex items-center gap-1">
                <Radio className="w-3 h-3 text-safe animate-pulse" />
                {isTamil ? "நேரடி மிஷன் கட்டுப்பாடு" : "Live Mission Control"}
              </span>
              <span className="text-xs text-muted font-mono">
                {isTamil ? "கோவை நகர்ப்புற மையம் • பீளமேடு மத்திய கிடங்கு" : "Coimbatore Urban Core • Peelamedu Central Depot"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
              {isTamil ? "நேரடி கடற்படை வரைபடம்" : "Live Fleet Map"}
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl leading-relaxed">
              {isTamil
                ? "நிகழ்நேர KovaiSwift கடற்படை தொலை அளவியல், OSRM சாலை வடிவமைப்பு, தீவிர மேற்குத் தொடர்ச்சி மலை அபாயங்கள் மற்றும் தன்னாட்சி QARS திரள் வழிகள்."
                : "Real-time KovaiSwift fleet telemetry, OSRM road geometry alignment, active Western Ghats hazards, and autonomous QARS swarm corridors."}
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {roadError ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-danger/20 border border-danger/40 text-danger text-xs font-medium">
                <AlertCircle size={14} />
                <span>{isTamil ? "சாலை தரவு கிடைக்கவில்லை, மீண்டும் முயற்சிக்கவும்" : "Road data unavailable, retry"}</span>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={loadRealRoads}
                  className="ml-1 h-7 text-xs px-2 btn-hover"
                >
                  {isTamil ? "மீண்டும் முயற்சி" : "Retry"}
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant={isAutoSimulating ? "danger" : "primary"}
                  size="sm"
                  iconLeft={isAutoSimulating ? Pause : Play}
                  onClick={() => setIsAutoSimulating((prev) => !prev)}
                  disabled={loadingRoutes}
                  className="shadow-lg shadow-primary/20 btn-hover"
                >
                  {isAutoSimulating
                    ? isTamil ? "நிறுத்து" : "Pause Simulation"
                    : isTamil ? "தொடங்கு" : "Resume Live Sim"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={Play}
                  onClick={handleSimulateStep}
                  disabled={loadingRoutes}
                  className="btn-hover"
                >
                  {isTamil ? "படி அளவியல்" : "Step Telemetry"} ({pingCount})
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={Maximize2}
                  onClick={() => setFitToRoutes((prev) => !prev)}
                  className="btn-hover"
                >
                  {fitToRoutes
                    ? isTamil ? "அளவை மீட்டமை" : "Unfit Bounds"
                    : isTamil ? "வழிகளுக்குப் பொருத்து" : "Fit to Routes"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={RefreshCw}
                  onClick={handleResetView}
                  className="btn-hover"
                >
                  {isTamil ? "மைய மீட்டமை" : "Reset Center"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Map Container (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <FleetMap
              center={[11.0168, 76.9658]}
              zoom={13}
              vehicles={vehicles}
              routes={routes}
              hazards={SAMPLE_HAZARDS}
              deliveries={SAMPLE_DELIVERIES}
              selectedUid={selectedUid}
              flyTo={flyTo}
              fitToRoutes={fitToRoutes}
              onMapClick={(latlng) => setLastClickedPoint(latlng)}
              onVehicleClick={(uid) => {
                const v = vehicles.find((x) => x.uid === uid);
                if (v) handleSelectVehicle(v);
              }}
              height="640px"
            />

            {/* Map Info Bar / Status Footer */}
            <div className="p-3.5 rounded-xl bg-glass border border-glass-border flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-safe" />
                  {isTamil ? "சரியான நேரம் (1)" : "On Time (1)"}
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
                  {isTamil ? "தாமதம் / மருத்துவம் (1)" : "Delayed / Med (1)"}
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-warn" />
                  {isTamil ? "ஆபத்தில் (1)" : "At Risk (1)"}
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  {isTamil ? "செயலற்றது (1)" : "Idle (1)"}
                </span>
              </div>

              {lastClickedPoint && (
                <div className="flex items-center gap-1.5 text-cyan-400 font-mono">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {isTamil ? "கிளிக் செய்யப்பட்டது:" : "Clicked:"} {lastClickedPoint.lat.toFixed(5)}°N, {lastClickedPoint.lng.toFixed(5)}°E
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Diagnostics & Controls (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Active Fleet Units Card */}
            <div className="p-4 rounded-2xl bg-glass border border-glass-border shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  {isTamil ? "நேரடி கடற்படை (பெயர் மறைக்கப்பட்டது)" : "Live Fleet (Public Anonymised)"}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono font-bold">
                  {vehicles.length} {isTamil ? "வாகனங்கள்" : "Units"}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                {isTamil
                  ? "பொது பார்வைக்காக அடையாளங்கள் மறைக்கப்பட்டுள்ளன. முழு தொலை அளவியல் நிர்வாக கட்டுப்பாட்டில் கிடைக்கும்."
                  : "Identities & registrations anonymised for public view. Full telemetry available in Admin Dispatch."}
              </p>

              <div className="flex flex-col gap-2.5">
                {loadingRoutes ? (
                  <div className="space-y-2.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 rounded-xl border border-glass-border bg-white/5 space-y-2 animate-pulse">
                        <div className="flex justify-between items-center">
                          <Skeleton width="100px" height="14px" />
                          <Skeleton width="50px" height="12px" />
                        </div>
                        <Skeleton width="130px" height="11px" />
                        <Skeleton width="75%" height="10px" />
                      </div>
                    ))}
                  </div>
                ) : vehicles.length === 0 ? (
                  <EmptyState
                    icon={Truck}
                    title={isTamil ? "வாகனங்கள் இல்லை" : "No Active Fleet"}
                    description={isTamil ? "தற்போது தொலை அளவியல் அனுப்பும் வாகனங்கள் இல்லை." : "No vehicles currently reporting live road telemetry."}
                  />
                ) : (
                  vehicles.map((v) => {
                    const isSelected = selectedUid === v.uid;
                    const path = pathsRef.current[v.routeTarget];
                    const totalKm = path ? (path.totalDistance / 1000).toFixed(1) : "0";
                    const currKm = v.currentDistM ? (v.currentDistM / 1000).toFixed(1) : "0";

                    return (
                      <button
                        key={v.uid}
                        type="button"
                        onClick={() => handleSelectVehicle(v)}
                        className={`w-full text-left p-3 rounded-xl border transition-all interactive-hover ${
                          isSelected
                            ? "bg-primary/20 border-cyan-400 shadow-md shadow-cyan-500/10"
                            : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">
                              {v.name}
                            </span>
                            {v.isEmergency && (
                              <span className="text-xs">
                                {v.priority === "medical" ? "🏥" : "🍱"}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-semibold ${
                              v.status === "on_time"
                                ? "bg-safe/20 text-safe"
                                : v.status === "delayed"
                                ? "bg-danger/20 text-danger"
                                : v.status === "at_risk"
                                ? "bg-warn/20 text-warn"
                                : "bg-slate-500/20 text-slate-300"
                            }`}
                          >
                            {v.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted font-mono mt-1">
                          <span>{v.vehicleNumber}</span>
                          <span>{isTamil ? "திசை:" : "Heading:"} {Math.round(v.heading || 0)}°</span>
                        </div>

                        <div className="text-[10px] text-slate-300 mt-1 truncate">
                          {v.cargoType}
                        </div>

                        {path && v.speedKmh > 0 && (
                          <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-cyan-300">
                            <span>{isTamil ? "சாலை:" : "Road:"} {currKm} / {totalKm} km</span>
                            <span>{isTamil ? "வேகம்:" : "Speed:"} {v.speedKmh} km/h (x8)</span>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Active Real Road Routes Card */}
            <div className="p-4 rounded-2xl bg-glass border border-glass-border shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  {isTamil ? "செயலில் உள்ள சாலை வழிகள்" : "Active Road Corridors"}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-mono font-bold">
                  {routes.length} {isTamil ? "வழிகள்" : "Active"}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {loadingRoutes ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between animate-pulse">
                        <Skeleton width="120px" height="12px" />
                        <Skeleton width="45px" height="10px" />
                      </div>
                    ))}
                  </div>
                ) : routes.length === 0 ? (
                  <EmptyState
                    icon={Layers}
                    title={isTamil ? "வழிகள் இல்லை" : "No Corridors"}
                    description={isTamil ? "தற்போது கணக்கிடப்பட்ட சாலை வழிகள் எதுவும் இல்லை." : "No active road corridors currently computed."}
                  />
                ) : (
                  routes.map((r) => (
                    <div
                      key={r.id}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs interactive-hover"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: r.color }}
                        />
                        <span className="text-white font-medium">{r.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted">
                        {r.coords.length} pts
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active Hazards Alert Card */}
            <div className="p-4 rounded-2xl bg-glass border border-glass-border shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warn" />
                  {isTamil ? "குறிக்கப்பட்ட கோவை அபாயங்கள்" : "Marked Coimbatore Hazards"}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-danger/20 text-danger font-mono font-bold">
                  {SAMPLE_HAZARDS.length} {isTamil ? "செயலில்" : "Active"}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {SAMPLE_HAZARDS.length === 0 ? (
                  <EmptyState
                    icon={AlertTriangle}
                    title={isTamil ? "அபாயங்கள் இல்லை" : "No Active Hazards"}
                    description={isTamil ? "அனைத்து கோவை வழித்தடங்களும் தடையின்றி இயங்குகின்றன." : "All corridors are operating without reported road hazards."}
                  />
                ) : (
                  SAMPLE_HAZARDS.map((h) => {
                    let icon = "🚧";
                    let tagColor = "text-danger bg-danger/20";
                    if (h.type === "landslide") {
                      icon = "⛰️";
                      tagColor = "text-warn bg-warn/20";
                    } else if (h.type === "rain") {
                      icon = "🌧️";
                      tagColor = "text-cyan-400 bg-cyan-400/20";
                    }

                    return (
                      <div
                        key={h.id}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/5 interactive-hover"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <span>{icon}</span>
                            <span className="capitalize">{h.type}</span>
                          </span>
                          <span className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${tagColor}`}>
                            {h.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted mt-1 leading-snug">
                          {h.note}
                        </p>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          {h.roadName} &bull; {h.radiusM}m radius
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
