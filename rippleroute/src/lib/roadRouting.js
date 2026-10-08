/**
 * RippleRoute — Real Road Routing Service (OSRM)
 * 
 * ROAD RULE:
 * Every route line in the app comes from getRoadRoutes (real road geometry, overview=full)
 * and every moving vehicle moves only along its route with routeAnimator.
 * Never draw or animate straight or synthetic curved lines between start and end.
 */

import { haversineMeters } from "./geo";

// In-memory cache for OSRM route calculations
const routeCache = new Map();

// OSRM Public Endpoint Fallback List
const OSRM_SERVERS = [
  { name: "OSM", url: "https://router.project-osrm.org/route/v1/driving" },
  { name: "OSM-DE", url: "https://routing.openstreetmap.de/routed-car/route/v1/driving" },
];

/**
 * Fetch route from a specific OSRM server with timeout
 */
async function fetchOsrmRoute(serverUrl, coordString, alternatives, timeoutMs = 8000) {
  const altParam = alternatives ? 3 : "false";
  const endpoint = `${serverUrl}/${coordString}?overview=full&geometries=geojson&steps=false&alternatives=${altParam}`;
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`OSRM HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.code !== "Ok" || !Array.isArray(data.routes) || data.routes.length === 0) {
      throw new Error(`OSRM non-Ok code: ${data.code || "unknown"}`);
    }

    return {
      routes: data.routes,
      waypoints: data.waypoints || [],
    };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Primary road routing function
 * @param {{lat: number, lng: number}} from 
 * @param {{lat: number, lng: number}} to 
 * @param {{alternatives?: boolean, via?: {lat: number, lng: number}|null}} options 
 * @returns {Promise<Array<{id: string, coords: [number, number][], distanceM: number, durationS: number, source: string, snappedStart: [number, number], snappedEnd: [number, number], fromCoords: [number, number], toCoords: [number, number]}>>}
 */
export async function getRoadRoutes(from, to, { alternatives = true, via = null } = {}) {
  if (!from || !to || typeof from.lat !== "number" || typeof from.lng !== "number" || typeof to.lat !== "number" || typeof to.lng !== "number") {
    return [];
  }

  // Generate cache key
  const cacheKey = [
    from.lat.toFixed(5),
    from.lng.toFixed(5),
    to.lat.toFixed(5),
    to.lng.toFixed(5),
    alternatives ? "alt" : "single",
    via ? `${via.lat.toFixed(5)},${via.lng.toFixed(5)}` : "no-via",
  ].join(":");

  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey);
  }

  // Build OSRM coordinate string: "lng,lat;lng,lat" (GeoJSON / OSRM takes [lng, lat])
  const coordsList = [];
  coordsList.push(`${from.lng.toFixed(6)},${from.lat.toFixed(6)}`);
  if (via && typeof via.lat === "number" && typeof via.lng === "number") {
    coordsList.push(`${via.lng.toFixed(6)},${via.lat.toFixed(6)}`);
  }
  coordsList.push(`${to.lng.toFixed(6)},${to.lat.toFixed(6)}`);
  const coordString = coordsList.join(";");

  let rawResult = null;
  let usedServerName = "OSM";

  // Attempt servers in sequence
  for (const server of OSRM_SERVERS) {
    try {
      rawResult = await fetchOsrmRoute(server.url, coordString, alternatives, 8000);
      usedServerName = server.name;
      break;
    } catch (err) {
      console.warn(`[roadRouting] ${server.name} failed:`, err.message);
    }
  }

  // If all servers failed, return empty array (do NOT draw straight or synthetic lines)
  if (!rawResult || !Array.isArray(rawResult.routes) || rawResult.routes.length === 0) {
    return [];
  }

  const { routes: rawRoutes, waypoints } = rawResult;

  // Snapped road endpoints from OSRM waypoints: OSRM location is [lng, lat] -> convert to Leaflet [lat, lng]
  const snappedStart = waypoints && waypoints[0]?.location
    ? [waypoints[0].location[1], waypoints[0].location[0]]
    : [from.lat, from.lng];
  const snappedEnd = waypoints && waypoints[waypoints.length - 1]?.location
    ? [waypoints[waypoints.length - 1].location[1], waypoints[waypoints.length - 1].location[0]]
    : [to.lat, to.lng];

  // Parse OSRM GeoJSON geometry: GeoJSON coordinates are [lng, lat], convert exactly once to Leaflet [lat, lng]
  const parsedRoutes = rawRoutes.map((r, idx) => {
    const geoCoords = r.geometry?.coordinates || [];
    const latLngCoords = geoCoords.map(([lng, lat]) => [lat, lng]);
    const distanceM = Math.round(r.distance || 0);
    const durationS = Math.round(r.duration || 0);

    // Verify coordinate order: check start and end points
    if (latLngCoords.length >= 2) {
      const startDist = haversineMeters(from, latLngCoords[0]);
      const endDist = haversineMeters(to, latLngCoords[latLngCoords.length - 1]);
      if (startDist > 50 || endDist > 50) {
        console.error("route coords swapped");
      }
    }

    return {
      id: `road-${idx}-${distanceM}`,
      coords: latLngCoords,
      distanceM,
      durationS,
      source: "OSM",
      snappedStart,
      snappedEnd,
      fromCoords: [from.lat, from.lng],
      toCoords: [to.lat, to.lng],
    };
  });

  // Filter out any broken or empty routes
  const validRoutes = parsedRoutes.filter((r) => r.coords.length >= 2);

  // Cache results
  routeCache.set(cacheKey, validRoutes);
  return validRoutes;
}

/**
 * Clear routing cache (useful for testing or manual refresh)
 */
export function clearRouteCache() {
  routeCache.clear();
}
