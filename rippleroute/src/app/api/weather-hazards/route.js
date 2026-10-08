import { NextResponse } from "next/server";
import { getRainPoints } from "@/lib/weather";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { points = [] } = body;

    if (!Array.isArray(points) || points.length === 0) {
      return NextResponse.json({ hazards: [] }, { status: 200 });
    }

    // Max 8 points
    const safePoints = points.slice(0, 8);
    const rainPoints = await getRainPoints(safePoints, 8).catch(() => []);

    const hazards = [];
    for (const p of rainPoints) {
      const mm = typeof p?.mm === "number" ? p.mm : 0;
      const lat = Number(p?.lat);
      const lng = Number(p?.lng);

      if (mm >= 2 && !isNaN(lat) && !isNaN(lng)) {
        hazards.push({
          id: `rain-${lat.toFixed(3)}-${lng.toFixed(3)}`,
          type: "rain",
          lat,
          lng,
          radiusM: 1000,
          severity: mm >= 7 ? "high" : "medium",
          note: `Heavy rain (${mm} mm/h)`,
          source: "open-meteo",
        });
      }
    }

    return NextResponse.json({ hazards }, { status: 200 });
  } catch (err) {
    console.error("POST /api/weather-hazards error:", err?.message || err);
    // Never throw / never 500
    return NextResponse.json({ hazards: [] }, { status: 200 });
  }
}
