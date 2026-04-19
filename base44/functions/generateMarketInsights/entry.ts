// AI-powered market insights for the Dashboard side panel.
// Analyzes recent listings, escrow activity, deal scores, and ATI data
// to produce: trending aircraft models + buy alerts + market shift signals.
//
// Cached for 15 minutes per-user in memory to avoid spamming the LLM.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CACHE = new Map(); // key: user.email, value: { at: ms, data }
const TTL_MS = 15 * 60 * 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const cached = CACHE.get(user.email);
    if (cached && Date.now() - cached.at < TTL_MS) {
      return Response.json({ ...cached.data, cached: true });
    }

    // Gather signal data (service-role for full visibility across the zone)
    const [listings, escrows, deals] = await Promise.all([
      base44.asServiceRole.entities.AircraftListing.filter({ status: "active" }, "-created_date", 60),
      base44.asServiceRole.entities.EscrowTransaction.list("-created_date", 30),
      base44.asServiceRole.entities.DealRadar.list("-created_date", 40),
    ]);

    // Compress to a compact signal packet for the LLM
    const listingSignals = listings.map(l => ({
      id: l.id,
      mm: `${l.year || "?"} ${l.make} ${l.model}`,
      reg: l.registration || null,
      price: l.asking_price || null,
      omvm: l.omvm_value || null,
      ati: l.ati_score || null,
      deal_label: l.deal_label || null,
      discount_pct: l.discount_pct ?? null,
      created: l.created_date,
    }));

    const escrowSignals = escrows.map(e => ({
      aircraft: e.aircraft_label || null,
      amount: e.sale_amount || null,
      status: e.status,
      created: e.created_date,
      closed: e.closed_at || null,
    }));

    const dealSignals = deals.map(d => ({
      score: d.deal_score,
      label: d.deal_label,
      discount: d.discount_pct,
    }));

    const totalListings = listings.length;
    const hotDeals = listings.filter(l => (l.deal_score || 0) >= 8.5).length;
    const avgAti = totalListings
      ? Math.round(listings.reduce((s, l) => s + (l.ati_score || 0), 0) / totalListings)
      : 0;
    const closedEscrows = escrows.filter(e => e.status === "closed").length;
    const activeEscrows = escrows.filter(e => !["closed", "cancelled"].includes(e.status)).length;

    const prompt = `You are the ABOS market-intelligence engine for a private aviation dealer network.
Analyze the signal packet below and return JSON with 3 sections:
  (1) trending_models — aircraft make/model combinations showing unusual activity (volume, pricing, or ATI shifts)
  (2) buy_alerts — specific listings that look like strong opportunities right now (cite the listing id when possible)
  (3) market_shifts — brief macro observations from escrow + deal flow

RULES:
- Base every insight on the data provided. Do not invent listings or numbers.
- Be concise and professional. Dealers read this in 10 seconds.
- For trending_models, include 2-4 entries. For buy_alerts, include 2-3 entries. For market_shifts, 2-3 bullets.
- Score each insight's confidence 1-5 based on signal strength.

Zone snapshot:
  total_active_listings: ${totalListings}
  hot_deals (deal_score >= 8.5): ${hotDeals}
  avg_ati_score: ${avgAti}
  escrows_active: ${activeEscrows}
  escrows_closed: ${closedEscrows}

Listings (sample): ${JSON.stringify(listingSignals.slice(0, 40))}
Escrows (sample): ${JSON.stringify(escrowSignals.slice(0, 20))}
Deal scores (sample): ${JSON.stringify(dealSignals.slice(0, 25))}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          trending_models: {
            type: "array",
            items: {
              type: "object",
              properties: {
                model: { type: "string" },
                signal: { type: "string" },
                direction: { type: "string", enum: ["up", "down", "steady"] },
                confidence: { type: "number" },
              },
              required: ["model", "signal", "direction"],
            },
          },
          buy_alerts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                listing_id: { type: "string" },
                aircraft: { type: "string" },
                reason: { type: "string" },
                confidence: { type: "number" },
              },
              required: ["aircraft", "reason"],
            },
          },
          market_shifts: {
            type: "array",
            items: { type: "string" },
          },
          summary: { type: "string" },
        },
        required: ["trending_models", "buy_alerts", "market_shifts"],
      },
    });

    const data = {
      generated_at: new Date().toISOString(),
      snapshot: { totalListings, hotDeals, avgAti, activeEscrows, closedEscrows },
      ...result,
    };

    CACHE.set(user.email, { at: Date.now(), data });
    return Response.json({ ...data, cached: false });
  } catch (error) {
    console.error("generateMarketInsights error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});