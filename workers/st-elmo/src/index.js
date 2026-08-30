const ALLOWED_ORIGINS = [
  "https://aircraftbuyorsell.com",
  "https://www.aircraftbuyorsell.com",
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization, x-abos-runtime-key",
    "vary": "Origin",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...corsHeaders(origin) },
  });
}

function normalize(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const SKILL_TERMS = {
  aircraft_verification: ["verify", "verification", "registry", "serial", "owner", "history", "risk"],
  ati: ["ati", "transparency", "passport", "score"],
  marketspace: ["marketspace", "listing", "aircraft for sale", "deal", "market"],
  valuation: ["value", "valuation", "worth", "price", "omvm"],
  dealer_intelligence: ["dealer", "broker", "seller"],
  engine: ["engine", "tbo", "hours", "smo", "smoh"],
  service_intelligence: ["service", "maintenance", "logbook", "inspection", "annual"],
  listing_analysis: ["analyze listing", "analyse listing", "inconsistency"],
};

function route(request) {
  const text = normalize(`${request.user_request || ""} ${(request.messages || []).slice(-3).map(m => m.content).join(" ")}`);
  const ranked = Object.entries(SKILL_TERMS).map(([key, terms]) => ({
    key,
    score: terms.reduce((n, term) => n + (text.includes(term) ? (term.length > 5 ? 3 : 2) : 0), 0),
  })).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  return {
    intent: ranked[0]?.key || "general_abos_assistance",
    selected_skills: ranked.map(x => x.key),
    plan: ranked.length ? ranked.map(x => `Execute ${x.key} and return evidence-backed findings.`) : ["Understand request", "Use available ABOS context", "State missing evidence"],
  };
}

async function runModel(env, request, routing) {
  // The Worker is deliberately model-provider neutral. Configure an upstream
  // model gateway later; until then return routing metadata rather than fake work.
  if (!env.MODEL_GATEWAY_URL) {
    return {
      answer: "St. Elmo Worker runtime is connected. The request was routed, but no model gateway is configured yet. No live verification or background task was claimed.",
      confidence: 0,
      evidence: [],
    };
  }
  const response = await fetch(env.MODEL_GATEWAY_URL, {
    method: "POST",
    headers: { "content-type": "application/json", ...(env.MODEL_GATEWAY_KEY ? { authorization: `Bearer ${env.MODEL_GATEWAY_KEY}` } : {}) },
    body: JSON.stringify({ protocol: "abos-st-elmo", model: "abos-st-elmo", version: "mach-1.0", request, routing }),
  });
  if (!response.ok) throw new Error(`Model gateway returned ${response.status}`);
  return response.json();
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
    const url = new URL(request.url);
    if (url.pathname !== "/st-elmo/run" || request.method !== "POST") return json({ error: "Not found" }, 404, origin);

    const expected = env.ABOS_RUNTIME_KEY;
    const supplied = request.headers.get("x-abos-runtime-key");
    if (expected && supplied !== expected) return json({ error: "Unauthorized" }, 401, origin);

    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400, origin); }
    if (!body?.user_request || typeof body.user_request !== "string") return json({ error: "user_request is required" }, 422, origin);
    if (body.user_request.length > 12000) return json({ error: "user_request too large" }, 413, origin);

    const routing = route(body);
    try {
      const result = await runModel(env, body, routing);
      return json({ protocol: "abos-st-elmo", version: "mach-1.0", runtime: "cloudflare-worker", ...routing, ...result, completed_at: new Date().toISOString() }, 200, origin);
    } catch (error) {
      return json({ protocol: "abos-st-elmo", version: "mach-1.0", runtime: "cloudflare-worker", ...routing, status: "failed", error: error?.message || "Worker execution failed" }, 502, origin);
    }
  },
};
