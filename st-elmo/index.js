const MODEL_ID = "abos-st-elmo";
const VERSION = "M_1.0";
const DEFAULT_BACKEND_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
    },
  });
}

async function sha256(value) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

/** Compares over digests so a wrong secret cannot be recovered by timing. Mirrors gateway/src/index.js. */
async function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  const [ha, hb] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i];
  return diff === 0;
}

function bearerFrom(request) {
  const match = /^Bearer\s+(.+)$/i.exec((request.headers.get("Authorization") || "").trim());
  return match ? match[1].trim() : null;
}

/**
 * This Worker spends the account's NVIDIA quota on every call, so the caller has
 * to prove it is ABOS. Without this the endpoint was a public LLM proxy: no
 * inbound check at all, `access-control-allow-origin: *`, caller-supplied
 * messages, and the URL shipped in the browser bundle.
 *
 * Fail closed. An unset secret means no caller can be authenticated, which is a
 * misconfiguration — never a reason to serve the key to everyone.
 */
async function authorize(request, env) {
  if (!env.ST_ELMO_GATEWAY_SECRET) {
    return json({ error: "ST_ELMO_GATEWAY_SECRET is not configured", diagnostic: "missing_gateway_secret" }, 503);
  }
  const presented = bearerFrom(request);
  if (!presented || !(await timingSafeEqual(presented, env.ST_ELMO_GATEWAY_SECRET))) {
    return json({ error: "Unauthorized" }, 401);
  }
  return null;
}

function systemPrompt() {
  return `You are ABOS St. Elmo M_1.0, the reasoning and orchestration layer for AircraftBuyOrSell.
Your role is to plan, reason, select capabilities, interpret evidence, and synthesize answers.
ABOS domain engines remain authoritative for verification, ATI, OMVM, persistence, scoring, and authorization.
Never invent aircraft registry, ownership, maintenance, market, engine, traffic, or valuation facts.
When evidence is missing, say so explicitly.`;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type,authorization" }});
    const url = new URL(request.url);
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) return json({ ok: true, service: MODEL_ID, version: VERSION, status: "online", backend: "nvidia" });
    if (request.method !== "POST" || url.pathname !== "/v1/chat/completions") return json({ error: "Not found" }, 404);
    // Authorize before anything that costs money or reveals configuration.
    const denied = await authorize(request, env);
    if (denied) return denied;
    if (!env.NVIDIA_API_KEY) return json({ error: "NVIDIA_API_KEY is not configured", diagnostic: "missing_runtime_secret" }, 503);
    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) return json({ error: "messages is required" }, 400);
    const baseUrl = (env.NVIDIA_NIM_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
    const model = env.NVIDIA_MODEL || DEFAULT_BACKEND_MODEL;
    let response;
    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", "authorization": `Bearer ${env.NVIDIA_API_KEY}` },
        body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt() }, ...messages], temperature: typeof body.temperature === "number" ? body.temperature : 0.2, max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : 4096, stream: Boolean(body.stream) })
      });
    } catch (error) {
      return json({ error: "NVIDIA backend network request failed", diagnostic: "fetch_failed", detail: error?.message || "unknown network error", model, endpoint: `${baseUrl}/chat/completions` }, 502);
    }
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 2000);
      return json({ error: "NVIDIA backend rejected the request", diagnostic: "nvidia_http_error", nvidia_status: response.status, nvidia_status_text: response.statusText, detail, model, endpoint: `${baseUrl}/chat/completions` }, 502);
    }
    if (body.stream) return new Response(response.body, { status: response.status, headers: { "content-type": response.headers.get("content-type") || "text/event-stream", "cache-control": "no-cache", "access-control-allow-origin": "*" } });
    const result = await response.json();
    result.model = MODEL_ID;
    result.abos_version = VERSION;
    result.reasoning_backend = model;
    return json(result);
  }
};
