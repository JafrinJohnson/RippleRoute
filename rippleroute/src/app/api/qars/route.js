import { NextResponse } from "next/server";
import { haversineMeters, pointToSegmentMeters, samplePolyline, toLatLng } from "@/lib/geo";
import { qpso } from "@/lib/qpso";
import { routeCost } from "@/lib/routeCost";
import { fetchRoadRoutes } from "@/lib/routing";
import { getRainPoints } from "@/lib/weather";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function hashCoords(p1, p2) {
  const str = `${Number(p1.lat).toFixed(5)},${Number(p1.lng).toFixed(5)}->${Number(p2.lat).toFixed(5)},${Number(p2.lng).toFixed(5)}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export async function POST(request) {
  let body = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch (e) {
    body = {};
  }

  const { from, to, routes = [], hazards = [], priority = "normal" } = body;
  const fromPt = toLatLng(from);
  const toPt = toLatLng(to);

  // Safety fallback builder in case of any failures
  const buildFallbackResponse = (candList, errMsg) => {
    const scored = (candList || []).map((r) => {
      const hits = [];
      const dur = r.durationS || 1200;
      return {
        ...r,
        cost: dur,
        expectedDelayMin: 0,
        etaMin: Math.round(dur / 60),
        hits,
      };
    });

    // Best = candidate with the fewest hits
    let fallbackBest = null;
    if (scored.length > 0) {
      fallbackBest = scored.slice().sort((a, b) => (a.hits?.length || 0) - (b.hits?.length || 0))[0];
    }
    const flatHistory = Array(60).fill(fallbackBest ? Math.round(fallbackBest.etaMin) : 25);

    return NextResponse.json(
      {
        best: fallbackBest,
        candidates: scored,
        baselineDelayMin: fallbackBest ? fallbackBest.etaMin : 0,
        bestDelayMin: fallbackBest ? fallbackBest.etaMin : 0,
        timeSavedMin: 0,
        convergence: flatHistory,
        rain: [],
        engine: "QPSO",
        particles: 30,
        iterations: 60,
        error: errMsg || undefined,
      },
      { status: 200 }
    );
  };

  try {
    if (!Array.isArray(routes) || routes.length === 0 || !fromPt || !toPt) {
      return buildFallbackResponse(routes, "No candidate routes provided for optimization");
    }

    // a) Sample 5 points across candidate routes and fetch precipitation data
    const allCoords = routes.flatMap((r) => r.coords || []);
    const samplePts = allCoords.length >= 2 ? samplePolyline(allCoords, 5) : [fromPt, toPt];
    const rainPoints = await getRainPoints(samplePts).catch(() => []);

    // b) Score every candidate route using routeCost
    const activeHazards = (hazards || []).filter((h) => h && h.active !== false);
    const scoredCandidates = routes.map((r) => {
      const score = routeCost(r, activeHazards, rainPoints, priority);
      return {
        ...r,
        cost: score.cost,
        expectedDelayMin: score.expectedDelayMin,
        etaMin: score.etaMin,
        hits: score.hits,
      };
    });

    // c) Configure and run QPSO in continuous space for detour via-point
    const pLower = (priority || "").toLowerCase();
    const isPriority = pLower === "medical" || pLower === "food" || pLower === "perishable";
    const timeWeight = isPriority ? 1.6 : 1.0;
    const penaltyFactor = isPriority ? 1.4 : 1.0;

    // Bounding box of from, to, and nearby hazards expanded 15% (min 0.02° each side)
    const lats = [fromPt.lat, toPt.lat];
    const lngs = [fromPt.lng, toPt.lng];

    for (const h of activeHazards) {
      const hLat = h.lat ?? h.location?.lat;
      const hLng = h.lng ?? h.location?.lng;
      if (typeof hLat === "number" && typeof hLng === "number") {
        lats.push(hLat);
        lngs.push(hLng);
      }
    }

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const spanLat = maxLat - minLat;
    const spanLng = maxLng - minLng;
    const padLat = Math.max(spanLat * 0.15, 0.02);
    const padLng = Math.max(spanLng * 0.15, 0.02);

    const qpsoBounds = [
      [minLat - padLat, maxLat + padLat],
      [minLng - padLng, maxLng + padLng],
    ];

    // Mathematical fitness function for via-point [viaLat, viaLng]
    const fitness = ([viaLat, viaLng]) => {
      const d1Km = haversineMeters(fromPt, { lat: viaLat, lng: viaLng }) / 1000;
      const d2Km = haversineMeters({ lat: viaLat, lng: viaLng }, toPt) / 1000;
      const travelMin = ((d1Km + d2Km) / 35) * 60;

      let hazardPenaltyMin = 0;
      for (const h of activeHazards) {
        const hPt = { lat: h.lat ?? h.location?.lat, lng: h.lng ?? h.location?.lng };
        if (typeof hPt.lat !== "number" || typeof hPt.lng !== "number") continue;
        const radiusThreshold = (h.radiusM || 300) + 150;

        const d1 = pointToSegmentMeters(hPt, fromPt, { lat: viaLat, lng: viaLng });
        const d2 = pointToSegmentMeters(hPt, { lat: viaLat, lng: viaLng }, toPt);

        if (d1 <= radiusThreshold || d2 <= radiusThreshold) {
          hazardPenaltyMin += 40 * penaltyFactor;
        }
      }

      return travelMin * timeWeight + hazardPenaltyMin;
    };

    // Direct straight baseline fitness
    const directDistKm = haversineMeters(fromPt, toPt) / 1000;
    const directTravelMin = (directDistKm / 35) * 60;
    let directHazardPenalty = 0;
    for (const h of activeHazards) {
      const hPt = { lat: h.lat ?? h.location?.lat, lng: h.lng ?? h.location?.lng };
      if (typeof hPt.lat !== "number" || typeof hPt.lng !== "number") continue;
      if (pointToSegmentMeters(hPt, fromPt, toPt) <= (h.radiusM || 300) + 150) {
        directHazardPenalty += 40 * penaltyFactor;
      }
    }
    const directFitness = directTravelMin * timeWeight + directHazardPenalty;

    // Run QPSO with 30 particles across 60 iterations with deterministic seed
    const qpsoResult = qpso({
      dim: 2,
      bounds: qpsoBounds,
      fitness,
      particles: 30,
      iterations: 60,
      seed: hashCoords(fromPt, toPt),
    });

    // d) If QPSO via-point beats direct straight fitness, fetch and score the REAL road detour
    if (qpsoResult.bestFitness < directFitness && Array.isArray(qpsoResult.best)) {
      const via = { lat: qpsoResult.best[0], lng: qpsoResult.best[1] };
      try {
        const detourRoutes = await fetchRoadRoutes([fromPt, via, toPt]);
        if (Array.isArray(detourRoutes) && detourRoutes.length > 0) {
          const detour = detourRoutes[0];
          if (detour.coords && detour.coords.length >= 2) {
            const score = routeCost(detour, activeHazards, rainPoints, priority);
            scoredCandidates.push({
              ...detour,
              id: "qars-detour",
              label: "QARS detour",
              cost: score.cost,
              expectedDelayMin: score.expectedDelayMin,
              etaMin: score.etaMin,
              hits: score.hits,
            });
          }
        }
      } catch (detourErr) {
        console.warn("QARS Detour road fetching skipped:", detourErr?.message || detourErr);
      }
    }

    // e) Identify best route (lowest cost) and baseline route (smallest durationS among original candidates)
    let best = scoredCandidates[0];
    for (let i = 1; i < scoredCandidates.length; i++) {
      if (scoredCandidates[i].cost < best.cost) {
        best = scoredCandidates[i];
      }
    }

    // Baseline route is what a standard GPS / navigation engine picks (free-flow shortest durationS)
    let baseline = scoredCandidates[0];
    for (let i = 1; i < routes.length; i++) {
      const cand = scoredCandidates[i];
      if (cand && (cand.durationS || Infinity) < (baseline.durationS || Infinity)) {
        baseline = cand;
      }
    }

    // f) Compute delay and delta metrics
    const baselineDelayMin = baseline.expectedDelayMin ?? 0;
    const bestDelayMin = best.expectedDelayMin ?? 0;
    const timeSavedMin = Math.max(0, Math.round(baseline.etaMin - best.etaMin));

    return NextResponse.json(
      {
        best,
        candidates: scoredCandidates,
        baselineDelayMin,
        bestDelayMin,
        timeSavedMin,
        convergence: qpsoResult.history,
        rain: rainPoints,
        engine: "QPSO",
        particles: 30,
        iterations: 60,
        bestFitness: qpsoResult.bestFitness,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /api/qars handler error:", err);
    // Never return 500 per architectural rule
    return buildFallbackResponse(routes, err?.message || "QARS optimization failed");
  }
}
