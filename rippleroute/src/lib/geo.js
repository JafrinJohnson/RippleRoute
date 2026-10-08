/**
 * RippleRoute — Geospatial Distance & Geometry Helpers
 */

/**
 * Normalizes input to { lat, lng }
 * Accepts [lat, lng] or { lat, lng }
 */
export function toLatLng(p) {
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
 * Calculate distance in meters from point p to line segment between a and b
 * @param {[number, number] | {lat: number, lng: number}} p
 * @param {[number, number] | {lat: number, lng: number}} a
 * @param {[number, number] | {lat: number, lng: number}} b
 * @returns {number} distance in meters
 */
export function pointToSegmentMeters(p, a, b) {
  const pt = toLatLng(p);
  const ptA = toLatLng(a);
  const ptB = toLatLng(b);
  if (!pt || !ptA || !ptB) return Infinity;

  const latFactor = 111139;
  const midLatRad = (((ptA.lat + ptB.lat) / 2) * Math.PI) / 180;
  const lngFactor = 111139 * Math.cos(midLatRad);

  const dx = (ptB.lng - ptA.lng) * lngFactor;
  const dy = (ptB.lat - ptA.lat) * latFactor;
  const segLenSq = dx * dx + dy * dy;

  if (segLenSq === 0) {
    return haversineMeters(pt, ptA);
  }

  const px = (pt.lng - ptA.lng) * lngFactor;
  const py = (pt.lat - ptA.lat) * latFactor;

  const t = Math.max(0, Math.min(1, (px * dx + py * dy) / segLenSq));
  const closestLat = ptA.lat + t * (ptB.lat - ptA.lat);
  const closestLng = ptA.lng + t * (ptB.lng - ptA.lng);

  return haversineMeters(pt, { lat: closestLat, lng: closestLng });
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
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = pointToSegmentMeters(pt, polyline[i], polyline[i + 1]);
    if (d < minDist) {
      minDist = d;
    }
  }

  return Math.round(minDist);
}

/**
 * Calculate the total cumulative length of a polyline in meters
 * @param {Array<[number, number] | {lat: number, lng: number}>} coords
 * @returns {number} total length in meters
 */
export function polylineLengthMeters(coords) {
  if (!Array.isArray(coords) || coords.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    total += haversineMeters(coords[i], coords[i + 1]);
  }
  return Math.round(total);
}

/**
 * Evenly sample n points along a polyline by cumulative path distance
 * @param {Array<[number, number] | {lat: number, lng: number}>} coords
 * @param {number} n
 * @returns {Array<{lat: number, lng: number}>}
 */
export function samplePolyline(coords, n = 5) {
  if (!Array.isArray(coords) || coords.length === 0 || n <= 0) return [];
  const normalized = coords.map(toLatLng).filter(Boolean);
  if (normalized.length === 0) return [];
  if (normalized.length <= n) return normalized;
  if (n === 1) return [normalized[0]];

  // Build cumulative distances array
  const cumDists = [0];
  for (let i = 0; i < normalized.length - 1; i++) {
    const d = haversineMeters(normalized[i], normalized[i + 1]);
    cumDists.push(cumDists[i] + d);
  }

  const totalDist = cumDists[cumDists.length - 1];
  if (totalDist === 0) {
    return Array(n).fill(normalized[0]);
  }

  const step = totalDist / (n - 1);
  const samples = [];
  let segIdx = 0;

  for (let k = 0; k < n; k++) {
    const targetDist = k * step;
    while (segIdx < cumDists.length - 2 && cumDists[segIdx + 1] < targetDist) {
      segIdx++;
    }

    const segStartDist = cumDists[segIdx];
    const segEndDist = cumDists[segIdx + 1];
    const segSpan = segEndDist - segStartDist;

    if (segSpan === 0) {
      samples.push(normalized[segIdx]);
    } else {
      const t = Math.max(0, Math.min(1, (targetDist - segStartDist) / segSpan));
      const p1 = normalized[segIdx];
      const p2 = normalized[segIdx + 1];
      samples.push({
        lat: Number((p1.lat + t * (p2.lat - p1.lat)).toFixed(6)),
        lng: Number((p1.lng + t * (p2.lng - p1.lng)).toFixed(6)),
      });
    }
  }

  return samples;
}
