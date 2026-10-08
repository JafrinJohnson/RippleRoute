/**
 * RippleRoute — Geospatial Distance & Geometry Helpers
 */

/**
 * Normalizes input to { lat, lng }
 * Accepts [lat, lng] or { lat, lng }
 */
function toLatLng(p) {
  if (!p) return null;
  if (Array.isArray(p)) {
    return { lat: Number(p[0]), lng: Number(p[1]) };
  }
  return { lat: Number(p.lat), lng: Number(p.lng) };
}

/**
 * Calculate the great-circle distance between two points in meters using Haversine formula
 * @param {[number, number] | {lat: number, lng: number}} p1
 * @param {[number, number] | {lat: number, lng: number}} p2
 * @returns {number} distance in meters
 */
export function haversineMeters(p1, p2) {
  const pt1 = toLatLng(p1);
  const pt2 = toLatLng(p2);
  if (!pt1 || !pt2 || isNaN(pt1.lat) || isNaN(pt1.lng) || isNaN(pt2.lat) || isNaN(pt2.lng)) {
    return Infinity;
  }

  const R = 6371000; // Earth radius in meters
  const dLat = ((pt2.lat - pt1.lat) * Math.PI) / 180;
  const dLng = ((pt2.lng - pt1.lng) * Math.PI) / 180;
  const lat1 = (pt1.lat * Math.PI) / 180;
  const lat2 = (pt2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Calculate the minimum distance in meters from a point to a polyline
 * @param {[number, number] | {lat: number, lng: number}} point
 * @param {Array<[number, number] | {lat: number, lng: number}>} polyline
 * @returns {number} minimum distance in meters
 */
export function minDistanceToPolylineMeters(point, polyline) {
  const pt = toLatLng(point);
  if (!pt || !Array.isArray(polyline) || polyline.length === 0) {
    return Infinity;
  }

  if (polyline.length === 1) {
    return haversineMeters(pt, polyline[0]);
  }

  let minDist = Infinity;

  // Local meters conversion constant per degree lat ~ 111,139 m
  const latFactor = 111139;

  for (let i = 0; i < polyline.length - 1; i++) {
    const a = toLatLng(polyline[i]);
    const b = toLatLng(polyline[i + 1]);
    if (!a || !b) continue;

    const midLatRad = ((a.lat + b.lat) / 2 * Math.PI) / 180;
    const lngFactor = 111139 * Math.cos(midLatRad);

    // Coordinate offsets in meters
    const dx = (b.lng - a.lng) * lngFactor;
    const dy = (b.lat - a.lat) * latFactor;
    const segLenSq = dx * dx + dy * dy;

    if (segLenSq === 0) {
      const d = haversineMeters(pt, a);
      if (d < minDist) minDist = d;
      continue;
    }

    // Vector from A to P in meters
    const px = (pt.lng - a.lng) * lngFactor;
    const py = (pt.lat - a.lat) * latFactor;

    // Project point onto line segment clamped to [0, 1]
    const t = Math.max(0, Math.min(1, (px * dx + py * dy) / segLenSq));

    // Closest point in lat/lng
    const closestLat = a.lat + t * (b.lat - a.lat);
    const closestLng = a.lng + t * (b.lng - a.lng);

    const dist = haversineMeters(pt, { lat: closestLat, lng: closestLng });
    if (dist < minDist) {
      minDist = dist;
    }
  }

  return Math.round(minDist);
}
