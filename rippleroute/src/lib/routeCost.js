/**
 * RippleRoute — Route Cost Evaluation Engine
 *
 * Evaluates route cost, hazard impact, and expected delay based on
 * real road geometry, active regional hazards, and live precipitation data.
 */

import { minDistanceToPolylineMeters } from "./geo";

const HAZARD_DELAYS = {
  accident: 30,
  roadblock: 35,
  landslide: 25,
  breakdown: 10,
  rain: 12,
  waterlogging: 12,
};

/**
 * Score a route against spatial hazards and rain points
 * @param {Object} route - Route candidate with coords [[lat, lng]] and durationS
 * @param {Array<Object>} [hazards=[]] - Active spatial hazards
 * @param {Array<Object>} [rainPoints=[]] - Measured precipitation points [{lat, lng, mm, code}]
 * @param {string} [priority="normal"] - Shipment priority level ("medical" | "food" | "normal")
 * @returns {{ cost: number, expectedDelayMin: number, etaMin: number, hits: Array<Object> }}
 */
export function routeCost(route, hazards = [], rainPoints = [], priority = "normal") {
  if (!route || !Array.isArray(route.coords) || route.coords.length < 2) {
    return { cost: Infinity, expectedDelayMin: 0, etaMin: 0, hits: [] };
  }

  const pLower = (priority || "").toLowerCase();
  const isPriority = pLower === "medical" || pLower === "food" || pLower === "perishable";
  const timeWeight = isPriority ? 1.6 : 1.0;
  const penaltyFactor = isPriority ? 1.4 : 1.0;

  const hits = [];
  let expectedDelayMin = 0;

  // 1. Evaluate active spatial hazards
  const activeHazards = (hazards || []).filter((h) => h && h.active !== false);
  for (const h of activeHazards) {
    const hLat = h.lat ?? h.location?.lat;
    const hLng = h.lng ?? h.location?.lng;
    if (typeof hLat !== "number" || typeof hLng !== "number") continue;

    const d = minDistanceToPolylineMeters({ lat: hLat, lng: hLng }, route.coords);
    const radiusM = h.radiusM || 300;

    if (d <= radiusM + 150) {
      const typeKey = (h.type || "hazard").toLowerCase();
      const delayMin = HAZARD_DELAYS[typeKey] ?? 15;
      expectedDelayMin += delayMin;
      hits.push({
        id: h.id,
        type: h.type || "hazard",
        note: h.note || `${h.type || "Hazard"} on route corridor`,
        distanceM: Math.round(d),
      });
    }
  }

  // 2. Evaluate precipitation rain points within 1000m
  const validRainPoints = (rainPoints || []).filter((p) => p && typeof p.mm === "number" && p.mm > 0.5);
  for (const rp of validRainPoints) {
    const rpLat = rp.lat;
    const rpLng = rp.lng;
    if (typeof rpLat !== "number" || typeof rpLng !== "number") continue;

    const d = minDistanceToPolylineMeters({ lat: rpLat, lng: rpLng }, route.coords);
    if (d <= 1000) {
      const rainDelay = Math.min(20, 4 + 3 * rp.mm);
      expectedDelayMin += rainDelay;
      hits.push({
        type: "rain",
        note: `Heavy rain / waterlogging (${rp.mm} mm/h)`,
        distanceM: Math.round(d),
      });
    }
  }

  expectedDelayMin = Math.round(expectedDelayMin * 10) / 10;

  const durationS = route.durationS || (route.duration ? route.duration * 60 : 0);
  const baseTravelMin = durationS / 60;
  const etaMin = Math.round((baseTravelMin + expectedDelayMin) * 10) / 10;

  // Total cost: etaMin * timeWeight + expectedDelayMin * (penaltyFactor - 1)
  const cost = Math.round((etaMin * timeWeight + expectedDelayMin * (penaltyFactor - 1)) * 10) / 10;

  return {
    cost,
    expectedDelayMin,
    etaMin,
    hits,
  };
}
