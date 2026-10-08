"use client";

import React, { useState, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Circle,
  Tooltip,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { buildPath, pointAtDistance } from "@/lib/routeAnimator";
import {
  Plus,
  Minus,
  Layers,
  Crosshair,
  Maximize2,
  Navigation,
  Compass,
} from "lucide-react";

// Reference central coordinates
const COIMBATORE_CENTER = [11.0168, 76.9558];
const DEPOT_COORDS = [11.0270, 77.0100];

// Base tile layers definition
const BASE_LAYERS = {
  satellite: {
    id: "satellite",
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    labelsUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    thumbnail: "radial-gradient(circle at 40% 40%, #1e3a5f 0%, #064e3b 50%, #022c22 100%)",
  },
  terrain: {
    id: "terrain",
    name: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    maxZoom: 17,
    attribution: "OpenTopoMap, &copy; OpenStreetMap contributors",
    thumbnail: "radial-gradient(circle at 50% 50%, #78350f 0%, #3f6212 55%, #14532d 100%)",
  },
  dark: {
    id: "dark",
    name: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap, &copy; CARTO",
    thumbnail: "radial-gradient(circle at 50% 50%, #1e1b4b 0%, #0f172a 60%, #020617 100%)",
  },
};

// SVG truck icon string for vehicle marker
// SVG truck icon string for vehicle marker (fallback)
const TRUCK_SVG = `
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
  <path d="M15 18H9"/>
  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
  <circle cx="17" cy="18.5" r="2.5"/>
  <circle cx="7" cy="18.5" r="2.5"/>
</svg>
`;

/**
 * Helper to build custom vehicle DivIcon
 * Normal drivers show a 🚚 truck icon; only emergency users show 🏥 (medical) or 🍱 (food).
 */
function createVehicleDivIcon(vehicle, isSelected) {
  const status = vehicle.status || "on_time";
  const role = vehicle.role || "driver";
  const priority = (vehicle.priority || "").toLowerCase();
  const cargo = (vehicle.cargoType || "").toLowerCase();
  
  // Explicit emergency check: only emergency role or explicit flag
  const isEmergency = role === "emergency" || vehicle.isEmergency === true;
  const isFood = priority === "food" || priority === "perishable" || cargo.includes("food") || cargo.includes("perishable");
  
  // Normal drivers show a 🚚 truck icon; only emergency users show 🏥 (medical) or 🍱 (food)
  const truckGlyph = isEmergency ? (isFood ? "🍱" : "🏥") : "🚚";

  let color = "#10B981"; // on_time / safe
  let bgRgba = "rgba(16, 185, 129, 0.25)";

  if (status === "at_risk") {
    color = "#F59E0B";
    bgRgba = "rgba(245, 158, 11, 0.25)";
  } else if (status === "delayed" || status === "issue" || status === "disrupted") {
    color = "#EF4444";
    bgRgba = "rgba(239, 68, 68, 0.28)";
  } else if (status === "idle") {
    color = "#94A3B8";
    bgRgba = "rgba(148, 163, 184, 0.20)";
  }

  const heading = vehicle.heading || 0;
  const selectedStyle = isSelected
    ? "box-shadow: 0 0 0 3px #00E5FF, 0 0 20px rgba(0, 229, 255, 0.8);"
    : "box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);";

  const pulseRingHtml = isEmergency
    ? `<span class="emergency-pulse-ring" style="position: absolute; inset: -5px; border-radius: 9999px; border: 2px solid #EF4444; pointer-events: none;"></span>`
    : "";

  const html = `
    <div style="position: relative; display: inline-flex; align-items: center; justify-content: center; cursor: pointer;">
      ${pulseRingHtml}
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 4px 9px;
        border-radius: 9999px;
        background: rgba(15, 23, 42, 0.90);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1.5px solid ${color};
        color: ${color};
        font-family: inherit;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: -0.01em;
        white-space: nowrap;
        transition: all 0.2s ease;
        ${selectedStyle}
      ">
        <span class="truck-icon-rotator" style="display: inline-flex; align-items: center; justify-content: center; font-size: 14px; line-height: 1; transform: rotate(${heading}deg); transform-origin: center; transition: transform 0.3s ease;">
          ${truckGlyph}
        </span>
        <span style="color: #F8FAFC; font-size: 11px; max-width: 85px; overflow: hidden; text-overflow: ellipsis; font-weight: 700;">
          ${vehicle.name ? vehicle.name.split(" ")[0] : "Unit"}
        </span>
      </div>
    </div>
  `;

  const isAtDepot =
    typeof vehicle.lat === "number" &&
    typeof vehicle.lng === "number" &&
    Math.abs(vehicle.lat - 11.0270) < 0.0015 &&
    Math.abs(vehicle.lng - 77.0100) < 0.0015;

  return L.divIcon({
    className: "ripple-vehicle-divicon",
    html,
    iconSize: [110, 32],
    iconAnchor: isAtDepot ? [55, 44] : [55, 16],
    popupAnchor: isAtDepot ? [0, -46] : [0, -18],
  });
}

/**
 * Helper to build custom hazard DivIcon
 */
function createHazardDivIcon(hazard) {
  let emoji = "🚧";
  let color = "#EF4444";
  let bgRgba = "rgba(239, 68, 68, 0.25)";
  let isPulsing = false;

  const type = (hazard.type || "").toLowerCase();
  if (type === "rain") {
    emoji = "🌧️";
    color = "#00E5FF";
    bgRgba = "rgba(0, 229, 255, 0.22)";
  } else if (type === "landslide") {
    emoji = "⛰️";
    color = "#FFB020";
    bgRgba = "rgba(255, 176, 32, 0.25)";
  } else if (type === "accident" || type === "roadblock") {
    emoji = "🚧";
    color = "#FF4D4F";
    bgRgba = "rgba(255, 77, 79, 0.3)";
    isPulsing = true;
  } else if (type === "breakdown") {
    emoji = "🔧";
    color = "#F59E0B";
    bgRgba = "rgba(245, 158, 11, 0.25)";
  }

  const pulseStyle = isPulsing
    ? `<span class="hazard-pulse-ring" style="position: absolute; inset: -4px; border-radius: 9999px; border: 2px solid ${color}; pointer-events: none;"></span>`
    : "";

  const html = `
    <div style="position: relative; display: inline-flex; align-items: center; justify-content: center; cursor: pointer;">
      ${pulseStyle}
      <div style="
        width: 34px;
        height: 34px;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(15, 23, 42, 0.90);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 2px solid ${color};
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5), 0 0 12px ${bgRgba};
        font-size: 15px;
        line-height: 1;
      ">
        ${emoji}
      </div>
    </div>
  `;

  return L.divIcon({
    className: "ripple-hazard-divicon",
    html,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });
}

/**
 * Helper to build custom delivery DivIcon
 */
function createDeliveryDivIcon(delivery) {
  let color = "#7C5CFF"; // normal = violet
  let emoji = "📦";
  const priority = (delivery.priority || "").toLowerCase();

  if (priority === "medical") {
    color = "#EF4444";
    emoji = "🏥";
  } else if (priority === "food" || priority === "perishable") {
    color = "#F59E0B";
    emoji = "🍱";
  }

  // Format single-line pill: "🏥 MED-RSP-02" or "📦 GANDHI-01"
  let shortCode = delivery.code || "DEL";
  if (shortCode.startsWith("DEL-")) {
    shortCode = shortCode.slice(4);
  }

  const html = `
    <div style="position: relative; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; white-space: nowrap !important; width: max-content !important; max-width: none !important; transform: translate(-50%, -50%);">
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 7px;
        border-radius: 9999px;
        background: rgba(15, 23, 42, 0.94);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1.5px solid ${color};
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.55);
        color: #F8FAFC;
        font-size: 10px;
        font-weight: 700;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        white-space: nowrap !important;
        max-width: none !important;
        width: auto !important;
        line-height: 1.2;
      ">
        <span style="font-size: 11px; line-height: 1; flex-shrink: 0;">${emoji}</span>
        <span style="white-space: nowrap !important; flex-shrink: 0;">${shortCode}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: "ripple-delivery-divicon",
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -14],
  });
}

/**
 * Helper to build custom Depot DivIcon
 */
function createDepotDivIcon() {
  const html = `
    <div style="position: relative; display: inline-flex; align-items: center; justify-content: center; cursor: pointer;">
      <span class="depot-pulse-ring" style="position: absolute; inset: -4px; border-radius: 9999px; border: 2px solid #00E5FF; pointer-events: none;"></span>
      <div style="
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 10px;
        border-radius: 9999px;
        background: rgba(10, 15, 30, 0.92);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 2px solid #00E5FF;
        box-shadow: 0 4px 20px rgba(0, 229, 255, 0.35), 0 0 12px rgba(0, 0, 0, 0.6);
        color: #00E5FF;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: -0.01em;
        white-space: nowrap;
      ">
        <span style="font-size: 13px;">🏢</span>
        <span style="color: #FFFFFF;">KovaiSwift Depot</span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: "ripple-depot-divicon",
    html,
    iconSize: [140, 32],
    iconAnchor: [70, 16],
    popupAnchor: [0, -18],
  });
}

/**
 * Subcomponent to smoothly animate vehicle movements over ~1s using requestAnimationFrame
 * Supports exact along-the-road path interpolation via routeCoords + currentDistM,
 * and rotates the vehicle truck icon to match the road heading.
 */
function AnimatedVehicleMarker({ vehicle, isSelected, onClick }) {
  const markerRef = useRef(null);
  const currentPosRef = useRef([vehicle.lat, vehicle.lng]);
  const currentDistRef = useRef(vehicle.currentDistM ?? 0);
  const currentHeadingRef = useRef(vehicle.heading ?? 0);
  const animationRef = useRef(null);
  const pathRef = useRef(null);

  // If vehicle has routeCoords, build or update road path
  useEffect(() => {
    if (Array.isArray(vehicle.routeCoords) && vehicle.routeCoords.length >= 2) {
      pathRef.current = buildPath(vehicle.routeCoords);
    } else {
      pathRef.current = null;
    }
  }, [vehicle.routeCoords]);

  useEffect(() => {
    const hasPath = pathRef.current && typeof vehicle.currentDistM === "number";
    const targetDist = vehicle.currentDistM ?? 0;
    const startDist = currentDistRef.current;

    const targetLat = vehicle.lat;
    const targetLng = vehicle.lng;
    const [startLat, startLng] = currentPosRef.current;
    const startHeading = currentHeadingRef.current;
    const targetHeading = typeof vehicle.heading === "number" ? vehicle.heading : startHeading;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (typeof document !== "undefined" && document.hidden) {
      currentPosRef.current = [targetLat, targetLng];
      currentHeadingRef.current = targetHeading;
      if (markerRef.current) {
        markerRef.current.setLatLng([targetLat, targetLng]);
      }
      return;
    }

    const startTime = performance.now();
    const duration = 1000; // 1s smooth interpolation

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic for realistic momentum
      const ease = 1 - Math.pow(1 - progress, 3);

      let currentLat = targetLat;
      let currentLng = targetLng;
      let currentHeading = targetHeading;

      if (hasPath) {
        // Interpolate along the actual road line so truck never cuts corners!
        const interpolatedDist = startDist + (targetDist - startDist) * ease;
        const pt = pointAtDistance(pathRef.current, interpolatedDist);
        currentLat = pt.lat;
        currentLng = pt.lng;
        currentHeading = pt.heading;
        currentDistRef.current = interpolatedDist;
      } else {
        // Standard coordinate interpolation
        currentLat = startLat + (targetLat - startLat) * ease;
        currentLng = startLng + (targetLng - startLng) * ease;
        // Smallest angular delta for smooth compass rotation
        const diff = (targetHeading - startHeading + 540) % 360 - 180;
        currentHeading = (startHeading + diff * ease + 360) % 360;
      }

      currentPosRef.current = [currentLat, currentLng];
      currentHeadingRef.current = currentHeading;

      if (markerRef.current) {
        markerRef.current.setLatLng([currentLat, currentLng]);
        const el = markerRef.current.getElement();
        if (el) {
          const rotator = el.querySelector(".truck-icon-rotator");
          if (rotator) {
            rotator.style.transform = `rotate(${Math.round(currentHeading)}deg)`;
          }
        }
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [vehicle.lat, vehicle.lng, vehicle.heading, vehicle.currentDistM]);

  const icon = createVehicleDivIcon(vehicle, isSelected);

  return (
    <Marker
      ref={markerRef}
      position={[vehicle.lat, vehicle.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick && onClick(vehicle.uid || vehicle.id),
      }}
    >
      <Tooltip direction="top" offset={[0, -14]} opacity={1}>
        <div className="p-1 min-w-[120px]">
          <div className="font-bold text-xs text-white flex items-center justify-between gap-2">
            <span>{vehicle.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 uppercase tracking-wider font-mono">
              {vehicle.status || "active"}
            </span>
          </div>
          <div className="text-[11px] text-slate-300 font-mono mt-0.5">
            {vehicle.vehicleNumber || vehicle.vehicle || "TN-37-XX"}
          </div>
          {vehicle.cargoType && (
            <div className="text-[10px] text-primary mt-1 border-t border-white/10 pt-1">
              {vehicle.cargoType}
            </div>
          )}
          {(vehicle.progress !== undefined || vehicle.etaMinutes !== undefined) && (
            <div className="text-[10px] text-cyan-300 font-mono mt-1 border-t border-white/10 pt-1 flex items-center justify-between gap-2">
              <span>{Math.round((vehicle.progress || 0) * 100)}% progress</span>
              <span>ETA: {vehicle.etaMinutes ? `~${vehicle.etaMinutes}m` : (vehicle.etaText || "--")}</span>
            </div>
          )}
        </div>
      </Tooltip>
    </Marker>
  );
}

/**
 * Controller to trigger flyTo programmatically
 */
function FlyToController({ flyTo }) {
  const map = useMap();
  useEffect(() => {
    if (!flyTo) return;
    if (Array.isArray(flyTo) && flyTo.length >= 2) {
      map.flyTo([flyTo[0], flyTo[1]], 14, { duration: 1.2 });
    } else if (typeof flyTo.lat === "number" && typeof flyTo.lng === "number") {
      map.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom || 14, { duration: 1.2 });
    }
  }, [flyTo, map]);
  return null;
}

/**
 * Controller to smoothly follow a vehicle's moving position
 * During a trip with "Follow truck" on: smoothly pan to the truck at zoom 15.
 * Never auto-zoom on every position update when Follow is off.
 */
function FollowController({ followCoords, enabled = true }) {
  const map = useMap();
  const hasSetInitialZoomRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      hasSetInitialZoomRef.current = false;
      return;
    }
    if (!followCoords) return;
    const lat = Array.isArray(followCoords) ? followCoords[0] : followCoords.lat;
    const lng = Array.isArray(followCoords) ? followCoords[1] : followCoords.lng;
    if (typeof lat !== "number" || typeof lng !== "number") return;

    if (!hasSetInitialZoomRef.current) {
      hasSetInitialZoomRef.current = true;
      map.setView([lat, lng], 15, { animate: true, duration: 0.5 });
    } else {
      map.panTo([lat, lng], { animate: true, duration: 0.4 });
    }
  }, [followCoords, enabled, map]);
  return null;
}

/**
 * Controller to fit map view to specific coordinates (e.g. QARS best route, initial bounds)
 */
function FitBoundsController({ fitBoundsCoords }) {
  const map = useMap();
  const lastKeyRef = useRef(null);

  useEffect(() => {
    if (!fitBoundsCoords || !Array.isArray(fitBoundsCoords) || fitBoundsCoords.length < 2) return;
    const first = fitBoundsCoords[0];
    const mid = fitBoundsCoords[Math.floor(fitBoundsCoords.length / 2)];
    const last = fitBoundsCoords[fitBoundsCoords.length - 1];
    const key = `${fitBoundsCoords.length}-${first?.[0]}-${first?.[1]}-${mid?.[0]}-${mid?.[1]}-${last?.[0]}-${last?.[1]}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    try {
      const bounds = L.latLngBounds(fitBoundsCoords);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true, duration: 1.0 });
      }
    } catch (e) {
      console.warn("Could not fit route bounds:", e);
    }
  }, [fitBoundsCoords, map]);
  return null;
}

/**
 * Controller to fit map view to all routes
 */
function FitRoutesController({ fitToRoutes, routes }) {
  const map = useMap();
  useEffect(() => {
    if (!fitToRoutes || !routes || routes.length === 0) return;
    const allCoords = [];
    routes.forEach((r) => {
      const pts = r.coords || r.waypoints || [];
      pts.forEach((pt) => {
        if (Array.isArray(pt) && pt.length >= 2) allCoords.push(pt);
      });
    });

    if (allCoords.length > 1) {
      try {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } catch (e) {
        console.warn("Could not fit route bounds", e);
      }
    }
  }, [fitToRoutes, routes, map]);
  return null;
}

/**
 * Map Click Event Dispatcher
 */
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick(e.latlng);
    },
  });
  return null;
}

/**
 * Custom Bespoke Glass Zoom Controller
 */
function CustomZoomControls() {
  const map = useMap();
  return (
    <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-1.5 bg-slate-900/85 backdrop-blur-md border border-white/15 rounded-xl p-1 shadow-2xl">
      <button
        onClick={() => map.zoomIn()}
        aria-label="Zoom In"
        type="button"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-200 hover:text-white hover:bg-white/10 active:scale-95 transition"
      >
        <Plus size={16} />
      </button>
      <div className="h-[1px] bg-white/10 mx-1" />
      <button
        onClick={() => map.zoomOut()}
        aria-label="Zoom Out"
        type="button"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-200 hover:text-white hover:bg-white/10 active:scale-95 transition"
      >
        <Minus size={16} />
      </button>
    </div>
  );
}

/**
 * Main FleetMap Component
 */
export default function FleetMap({
  center = COIMBATORE_CENTER,
  zoom = 13,
  vehicles = [],
  routes = [],
  hazards = [],
  deliveries = [],
  selectedUid = null,
  flyTo = null,
  followCoords = null,
  followEnabled = true,
  fitToRoutes = false,
  fitBoundsCoords = null,
  onMapClick = null,
  onVehicleClick = null,
  height = "600px",
  showDepot = true,
  depotCoords = DEPOT_COORDS,
}) {
  const [activeLayer, setActiveLayer] = useState("satellite");
  const layerConfig = BASE_LAYERS[activeLayer] || BASE_LAYERS.satellite;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-glass-border shadow-2xl bg-slate-950"
      style={{ height }}
    >
      {/* Inline styles for pulse animations & Leaflet Glass theme overrides */}
      <style jsx global>{`
        .leaflet-container {
          background-color: #0a0b14 !important;
          font-family: inherit !important;
        }
        .leaflet-div-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-tooltip {
          background: rgba(10, 15, 30, 0.90) !important;
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 10px !important;
          color: #EDEEF7 !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6) !important;
          padding: 4px 8px !important;
        }
        .leaflet-tooltip-top:before {
          border-top-color: rgba(10, 15, 30, 0.90) !important;
        }
        .leaflet-tooltip-bottom:before {
          border-bottom-color: rgba(10, 15, 30, 0.90) !important;
        }
        .leaflet-control-attribution {
          background: rgba(10, 15, 30, 0.75) !important;
          backdrop-filter: blur(6px) !important;
          -webkit-backdrop-filter: blur(6px) !important;
          color: #94A3B8 !important;
          font-size: 10px !important;
          border-top-left-radius: 8px !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-right: none !important;
          border-bottom: none !important;
          padding: 2px 8px !important;
        }
        .leaflet-control-attribution a {
          color: #00E5FF !important;
          text-decoration: none !important;
        }
        @keyframes ripple-pulse {
          0% {
            transform: scale(0.95);
            opacity: 0.9;
          }
          70% {
            transform: scale(1.6);
            opacity: 0;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
        .emergency-pulse-ring {
          animation: ripple-pulse 1.8s cubic-bezier(0.24, 0, 0.38, 1) infinite;
        }
        .hazard-pulse-ring {
          animation: ripple-pulse 1.5s cubic-bezier(0.24, 0, 0.38, 1) infinite;
        }
        .depot-pulse-ring {
          animation: ripple-pulse 2.2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
        }
      `}</style>

      {/* Custom Glass Layer Switcher (Top-Right) */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/15 shadow-2xl">
        <div className="flex items-center gap-1 px-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:flex">
          <Layers size={13} className="text-primary" />
          <span>Layer</span>
        </div>
        {Object.values(BASE_LAYERS).map((layer) => {
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => setActiveLayer(layer.id)}
              className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-primary/25 border border-primary text-white shadow-lg shadow-primary/20"
                  : "bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {/* Thumbnail Swatch */}
              <span
                className={`w-3.5 h-3.5 rounded-full border ${
                  isActive ? "border-cyan-400 scale-110" : "border-white/30"
                }`}
                style={{ background: layer.thumbnail }}
              />
              <span>{layer.name}</span>
            </button>
          );
        })}
      </div>

      {/* Leaflet MapContainer */}
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        {/* Dynamic Tile Layer */}
        <TileLayer
          key={layerConfig.id}
          url={layerConfig.url}
          attribution={layerConfig.attribution}
          maxZoom={layerConfig.maxZoom || 19}
        />

        {/* Labels overlay for Satellite layer */}
        {layerConfig.labelsUrl && (
          <TileLayer
            key={`${layerConfig.id}-labels`}
            url={layerConfig.labelsUrl}
            attribution=""
            maxZoom={19}
          />
        )}

        {/* Controllers */}
        <FlyToController flyTo={flyTo} />
        <FollowController followCoords={followCoords} enabled={followEnabled} />
        <FitRoutesController fitToRoutes={fitToRoutes} routes={routes} />
        <FitBoundsController fitBoundsCoords={fitBoundsCoords} />
        <MapClickHandler onMapClick={onMapClick} />
        <CustomZoomControls />

        {/* Depot Marker */}
        {showDepot && (
          <Marker position={depotCoords} icon={createDepotDivIcon()}>
            <Tooltip direction="top" offset={[0, -18]} opacity={1}>
              <div className="font-semibold text-xs text-cyan-300">
                KovaiSwift Logistics Depot
              </div>
              <div className="text-[10px] text-slate-300">
                Peelamedu Central Operations Hub
              </div>
            </Tooltip>
          </Marker>
        )}

        {/* Polylines for Routes */}
        {routes.map((route) => {
          const coords = route.coords || route.waypoints || [];
          if (!coords || coords.length === 0) return null;
          const isHighlighted = !!route.highlighted || !!route.isHighlighted;
          const isDashed = route.dashed !== undefined ? !!route.dashed : !!route.isDashed;
          const routeColor = route.color || (isHighlighted ? "#00E5FF" : "#7C5CFF");
          const activeCoords = (route.remainingCoords && route.remainingCoords.length >= 2)
            ? route.remainingCoords
            : coords;

          return (
            <React.Fragment key={route.id || Math.random()}>
              {/* Thin dotted connector from delivery pin / requested start to snapped road start */}
              {route.snappedStart && (route.fromCoords || depotCoords) && (
                <Polyline
                  positions={[route.fromCoords || depotCoords, route.snappedStart]}
                  smoothFactor={0}
                  noClip={false}
                  pathOptions={{
                    color: "#94A3B8",
                    weight: 2,
                    dashArray: "3, 5",
                    opacity: 0.85,
                  }}
                />
              )}

              {/* Thin dotted connector from snapped road end to requested destination pin */}
              {route.snappedEnd && (route.toCoords || route.destinationCoords) && (
                <Polyline
                  positions={[route.snappedEnd, route.toCoords || route.destinationCoords]}
                  smoothFactor={0}
                  noClip={false}
                  pathOptions={{
                    color: "#94A3B8",
                    weight: 2,
                    dashArray: "3, 5",
                    opacity: 0.85,
                  }}
                />
              )}

              {/* Completed dim segment */}
              {route.completedCoords && route.completedCoords.length >= 2 && (
                <Polyline
                  positions={route.completedCoords}
                  smoothFactor={0}
                  noClip={false}
                  pathOptions={{
                    color: "#64748B",
                    weight: 3.5,
                    opacity: 0.35,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
              )}

              {/* Glow Polyline underneath for highlighted remaining route */}
              {isHighlighted && (
                <Polyline
                  positions={activeCoords}
                  smoothFactor={0}
                  noClip={false}
                  pathOptions={{
                    color: routeColor,
                    weight: 12,
                    opacity: 0.35,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
              )}
              {/* Foreground Polyline for remaining route */}
              <Polyline
                positions={activeCoords}
                smoothFactor={0}
                noClip={false}
                pathOptions={{
                  color: routeColor,
                  weight: isHighlighted ? 5 : 3.5,
                  opacity: route.opacity !== undefined ? route.opacity : (isHighlighted ? 0.95 : 0.75),
                  dashArray: isDashed ? "6, 8" : undefined,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              >
                {route.label && (
                  <Tooltip sticky direction="top" opacity={1}>
                    <div className="text-xs font-semibold text-white">
                      {route.label}
                    </div>
                  </Tooltip>
                )}
              </Polyline>
            </React.Fragment>
          );
        })}

        {/* Hazards: Circles + Centred DivIcons */}
        {hazards.map((hazard) => {
          const lat = hazard.lat ?? hazard.location?.lat;
          const lng = hazard.lng ?? hazard.location?.lng;
          if (typeof lat !== "number" || typeof lng !== "number") return null;

          const type = (hazard.type || "").toLowerCase();
          let circleColor = "#EF4444";
          if (type === "rain") circleColor = "#00E5FF";
          else if (type === "landslide") circleColor = "#FFB020";
          else if (type === "breakdown") circleColor = "#F59E0B";

          const radius = hazard.radiusM || 350;

          return (
            <React.Fragment key={hazard.id || Math.random()}>
              {/* Area boundary circle */}
              <Circle
                center={[lat, lng]}
                radius={radius}
                pathOptions={{
                  color: circleColor,
                  fillColor: circleColor,
                  fillOpacity: 0.22,
                  weight: 2,
                  dashArray: "4, 6",
                }}
              />
              {/* Centered DivIcon badge */}
              <Marker position={[lat, lng]} icon={createHazardDivIcon(hazard)}>
                <Tooltip direction="top" offset={[0, -18]} opacity={1}>
                  <div className="p-1 min-w-[130px]">
                    <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center justify-between gap-2">
                      <span>{hazard.type || "Hazard"}</span>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-danger/20 text-danger font-mono">
                        {hazard.severity || "Warning"}
                      </span>
                    </div>
                    {hazard.note && (
                      <div className="text-[11px] text-slate-300 mt-1">
                        {hazard.note}
                      </div>
                    )}
                    {hazard.roadName && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {hazard.roadName}
                      </div>
                    )}
                    <div className="text-[10px] text-cyan-400 font-mono mt-1">
                      Zone: {radius}m radius
                    </div>
                  </div>
                </Tooltip>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* Deliveries */}
        {deliveries.map((delivery) => {
          if (typeof delivery.lat !== "number" || typeof delivery.lng !== "number") {
            return null;
          }
          return (
            <Marker
              key={delivery.id || Math.random()}
              position={[delivery.lat, delivery.lng]}
              icon={createDeliveryDivIcon(delivery)}
            >
              <Tooltip direction="top" offset={[0, -12]} opacity={1}>
                <div className="p-1 min-w-[140px]">
                  <div className="text-xs font-bold text-white font-mono">
                    {delivery.code || "Delivery"}
                  </div>
                  {delivery.customerName && (
                    <div className="text-[11px] text-cyan-300 font-semibold mt-0.5">
                      {delivery.customerName}
                    </div>
                  )}
                  {delivery.cargo && (
                    <div className="text-[10px] text-slate-300 mt-0.5">
                      {delivery.cargo}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 capitalize mt-1 pt-1 border-t border-white/10 flex items-center justify-between">
                    <span>Priority: {delivery.priority || "Normal"}</span>
                    <span>{delivery.status || "open"}</span>
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* Vehicles with smooth requestAnimationFrame interpolation */}
        {vehicles.map((vehicle) => {
          const uid = vehicle.uid || vehicle.id;
          const isSelected = selectedUid === uid;
          return (
            <AnimatedVehicleMarker
              key={uid || Math.random()}
              vehicle={vehicle}
              isSelected={isSelected}
              onClick={onVehicleClick}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
