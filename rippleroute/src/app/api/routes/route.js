import { NextResponse } from "next/server";
import { fetchRoadRoutes } from "@/lib/routing";
import { minDistanceToPolylineMeters, samplePolyline } from "@/lib/geo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function isDuplicateRoute(cand, existingRoutes) {
  return existingRoutes.some((r) => {
    const d1 = r.distanceM || 0;
    const d2 = cand.distanceM || 0;
    const maxD = Math.max(d1, d2);
    if (maxD > 0 && Math.abs(d1 - d2) / maxD >= 0.03) {
      return false;
    }
    const samples = samplePolyline(cand.coords, 20);
    if (!samples.length) return false;
    let sharedCount = 0;
    for (const pt of samples) {
      if (minDistanceToPolylineMeters(pt, r.coords) <= 50) {
        sharedCount++;
      }
    }
    return sharedCount / samples.length > 0.85;
  });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { from, to } = body;

    const lat1 = Number(from?.lat);
    const lng1 = Number(from?.lng);
    const lat2 = Number(to?.lat);
    const lng2 = Number(to?.lng);

    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
      return NextResponse.json(
        { routes: [], error: "Invalid 'from' or 'to' geographic coordinates" },
        { status: 200 }
      );
    }

    const startPt = { lat: lat1, lng: lng1 };
    const endPt = { lat: lat2, lng: lng2 };

    // 1. Fetch direct candidate road routes
    let routes = await fetchRoadRoutes([startPt, endPt]);

    // 2. If fewer than 3, add real road alternatives via perpendicular offset via-points
    if (routes.length < 3) {
      const midLat = (lat1 + lat2) / 2;
      const midLng = (lng1 + lng2) / 2;
      const midLatRad = (midLat * Math.PI) / 180;
      const dX = (lng2 - lng1) * 111139 * Math.cos(midLatRad);
      const dY = (lat2 - lat1) * 111139;
      const len = Math.sqrt(dX * dX + dY * dY);

      if (len > 0) {
        // Perpendicular unit vector
        const perpX = -dY / len;
        const perpY = dX / len;

        // Try offsets between 1.5 km and 2.5 km (left and right)
        const offsetsM = [1800, -1800, 2400, -2400, 1500, -1500];

        for (const distM of offsetsM) {
          if (routes.length >= 3) break;

          const viaLat = midLat + (perpY * distM) / 111139;
          const viaLng = midLng + (perpX * distM) / (111139 * Math.cos(midLatRad));

          try {
            const viaCandidates = await fetchRoadRoutes([
              startPt,
              { lat: viaLat, lng: viaLng },
              endPt,
            ]);

            for (const cand of viaCandidates) {
              if (routes.length >= 3) break;

              const isDuplicate = isDuplicateRoute(cand, routes);

              if (!isDuplicate && cand.coords && cand.coords.length >= 2) {
                routes.push({
                  ...cand,
                  id: `alt-${routes.length + 1}`,
                });
              }
            }
          } catch (viaErr) {
            console.warn("Alternative via-point routing failed:", viaErr?.message || viaErr);
          }
        }
      }
    }

    // Attach route labels
    const labeledRoutes = routes.map((r, idx) => ({
      ...r,
      id: r.id || `route-${idx + 1}`,
      label: `Route ${String.fromCharCode(65 + idx)}`,
    }));

    return NextResponse.json({ routes: labeledRoutes }, { status: 200 });
  } catch (err) {
    console.error("POST /api/routes handler error:", err);
    // Never return 500 per architectural rule
    return NextResponse.json(
      { routes: [], error: err?.message || "Route planning failed" },
      { status: 200 }
    );
  }
}
