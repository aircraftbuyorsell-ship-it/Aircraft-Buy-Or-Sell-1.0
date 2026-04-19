// Proxy for the 50K Radio Stations API (RapidAPI).
// Keeps the API key server-side. Accepts { action, params } in the request body.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BASE = "https://50k-radio-stations.p.rapidapi.com";
const HOST = "50k-radio-stations.p.rapidapi.com";

const ROUTES = {
  popular: (p) => `/radios/popular${p.country ? `/${encodeURIComponent(p.country)}` : ""}`,
  search: () => `/radios/search`,
  list: () => `/radios`,
  random: () => `/radios/random`,
  countries: () => `/countries`,
  genres: () => `/genres`,
};

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "" || k === "country") return;
    qs.append(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const key = Deno.env.get("RAPIDAPI_RADIO_KEY");
    if (!key) return Response.json({ error: "API key not configured" }, { status: 500 });

    const { action = "popular", params = {} } = await req.json().catch(() => ({}));
    const routeFn = ROUTES[action];
    if (!routeFn) return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

    const url = `${BASE}${routeFn(params)}${buildQuery(params)}`;
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": key,
        "X-RapidAPI-Host": HOST,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json({ error: `Upstream ${res.status}`, details: text }, { status: res.status });
    }

    const json = await res.json();
    return Response.json(json);
  } catch (error) {
    console.error("radioProxy error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});