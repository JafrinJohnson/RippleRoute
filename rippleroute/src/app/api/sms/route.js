export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/sms
 * Dispatches real SMS notifications via Twilio REST API.
 * 
 * Body: { to: string, body: string, deliveryCode: string }
 */
export async function POST(request) {
  try {
    let payload = {};
    try {
      payload = await request.json();
    } catch (_) {
      return Response.json({ ok: false, error: "invalidRequest" }, { status: 200 });
    }

    const { to, body, deliveryCode } = payload || {};

    // 1. Normalise destination number: strip spaces, dashes, parentheses
    let normalized = String(to || "").replace(/[\s\-\(\)\.]/g, "");
    if (/^[6-9]\d{9}$/.test(normalized)) {
      normalized = `+91${normalized}`;
    } else if (/^91[6-9]\d{9}$/.test(normalized)) {
      normalized = `+${normalized}`;
    }

    // Must match Indian mobile format /^\+91[6-9]\d{9}$/
    if (!/^\+91[6-9]\d{9}$/.test(normalized)) {
      return Response.json({ ok: false, error: "invalidNumber" }, { status: 200 });
    }

    // 2. Check Twilio Configuration
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!sid || !token || !fromNumber) {
      return Response.json({ ok: false, error: "smsNotConfigured" }, { status: 200 });
    }

    // 3. Dispatch via Twilio REST API (no SDK) with 10s timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const authHeader = "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");
    const params = new URLSearchParams({
      To: normalized,
      From: fromNumber,
      Body: String(body || "").slice(0, 1600),
    });

    try {
      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
          signal: controller.signal,
        }
      );
      clearTimeout(timer);

      const twilioData = await twilioRes.json().catch(() => ({}));

      if (twilioRes.ok && twilioData?.sid) {
        return Response.json({
          ok: true,
          sid: twilioData.sid,
          status: twilioData.status || "queued",
          to: normalized,
        }, { status: 200 });
      }

      // Log status code only, NEVER the token or auth details
      console.error(`[Twilio Error] Status: ${twilioRes.status}, Code: ${twilioData?.code}`);

      return Response.json({
        ok: false,
        error: twilioData?.message || "Failed to dispatch SMS",
        code: twilioData?.code || twilioRes.status,
      }, { status: 200 });
    } catch (fetchErr) {
      clearTimeout(timer);
      const isTimeout = fetchErr?.name === "AbortError";
      console.error(`[Twilio Fetch Error] ${isTimeout ? "Timed out (10s)" : fetchErr?.message}`);
      return Response.json({
        ok: false,
        error: isTimeout ? "Request timed out" : "Network error connecting to SMS gateway",
      }, { status: 200 });
    }
  } catch (err) {
    // Top-level catch to ensure we NEVER return 500 or expose secrets
    console.error("[SMS Route Exception]", err?.message);
    return Response.json({
      ok: false,
      error: "Internal error processing SMS request",
    }, { status: 200 });
  }
}
