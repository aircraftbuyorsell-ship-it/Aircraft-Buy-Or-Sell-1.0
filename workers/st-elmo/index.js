const MODEL_ID = "abos-st-elmo";
const VERSION = "M_1.0";
const DEFAULT_BACKEND_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";

function corsHeaders(contentType = "application/json; charset=utf-8") {
  return {
    "content-type": contentType,
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders() });
}

function systemPrompt() {
  return `You are ABOS St. Elmo M_1.0, the reasoning and orchestration layer for AircraftBuyOrSell.
Follow ABOS APL/ADL orchestration principles: plan the task, select the appropriate domain capability, interpret evidence, and synthesize the result.
ABOS domain engines remain authoritative for verification, ATI, OMVM, persistence, scoring, and authorization.
Never invent aircraft registry, ownership, maintenance, market, engine, traffic, or valuation facts.
When evidence is missing, say so explicitly.`;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return json({
        ok: true,
        service: MODEL_ID,
        version: VERSION,
        status: "online",
        backend: "nvidia",
      });
    }

    if (request.method !== "POST" || url.pathname !== "/v1/chat/completions") {
      return json({ error: "Not found" }, 404);
    }

    if (!env.NVIDIA_API_KEY) {
      return json({
        error: "NVIDIA_API_KEY is not configured",
        diagnostic: "missing_runtime_secret",
      }, 503);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) return json({ error: "messages is required" }, 400);

    const baseUrl = (env.NVIDIA_NIM_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
    const model = env.NVIDIA_MODEL || DEFAULT_BACKEND_MODEL;

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "authorization": `Bearer ${env.NVIDIA_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: systemPrompt() }, ...messages],
          temperature: typeof body.temperature === "number" ? body.temperature : 0.2,
          max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : 4096,
          stream: Boolean(body.stream),
        }),
      });

      if (!response.ok) {
        const detail = (await response.text()).slice(0, 2000);
        return json({
          error: "NVIDIA backend request failed",
          diagnostic: "nvidia_http_error",
          nvidia_status: response.status,
          detail,
          model,
        }, 502);
      }

      if (body.stream) {
        return new Response(response.body, {
          status: response.status,
          headers: corsHeaders(response.headers.get("content-type") || "text/event-stream"),
        });
      }

      const result = await response.json();
      result.model = MODEL_ID;
      result.abos_version = VERSION;
      result.reasoning_backend = model;
      return json(result);
    } catch (error) {
      return json({
        error: "NVIDIA backend network request failed",
        diagnostic: "fetch_failed",
        detail: error?.message || "unknown network error",
        model,
      }, 502);
    }
  },
};
