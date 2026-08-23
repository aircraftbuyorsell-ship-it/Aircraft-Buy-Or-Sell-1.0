import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * ATI Full Report — 8-Dimension LLM Analytics Engine
 *
 * Scores each of the 8 ATI dimensions with its own focused, independent LLM call
 * for maximum analytical depth, then aggregates into a total + verdict.
 * Also generates an executive summary, strengths, risks, and recommendations.
 *
 * Input:  { aircraft_data: string, registration?: string }
 * Output: { total, score_label, dimensions: { [key]: { score, justification, strengths, risks, missing } }, summary, strengths, risks, recommendations, identity_rows, omvm_low, omvm_high, asking_price }
 */

const DIMENSIONS = [
  { key: "documentation",     label: "Documentation & Records" },
  { key: "technical",         label: "Technical Condition" },
  { key: "transparency",      label: "Seller Transparency" },
  { key: "transaction_ready", label: "Transaction Readiness" },
  { key: "usage_mission",     label: "Usage & Mission" },
  { key: "storage_exposure",  label: "Storage & Exposure" },
  { key: "config_clarity",    label: "Configuration Clarity" },
  { key: "market_readiness",  label: "Market Readiness" },
];

function labelFromTotal(total) {
  if (total >= 108) return "EXCEPTIONAL";
  if (total >= 90)  return "STRONG BUY";
  if (total >= 72)  return "FAIR";
  if (total >= 54)  return "CAUTION";
  if (total >= 36)  return "RED FLAGS";
  return "AVOID";
}

// ── ABOS monetization gate — one-time purchase per aircraft (server-enforced for web, API and MCP) ──
async function gateOneTimeProduct(base44, user, productKey, registration) {
  if (user?.role === 'admin' || user?.role === 'super_admin') return null;
  const reg = (registration || '').toUpperCase().trim();
  const check = await base44.functions.invoke('abosEntitlements', {
    action: 'check', product_key: productKey, aircraft_registration: reg,
  });
  const d = check?.data || {};
  if (d.entitled) return null;
  let checkoutUrl = null;
  try {
    const co = await base44.functions.invoke('abosEntitlements', {
      action: 'create_checkout', product_key: productKey, aircraft_registration: reg,
      return_url: Deno.env.get('BASE44_APP_URL') || 'https://base44.app',
    });
    checkoutUrl = co?.data?.url || null;
  } catch (_) { /* checkout link is optional */ }
  return Response.json({
    error: 'payment_required',
    message: `This is a paid ABOS report (one-time purchase per aircraft${d.checkout_price_eur ? `, \u20ac${d.checkout_price_eur}` : ''}). Open checkout_url to pay, then retry this request.`,
    product_key: productKey,
    price_eur: d.checkout_price_eur ?? null,
    original_price_eur: d.original_price_eur ?? null,
    aircraft_registration: reg || null,
    checkout_url: checkoutUrl,
  }, { status: 402 });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { aircraft_data = "", registration } = await req.json();
    if (!aircraft_data.trim()) {
      return Response.json({ error: "aircraft_data is required" }, { status: 400 });
    }

    // ── Paid feature: ATI Full Report (€49 one-time per aircraft) ──
    const gate = await gateOneTimeProduct(base44, user, 'ATI_FULL_REPORT', registration);
    if (gate) return gate;

    // ─── 1) Score each of the 8 dimensions independently ────────────
    const scored = {};
    const allStrengths = [];
    const allRisks = [];
    const allMissing = [];

    for (const d of DIMENSIONS) {
      const prompt = `You are the ABOS ATI scoring engine — an expert aviation appraisal system.
Score ONE dimension only: "${d.label}" on a 0–15 integer scale.

Dimension context:
${d.key === "documentation" ? "Evaluate completeness of logbooks, title, airworthiness certificate, registration, damage history disclosure." : ""}
${d.key === "technical" ? "Evaluate maintenance traceability, AD compliance, annual inspection status, engine overhaul documentation, overall mechanical health." : ""}
${d.key === "transparency" ? "Evaluate seller transparency: engine compression tests, oil analysis, TBO documentation, openness about defects/issues." : ""}
${d.key === "transaction_ready" ? "Evaluate readiness for immediate sale: avionics logbook, TSO/STC certificates, lien status, title cleanliness." : ""}
${d.key === "usage_mission" ? "Evaluate usage history and mission profile: flight hours patterns, training vs personal use, wear indicators." : ""}
${d.key === "storage_exposure" ? "Evaluate storage conditions: hangared vs tied-down, climate exposure, corrosion risk, environmental factors." : ""}
${d.key === "config_clarity" ? "Evaluate configuration clarity: equipment list, weight & balance, STC/modification documentation, avionics stack clarity." : ""}
${d.key === "market_readiness" ? "Evaluate market readiness: asking price vs market value, photo quality, listing completeness, demand for this make/model." : ""}

STRICT RULES:
- Be conservative. Missing or vague data MUST lower the score.
- Never fabricate data — if unclear, mark as missing.
- Score 0 if the dimension is completely undocumented.
- Score 7–10 if adequately documented with minor gaps.
- Score 13–15 only if comprehensively documented and verified.

AIRCRAFT DATA:
${aircraft_data}

Return ONLY JSON:
{
  "score": 0-15 integer,
  "justification": "1-2 sentences explaining the score",
  "strengths": ["specific strength 1", "specific strength 2"],
  "risks": ["specific risk 1", "specific risk 2"],
  "missing": ["missing data point 1", "missing data point 2"]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            score: { type: "number" },
            justification: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
            missing: { type: "array", items: { type: "string" } },
          },
          required: ["score", "justification", "strengths", "risks", "missing"],
        },
      });

      const score = Math.max(0, Math.min(15, Math.round(result.score ?? 5)));
      scored[d.key] = {
        score,
        justification: result.justification || "",
        strengths: result.strengths || [],
        risks: result.risks || [],
        missing: result.missing || [],
      };
      (result.strengths || []).forEach((s) => allStrengths.push(`${d.label}: ${s}`));
      (result.risks || []).forEach((r) => allRisks.push(`${d.label}: ${r}`));
      (result.missing || []).forEach((m) => allMissing.push(`${d.label}: ${m}`));
    }

    // ─── 2) Aggregate ────────────────────────────────────────────────
    const dimensionScores = Object.fromEntries(
      Object.entries(scored).map(([k, v]) => [k, v.score])
    );
    const total = Object.values(dimensionScores).reduce((s, v) => s + v, 0);
    const scoreLabel = labelFromTotal(total);

    // ─── 3) Executive summary, recommendations, identity & valuation ──
    const summaryRes = await base44.integrations.Core.InvokeLLM({
      prompt: `You are ABOS — Aircraft Buy Or Sell — a senior aviation appraiser.
Given the ATI scoring results and aircraft data below, produce:
1. A professional 3–4 sentence executive summary
2. Three actionable recommendations for the prospective buyer
3. Structured identity rows (label + value pairs)
4. OMVM valuation range (low and high estimates)

ATI Total: ${total}/120 (${scoreLabel})
Dimension Scores: ${JSON.stringify(dimensionScores, null, 2)}
Top Risks: ${allRisks.slice(0, 5).join(" | ")}
Top Strengths: ${allStrengths.slice(0, 5).join(" | ")}

AIRCRAFT DATA:
${aircraft_data}

Return JSON:
{
  "summary": "3-4 sentence executive summary",
  "recommendations": ["bullet 1", "bullet 2", "bullet 3"],
  "registration": "N-number or registration",
  "year": "year string",
  "make_model": "make and model",
  "airframe_tt": "total time string",
  "engine_smoh": "engine hours string",
  "tbo": "TBO string",
  "last_annual": "last annual date string",
  "avionics": "avionics summary string",
  "asking_price_str": "asking price string",
  "omvm_low": number,
  "omvm_high": number,
  "asking_price_num": number (or 0 if unknown)
}`,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          recommendations: { type: "array", items: { type: "string" } },
          registration: { type: "string" },
          year: { type: "string" },
          make_model: { type: "string" },
          airframe_tt: { type: "string" },
          engine_smoh: { type: "string" },
          tbo: { type: "string" },
          last_annual: { type: "string" },
          avionics: { type: "string" },
          asking_price_str: { type: "string" },
          omvm_low: { type: "number" },
          omvm_high: { type: "number" },
          asking_price_num: { type: "number" },
        },
        required: ["summary", "recommendations", "registration", "year", "make_model", "airframe_tt", "engine_smoh", "tbo", "last_annual", "avionics", "asking_price_str", "omvm_low", "omvm_high", "asking_price_num"],
      },
    });

    // Build identity_rows from the extracted fields
    const identity_rows = [
      { label: "Registration", value: summaryRes.registration || "—" },
      { label: "Year", value: summaryRes.year || "—" },
      { label: "Make / Model", value: summaryRes.make_model || "—" },
      { label: "Airframe TT", value: summaryRes.airframe_tt || "—" },
      { label: "Engine SMOH", value: summaryRes.engine_smoh || "—" },
      { label: "TBO", value: summaryRes.tbo || "—" },
      { label: "Last Annual", value: summaryRes.last_annual || "—" },
      { label: "Avionics", value: summaryRes.avionics || "—" },
      { label: "Asking Price", value: summaryRes.asking_price_str || "—" },
    ].filter(r => r.value && r.value !== "—");

    return Response.json({
      total,
      score_label: scoreLabel,
      dimensions: scored,
      dimension_scores: dimensionScores,
      identity_rows,
      omvm_low: summaryRes.omvm_low || 0,
      omvm_high: summaryRes.omvm_high || 0,
      asking_price: summaryRes.asking_price_num || null,
      registration_extracted: registration || summaryRes.registration || "",
      summary: summaryRes.summary || "",
      strengths: allStrengths.slice(0, 8),
      risks: allRisks.slice(0, 8),
      recommendations: summaryRes.recommendations || [],
      missing_data: allMissing.slice(0, 8),
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});