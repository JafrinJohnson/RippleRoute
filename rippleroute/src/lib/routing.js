/**
 * RippleRoute — Server-side Road Routing Service
 *
 * Calls real road routing engines (OpenRouteService with OSRM fallbacks).
 * ROAD RULE: Never generate straight or synthetic lines. Return [] on failure.
 */

import { toLatLng } from "./geo";

/**
 * Fetch real road routes for 2 or 3 waypoints
 * @param {Array<{lat: number, lng: number} | [number, number]>} points
 * @returns {Promise<Array<{id: string, coords: [number, number][], distanceM: number, durationS: number, source: "ors" | "osrm"}>>}
 */
export async function fetchRoadRoutes(points) {
  if (!Array.isArray(points) || points.length < 2) {
    return [];
  }

  const pts = points.map(toLatLng).filter(Boolean);
  if (pts.length < 2) {
    return [];
  }

  // 1. Try OpenRouteService if API key is provided
  const orsApiKey = process.env.ORS_API_KEY;
  if (orsApiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const requestBody = {
        coordinates: pts.map((p) => [p.lng, p.lat]),
      };

      if (pts.length === 2) {
        requestBody.alternative_routes = {
          target_count: 3,
          share_factor: 0.6,
          weight_factor: 1.6,
        };
      }

      const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
        method: "POST",
        headers: {
          Authorization: orsApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const features = data?.features;
        if (Array.isArray(features) && features.length > 0) {
          const routes = [];
          for (let i = 0; i < features.length; i++) {
            const feat = features[i];
            const rawCoords = feat.geometry?.coordinates;
            if (Array.isArray(rawCoords) && rawCoords.length >= 2) {
              const coords = rawCoords.map((c) => [c[1], c[0]]);
              routes.push({
                id: `ors-${i + 1}`,
                coords,
                distanceM: Math.round(feat.properties?.summary?.distance || 0),
                durationS: Math.round(feat.properties?.summary?.duration || 0),
                source: "ors",
              });
            }
          }
          if (routes.length > 0) {
            return routes;
          }
        }
      }
    } catch (e) {
      console.warn("OpenRouteService request failed or timed out, falling back to OSRM:", e?.message || e);
    }
  }

  // 2. Fallback to OSRM Public Servers
  const coordString = pts.map((p) => `${p.lng},${p.lat}`).join(";");
  const alternativesParam = pts.length === 2 ? "&alternatives=3" : "";

  const osrmEndpoints = [
    `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson${alternativesParam}`,
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${coordString}?overview=full&geometries=geojson${alternativesParam}`,
  ];

  for (const url of osrmEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "RippleRoute-Logistics/1.0",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.code === "Ok" && Array.isArray(data.routes) && data.routes.length > 0) {
          const routes = [];
          for (let i = 0; i < data.routes.length; i++) {
            const r = data.routes[i];
            const rawCoords = r.geometry?.coordinates;
            if (Array.isArray(rawCoords) && rawCoords.length >= 2) {
              const coords = rawCoords.map((c) => [c[1], c[0]]);
              routes.push({
                id: `osrm-${i + 1}`,
                coords,
                distanceM: Math.round(r.distance || 0),
                durationS: Math.round(r.duration || 0),
                source: "osrm",
              });
            }
          }
          if (routes.length > 0) {
            return routes;
          }
        }
      }
    } catch (e) {
      console.warn(`OSRM endpoint ${url} failed or timed out:`, e?.message || e);
    }
  }

  // If all live road routing calls fail, return [] (NEVER synthetic lines)
  return [];
}
