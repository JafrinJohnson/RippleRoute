/**
 * RippleRoute — Real Road Path & Vehicle Animator
 * 
 * Precomputes cumulative distances along polyline roads and enables
 * exact along-the-road interpolation and bearing calculation.
 */

const EARTH_RADIUS_M = 6371000;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

/**
 * Great-circle distance between two [lat, lng] points in meters
 */
export function haversineDistanceM(p1, p2) {
  if (!p1 || !p2) return 0;
  const lat1 = p1[0];
  const lng1 = p1[1];
  const lat2 = p2[0];
  const lng2 = p2[1];

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/**
 * Calculate initial compass bearing from p1 to p2 in degrees [0, 360)
 */
export function calculateBearing(p1, p2) {
  if (!p1 || !p2) return 0;
  const φ1 = toRad(p1[0]);
  const φ2 = toRad(p2[0]);
  const Δλ = toRad(p2[1] - p1[1]);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

/**
 * Precompute cumulative distance array along a route coordinate array
 * @param {[number, number][]} coords Array of [lat, lng] pairs
 * @returns {{coords: [number, number][], cumDistances: number[], totalDistance: number}}
 */
export function buildPath(coords) {
  if (!Array.isArray(coords) || coords.length === 0) {
    return { coords: [], cumDistances: [0], totalDistance: 0 };
  }

  if (coords.length === 1) {
    return { coords, cumDistances: [0], totalDistance: 0 };
  }

  const cumDistances = [0];
  let totalDistance = 0;

  for (let i = 1; i < coords.length; i++) {
    const dist = haversineDistanceM(coords[i - 1], coords[i]);
    totalDistance += dist;
    cumDistances.push(totalDistance);
  }

  return {
    coords,
    cumDistances,
    totalDistance,
  };
}

/**
 * Get exact interpolated {lat, lng, heading} at distance d along the road path
 * @param {{coords: [number, number][], cumDistances: number[], totalDistance: number}} path
 * @param {number} d Distance in meters from start
 * @returns {{lat: number, lng: number, heading: number}}
 */
export function pointAtDistance(path, d) {
  if (!path || !Array.isArray(path.coords) || path.coords.length === 0) {
    return { lat: 0, lng: 0, heading: 0 };
  }

  const { coords, cumDistances, totalDistance } = path;

  if (coords.length === 1) {
    return { lat: coords[0][0], lng: coords[0][1], heading: 0 };
  }

  // Before route start
  if (d <= 0) {
    const heading = calculateBearing(coords[0], coords[1]);
    return { lat: coords[0][0], lng: coords[0][1], heading };
  }

  // After route end
  if (d >= totalDistance) {
    const lastIdx = coords.length - 1;
    const heading = calculateBearing(coords[lastIdx - 1], coords[lastIdx]);
    return { lat: coords[lastIdx][0], lng: coords[lastIdx][1], heading };
  }

  // Binary search for segment where cumDistances[i] <= d <= cumDistances[i + 1]
  let low = 0;
  let high = cumDistances.length - 1;
  let segmentIdx = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (cumDistances[mid] <= d) {
      segmentIdx = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const i = Math.min(segmentIdx, coords.length - 2);
  const p1 = coords[i];
  const p2 = coords[i + 1];
  const segStart = cumDistances[i];
  const segEnd = cumDistances[i + 1];
  const segLen = segEnd - segStart;

  const t = segLen > 0 ? (d - segStart) / segLen : 0;
  const lat = p1[0] + (p2[0] - p1[0]) * t;
  const lng = p1[1] + (p2[1] - p1[1]) * t;
  const heading = calculateBearing(p1, p2);

  return { lat, lng, heading };
}

/**
 * Step distance along the road line given speed and demo multiplier
 * @param {number} currentDistM Current distance in meters
 * @param {number} speedKmh Vehicle speed in km/h (e.g. 40)
 * @param {number} multiplier Demo speed acceleration multiplier (e.g. 8)
 * @param {number} deltaSeconds Elapsed step time in seconds (e.g. 1)
 * @param {number} totalDistance Total route length in meters
 * @param {boolean} loop Whether to loop back to 0 at the end
 * @returns {number} New distance along the route in meters
 */
export function advanceRouteDistance(
  currentDistM,
  speedKmh = 40,
  multiplier = 8,
  deltaSeconds = 1,
  totalDistance = 1000,
  loop = true
) {
  const speedMps = (speedKmh * 1000) / 3600; // m/s
  const stepM = speedMps * multiplier * deltaSeconds;
  let newDist = currentDistM + stepM;

  if (newDist >= totalDistance) {
    return loop ? (totalDistance > 0 ? newDist % totalDistance : 0) : totalDistance;
  }

  return newDist;
}
