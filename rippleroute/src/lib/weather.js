/**
 * RippleRoute — Live Weather & Precipitation Telemetry
 *
 * Queries Open-Meteo for real-time precipitation and weather codes.
 */

import { toLatLng } from "./geo";

/**
 * Fetch precipitation and weather codes for up to 5 points
 * @param {Array<{lat: number, lng: number} | [number, number]>} points
 * @returns {Promise<Array<{lat: number, lng: number, mm: number, code: number}>>}
 */
export async function getRainPoints(points, maxPoints = 8) {
  if (!Array.isArray(points) || points.length === 0) {
    return [];
  }

  const pts = points.map(toLatLng).filter((p) => p && !isNaN(p.lat) && !isNaN(p.lng)).slice(0, maxPoints || 8);
  if (pts.length === 0) {
    return [];
  }

  const promises = pts.map(async (pt) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${pt.lat.toFixed(4)}&longitude=${pt.lng.toFixed(4)}&current=precipitation,weather_code`;
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      const current = data?.current;

      return {
        lat: pt.lat,
        lng: pt.lng,
        mm: typeof current?.precipitation === "number" ? current.precipitation : 0,
        code: typeof current?.weather_code === "number" ? current.weather_code : 0,
      };
    } catch (e) {
      console.warn(`Weather fetch failed for [${pt.lat}, ${pt.lng}]:`, e?.message || e);
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  });

  const results = await Promise.allSettled(promises);
  const rainPoints = [];

  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      rainPoints.push(r.value);
    }
  }

  return rainPoints;
}
