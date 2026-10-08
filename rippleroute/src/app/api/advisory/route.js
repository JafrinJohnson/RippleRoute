import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// In-memory cache for 10 minutes: key -> { timestamp, data }
const advisoryCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

function getFallbackLines(hazardsOnRoute = [], maxRain = 0) {
  const enLines = [];
  const taLines = [];

  const types = (hazardsOnRoute || []).map((h) => (h?.type || "").toLowerCase());

  if (maxRain > 0.5 || types.includes("rain") || types.includes("waterlogging")) {
    enLines.push("Heavy rain within 1 km — reduce speed and keep extra distance.");
    taLines.push("1 கி.மீ.க்குள் கனமழை — வேகத்தைக் குறைத்து கூடுதல் இடைவெளி விடுங்கள்.");
  }

  if (types.includes("landslide")) {
    enLines.push("Landslide-risk zone ahead — avoid stopping on the ghat road.");
    taLines.push("முன்னால் நிலச்சரிவு அபாயப் பகுதி — மலைப்பாதையில் நிறுத்த வேண்டாம்.");
  }

  if (types.includes("accident") || types.includes("roadblock") || types.includes("congestion")) {
    enLines.push("Accident reported ahead — slow down and follow the new route.");
    taLines.push("முன்னால் விபத்து — வேகத்தைக் குறைத்து புதிய வழியைப் பின்பற்றுங்கள்.");
  }

  // Ensure exactly 2 lines
  if (enLines.length === 0) {
    enLines.push("Incident reported ahead — exercise caution along corridor.");
    taLines.push("முன்னால் இடையூறு — வழித்தடத்தில் கவனமாக செல்லவும்.");
  }

  if (enLines.length === 1) {
    enLines.push("Maintain safe cruising speed and monitor vehicle telemetry.");
    taLines.push("சீராக வேகத்தை பராமரித்து வாகன நிலையை கண்காணிக்கவும்.");
  }

  return {
    en: enLines.slice(0, 2),
    ta: taLines.slice(0, 2),
  };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { hazardsOnRoute = [], rain = [], lang = "en" } = body;

    const safeHazards = Array.isArray(hazardsOnRoute) ? hazardsOnRoute : [];
    const safeRain = Array.isArray(rain) ? rain : [];

    // Compute max rain mm
    let maxRain = 0;
    for (const r of safeRain) {
      const mm = typeof r?.mm === "number" ? r.mm : typeof r === "number" ? r : 0;
      if (mm > maxRain) maxRain = mm;
    }

    // 1. If no hazards and no rain > 0.5 mm: return clear template immediately without calling Gemini
    if (safeHazards.length === 0 && maxRain <= 0.5) {
      return NextResponse.json(
        {
          en: ["Route looks clear. Drive safe and keep to speed limits."],
          ta: ["வழி தெளிவாக உள்ளது. பாதுகாப்பாக, வேக வரம்பில் ஓட்டுங்கள்."],
          source: "template",
        },
        { status: 200 }
      );
    }

    // 2. Check memory cache (10 min TTL by hazard types + rounded rain)
    const sortedTypes = safeHazards
      .map((h) => (h?.type || "").toLowerCase())
      .sort()
      .join(",");
    const cacheKey = `${sortedTypes}|rain:${Math.round(maxRain)}`;

    const cached = advisoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data, { status: 200 });
    }

    // 3. Fallback helper if Gemini fails or API key missing
    const returnFallback = (reason) => {
      const fallback = getFallbackLines(safeHazards, maxRain);
      const resData = {
        en: fallback.en,
        ta: fallback.ta,
        source: "template",
      };
      advisoryCache.set(cacheKey, { timestamp: Date.now(), data: resData });
      return NextResponse.json(resData, { status: 200 });
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return returnFallback("Missing GEMINI_API_KEY");
    }

    // Build hazard description string
    const hazardDescList = safeHazards
      .map((h) => {
        const type = h.type || "hazard";
        const note = h.note ? ` (${h.note})` : "";
        const distKm =
          typeof h.distanceM === "number"
            ? ` at ${(h.distanceM / 1000).toFixed(1)} km`
            : "";
        return `${type}${note}${distKm}`;
      })
      .join(", ");

    const hazardDesc = hazardDescList || "none";
    const rainDesc = `${maxRain.toFixed(1)} mm/h`;

    const prompt = `You are a calm road-safety assistant for truck drivers in Coimbatore, Tamil Nadu. Hazards on or near the route: ${hazardDesc}. Rain: ${rainDesc}. Write exactly 2 short, practical, calm safety lines (max 18 words each). Reply only as JSON: {"en":["...","..."],"ta":["...","..."]}. The Tamil must be natural, correct Tamil script.`;

    const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";

    // Call Gemini with 10s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      let res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
        {
          method: "POST",
          headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              responseMimeType: "application/json",
            },
          }),
          signal: controller.signal,
        }
      );

      // If specified model returns 404, retry once with gemini-3.8-flash
      if (res.status === 404 && modelName !== "gemini-3.8-flash") {
        console.error("Gemini API error status:", res.status);
        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent`,
          {
            method: "POST",
            headers: {
              "x-goog-api-key": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.4,
                responseMimeType: "application/json",
              },
            }),
            signal: controller.signal,
          }
        );
      }

      clearTimeout(timeoutId);

      if (!res.ok) {
        // Log status code ONLY, NEVER the API key
        console.error("Gemini API error status:", res.status);
        return returnFallback("Gemini API error");
      }

      const json = await res.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText || typeof rawText !== "string") {
        return returnFallback("Empty response text");
      }

      // Safely parse JSON (strip markdown code fences if any)
      const cleanJsonStr = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

      let parsed = null;
      try {
        parsed = JSON.parse(cleanJsonStr);
      } catch (parseErr) {
        return returnFallback("JSON parse error");
      }

      if (
        !parsed ||
        !Array.isArray(parsed.en) ||
        !Array.isArray(parsed.ta) ||
        parsed.en.length === 0 ||
        parsed.ta.length === 0
      ) {
        return returnFallback("Invalid format");
      }

      const enStrings = parsed.en.filter((s) => typeof s === "string" && s.trim().length > 0).slice(0, 2);
      const taStrings = parsed.ta.filter((s) => typeof s === "string" && s.trim().length > 0).slice(0, 2);

      if (enStrings.length === 0 || taStrings.length === 0) {
        return returnFallback("No valid strings");
      }

      const responsePayload = {
        en: enStrings,
        ta: taStrings,
        source: "gemini",
      };

      // Cache for 10 minutes
      advisoryCache.set(cacheKey, { timestamp: Date.now(), data: responsePayload });

      return NextResponse.json(responsePayload, { status: 200 });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      console.error("Gemini fetch exception occurred");
      return returnFallback("Fetch timeout or failure");
    }
  } catch (err) {
    console.error("POST /api/advisory unhandled error");
    // Never 500
    const fallback = getFallbackLines([], 0);
    return NextResponse.json(
      {
        en: fallback.en,
        ta: fallback.ta,
        source: "template",
      },
      { status: 200 }
    );
  }
}
