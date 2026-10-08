/**
 * RippleRoute — Real Road Routing Service (OSRM)
 * 
 * ROAD RULE:
 * Every route line in the app comes from getRoadRoutes (real road geometry, overview=full)
 * and every moving vehicle moves only along its route with routeAnimator.
 * Never draw or animate straight lines between start and end.
 */

// In-memory cache for OSRM route calculations
const routeCache = new Map();

// OSRM Public Endpoint Fallback List
const OSRM_SERVERS = [
  { name: "osrm-project", url: "https://router.project-osrm.org/route/v1/driving" },
  { name: "osm-de", url: "https://routing.openstreetmap.de/routed-car/route/v1/driving" },
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

    return data.routes;
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
 * @returns {Promise<Array<{id: string, coords: [number, number][], distanceM: number, durationS: number, source: string}>>}
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

  // Build OSRM coordinate string: "lng,lat;lng,lat" (with via in the middle if specified)
  const coordsList = [];
  coordsList.push(`${from.lng.toFixed(6)},${from.lat.toFixed(6)}`);
  if (via && typeof via.lat === "number" && typeof via.lng === "number") {
    coordsList.push(`${via.lng.toFixed(6)},${via.lat.toFixed(6)}`);
  }
  coordsList.push(`${to.lng.toFixed(6)},${to.lat.toFixed(6)}`);
  const coordString = coordsList.join(";");

  let rawRoutes = null;
  let usedServer = null;

  // Attempt servers in sequence
  for (const server of OSRM_SERVERS) {
    try {
      rawRoutes = await fetchOsrmRoute(server.url, coordString, alternatives, 8000);
      usedServer = server.name;
      break;
    } catch (err) {
      console.warn(`[roadRouting] ${server.name} failed:`, err.message);
    }
  }

  // If both servers failed, return empty array (do NOT draw straight lines)
  if (!rawRoutes || rawRoutes.length === 0) {
    return [];
  }

  // Parse OSRM GeoJSON geometry: GeoJSON coordinates are [lng, lat], convert to [lat, lng]
  const parsedRoutes = rawRoutes.map((r, idx) => {
    const geoCoords = r.geometry?.coordinates || [];
    const latLngCoords = geoCoords.map(([lng, lat]) => [lat, lng]);
    const distanceM = Math.round(r.distance || 0);
    const durationS = Math.round(r.duration || 0);

    return {
      id: `road-${idx}-${distanceM}`,
      coords: latLngCoords,
      distanceM,
      durationS,
      source: usedServer,
    };
  });

  // Filter out any broken or empty routes
  let validRoutes = parsedRoutes.filter((r) => r.coords.length >= 2);

  // If fewer than 2 alternatives came back and alternatives was requested,
  // request extra road routes through 1-2 via-points offset ~1.5 km to each side of the midpoint
  if (alternatives && validRoutes.length < 2 && !via) {
    try {
      const midLat = (from.lat + to.lat) / 2;
      const midLng = (from.lng + to.lng) / 2;
      const dLat = to.lat - from.lat;
      const dLng = to.lng - from.lng;
      const len = Math.sqrt(dLat * dLat + dLng * dLng) || 0.0001;

      // Perpendicular unit vector (-dLng, dLat)
      const perpLat = -dLng / len;
      const perpLng = dLat / len;

      // ~1.5 km offset (approx. 0.0135 degrees)
      const offsetDeg = 0.0135;
      const viaLeft = { lat: midLat + perpLat * offsetDeg, lng: midLng + perpLng * offsetDeg };
      const viaRight = { lat: midLat - perpLat * offsetDeg, lng: midLng - perpLng * offsetDeg };

      const extraPromises = [
        getRoadRoutes(from, to, { alternatives: false, via: viaLeft }),
        getRoadRoutes(from, to, { alternatives: false, via: viaRight }),
      ];

      const extraResults = await Promise.allSettled(extraPromises);
      for (const res of extraResults) {
        if (res.status === "fulfilled" && Array.isArray(res.value)) {
          for (const extraRoute of res.value) {
            // Check for duplicate routes by distance (within 80m difference)
            const isDuplicate = validRoutes.some(
              (existing) => Math.abs(existing.distanceM - extraRoute.distanceM) < 80
            );
            if (!isDuplicate && extraRoute.coords.length >= 2) {
              validRoutes.push(extraRoute);
            }
          }
        }
      }
    } catch (err) {
      console.warn("[roadRouting] Failed synthesizing via-point alternatives:", err.message);
    }
  }

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
