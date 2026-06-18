import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Orchestrates the ATI scoring for a listing given wizard inputs.
 * - Scores each of 8 dimensions with its own focused LLM call (structured JSON).
 * - Aggregates into a final 0-120 total + label.
 * - Persists an ATIPassport, updates the AircraftListing, merges evidence
 *   URLs into the ATICard.image_attachments, and logs to DecisionLog.
 *
 * Expected body: { listingId, answers: { [dim]: {...} }, evidence: { [dim]: [urls] } }
 */

const DIMENSIONS = [
  { key: "documentation", label: "Documentation Completeness" },
  { key: "technical", label: "Maintenance Traceability" },
  { key: "transparency", label: "Engine Health" },
  { key: "transaction_ready", label: "Avionics Quality" },
  { key: "usage_mission", label: "Usage / Mission Risk" },
  { key: "storage_exposure", label: "Storage & Exposure" },
  { key: "config_clarity", label: "Configuration Clarity" },
  { key: "market_readiness", label: "Market Readiness" },
];

// ─── STRICT DOCUMENTATION RULES ───────────────────────────────────────
// Points only awarded if documentation is uploaded and verified OR explicitly
// marked as "not applicable" with justification
const REQUIRED_DOCUMENTS = {
  documentation: [
    { name: "Logbook (complete)", description: "Full aircraft logbook records", critical: true },
    { name: "Title/Deed", description: "Aircraft ownership certificate", critical: true },
    { name: "Airworthiness Certificate", description: "Current airworthiness documentation", critical: true },
    { name: "Registration Certificate", description: "FAA registration (Form 1500 or equivalent)", critical: true },
    { name: "Damage History", description: "Accident/incident history disclosure", critical: true },
  ],
  technical: [
    { name: "Annual Inspection Records", description: "Recent annual inspection reports", critical: true },
    { name: "AD Compliance Log", description: "Airworthiness Directive compliance proof", critical: true },
    { name: "Maintenance Records", description: "Service/repair documentation (last 5 years)", critical: true },
    { name: "Engine Overhaul Documentation", description: "Major overhaul certificates & logs", critical: false },
  ],
  transparency: [
    { name: "Engine Compression Test", description: "Recent compression check results", critical: true },
    { name: "Oil Analysis Report", description: "Engine oil analysis (last 100 hrs)", critical: false },
    { name: "TBO Documentation", description: "Proof of TBO calculation & remaining life", critical: true },
  ],
  transaction_ready: [
    { name: "Avionics Logbook", description: "Avionics installation & maintenance records", critical: false },
    { name: "TSO/STC Certificates", description: "Technical Standard Order approvals", critical: false },
  ],
  storage_exposure: [
    { name: "Storage Location Documentation", description: "Proof of current hangar/storage", critical: false },
  ],
  config_clarity: [
    { name: "Aircraft Configuration Sheet", description: "Current equipment list (W&B)", critical: true },
    { name: "STC/Modification List", description: "All modifications & their approval docs", critical: true },
  ],
  market_readiness: [
    { name: "Photos (exterior/interior/panel)", description: "High-quality aircraft photos", critical: false },
    { name: "Recent Annual Inspection", description: "Annual inspection within 12 months", critical: true },
  ],
};

function calculateDocumentationScore(dimAnswers, dimEvidence, dimension) {
  // STRICT RULE: No points without evidence or explicit "not applicable"
  if (!dimEvidence || dimEvidence.length === 0) {
    const hasNotApplicable = dimAnswers?.documentation_status === "not_applicable" && 
                             dimAnswers?.not_applicable_reason;
    if (!hasNotApplicable) {
      return 0; // Zero points if no evidence and not explicitly marked N/A
    }
  }
  
  // If evidence exists, check if verification status is marked
  const isVerified = dimAnswers?.verification_status === "verified";
  const isPending = dimAnswers?.verification_status === "pending";
  
  // Points only if verified or explicitly confirmed as complete
  if (!isVerified && !dimAnswers?.documentation_complete) {
    return Math.max(0, (dimEvidence?.length || 0) * 2); // Partial credit for uploaded but unverified
  }
  
  return 15; // Full points for verified or confirmed complete
}

function labelFromTotal(total) {
  if (total >= 108) return "EXCEPTIONAL";
  if (total >= 90) return "STRONG BUY";
  if (total >= 72) return "FAIR";
  if (total >= 54) return "CAUTION";
  if (total >= 36) return "RED FLAGS";
  return "AVOID";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { listingId, answers = {}, evidence = {} } = await req.json();
    if (!listingId) return Response.json({ error: "listingId required" }, { status: 400 });

    const listing = await base44.entities.AircraftListing.get(listingId);
    if (!listing) return Response.json({ error: "Listing not found" }, { status: 404 });

    // ─── 1) Score each dimension separately ───────────────────────────
    const scored = {};
    const riskFlags = [];
    const strengths = [];
    const missingData = [];

    for (const d of DIMENSIONS) {
      const dimAnswers = answers[d.key] || {};
      const dimEvidence = evidence[d.key] || [];
      const hasAnyAnswer = Object.values(dimAnswers).some((v) => v != null && v !== "");
      
      // SPECIAL HANDLING FOR DOCUMENTATION DIMENSION
      let baseScore = null;
      if (d.key === "documentation") {
        baseScore = calculateDocumentationScore(dimAnswers, dimEvidence, d.key);
      }

      const prompt = `You are the ATI scoring engine for ABOS aviation marketplace.
Score ONE dimension only: "${d.label}" on a 0-15 integer scale.

STRICT RULES FOR THIS SUBMISSION:
${d.key === "documentation" ? `
- DOCUMENTATION DIMENSION: Points (>0) ONLY if evidence files are uploaded AND verified, OR explicitly marked "not applicable" with justification.
- If documentation_status = "not_applicable" AND not_applicable_reason provided → proceed with scoring.
- If documentation_status = "pending" → cap score at 8 (unverified evidence).
- If NO evidence uploaded AND NOT marked N/A → SCORE MUST BE 0.
- Required docs for this aircraft: ${(REQUIRED_DOCUMENTS[d.key] || []).map(d => d.name).join(", ")}
` : `
- Be conservative. Missing or vague data MUST lower the score.
- If no user input was provided, score based on listing data only and cap at 7.
- Flag regulatory issues (e.g. non-ADS-B, overdue ADs) as risks.
- Never fabricate data — if unclear, mark as missing.
`}

Listing snapshot:
${JSON.stringify({
  year: listing.year, make: listing.make, model: listing.model,
  registration: listing.registration,
  total_time: listing.total_time, engine_hours: listing.engine_hours,
  tbo: listing.tbo, last_annual: listing.last_annual,
  fresh_annual: listing.fresh_annual, avionics: listing.avionics,
  asking_price: listing.asking_price,
}, null, 2)}

User wizard input for this dimension (${d.key}):
${JSON.stringify(dimAnswers, null, 2)}

Evidence files attached: ${dimEvidence.length}

Return ONLY JSON:
{
  "score": 0-15 integer,
  "justification": "1-2 sentences",
  "strengths": ["..."],
  "risks": ["..."],
  "missing": ["..."]
}`;

      const payload = {
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
        },
      };
      // Pass evidence images to the model when present (vision-capable)
      if (dimEvidence.length > 0) payload.file_urls = dimEvidence.slice(0, 6);

      const result = await base44.integrations.Core.InvokeLLM(payload);
      
      // Apply strict documentation rules
      let score = Math.max(0, Math.min(15, Math.round(result.score ?? (hasAnyAnswer ? 8 : 5))));
      if (d.key === "documentation" && baseScore !== null) {
        score = baseScore;
      }
      
      // For documentation: if no evidence and not N/A, force zero
      if (d.key === "documentation" && (!dimEvidence || dimEvidence.length === 0)) {
        const isNotApplicable = dimAnswers?.documentation_status === "not_applicable" && dimAnswers?.not_applicable_reason;
        if (!isNotApplicable) {
          score = 0;
        }
      }
      
      scored[d.key] = { score, ...result };
      (result.strengths || []).forEach((s) => strengths.push(`${d.label}: ${s}`));
      (result.risks || []).forEach((r) => riskFlags.push(`${d.label}: ${r}`));
      (result.missing || []).forEach((m) => missingData.push(`${d.label}: ${m}`));
    }

    const dimensionScores = Object.fromEntries(
      Object.entries(scored).map(([k, v]) => [k, v.score])
    );
    const atiTotal = Object.values(dimensionScores).reduce((s, v) => s + v, 0);
    const scoreLabel = labelFromTotal(atiTotal);

    // ─── 2) Generate executive summary + recommendations ──────────────
    const summaryRes = await base44.integrations.Core.InvokeLLM({
      prompt: `Given the ATI scoring result below, write a 2-3 sentence executive summary and list 3 recommendations for the prospective buyer.
Total: ${atiTotal}/120 (${scoreLabel})
Dimensions: ${JSON.stringify(dimensionScores)}
Top risks: ${riskFlags.slice(0, 5).join(" | ")}
Top strengths: ${strengths.slice(0, 5).join(" | ")}

Return JSON:
{ "ai_summary": "...", "recommendations": ["...", "...", "..."] }`,
      response_json_schema: {
        type: "object",
        properties: {
          ai_summary: { type: "string" },
          recommendations: { type: "array", items: { type: "string" } },
        },
      },
    });

    // ─── 3) OMVM valuation via omvmV5Score ─────────────
    let omvmValue = null;
    try {
      const omvmResult = await base44.functions.invoke("omvmV5Score", {
        listingId,
      });
      omvmValue = omvmResult?.data?.omvm_value ?? omvmResult?.omvm_value ?? null;
    } catch (err) {
      console.error("[orchestrateATIScoring] omvmV5Score failed:", err);
      // omvmValue stays null — no fallback to hardcoded values
    }
    const discountPct = listing.asking_price && omvmValue != null
      ? Math.round(((omvmValue - listing.asking_price) / omvmValue) * 1000) / 10
      : null;
    const dealScore = discountPct == null ? null
      : discountPct > 25 ? 9.5 : discountPct > 15 ? 8.5 : discountPct > 8 ? 7.5
      : discountPct > 2 ? 6.5 : discountPct < -15 ? 2.5 : discountPct < -5 ? 4.0 : 5.0;
    const dealLabel = dealScore == null ? null
      : dealScore >= 8.5 ? "hot deal" : dealScore >= 6.5 ? "good deal"
      : dealScore >= 5 ? "fair" : "overpriced";
    const dealRadarEligible = atiTotal >= 93 && discountPct != null && discountPct >= 8;
    const coOwnershipViable = (listing.asking_price || 0) >= 150000;

    // ─── 4) Persist ATIPassport ───────────────────────────────────────
    const passport = await base44.entities.ATIPassport.create({
      listing: listingId,
      triggered_by: user.id,
      ati_total: atiTotal,
      ...dimensionScores,
      score_label: scoreLabel,
      ai_summary: summaryRes.ai_summary,
      strengths: strengths.slice(0, 10).join("\n"),
      risks: riskFlags.slice(0, 10).join("\n"),
      recommendations: (summaryRes.recommendations || []).join("\n"),
      missing_data: missingData.slice(0, 10).join("\n"),
      deal_radar_eligible: dealRadarEligible,
      co_ownership_viable: coOwnershipViable,
      omvm_value: omvmValue,
      deal_score: dealScore,
      deal_label: dealLabel,
      discount_pct: discountPct,
      ati_version: "wizard_v1",
    });

    // ─── 5) Update listing ────────────────────────────────────────────
    await base44.entities.AircraftListing.update(listingId, {
      ati_score: atiTotal,
      omvm_value: omvmValue,
      deal_score: dealScore,
      deal_label: dealLabel,
      discount_pct: discountPct,
    });

    // ─── 6) Merge evidence into card image_attachments ────────────────
    const allEvidence = Object.values(evidence).flat().filter(Boolean);
    if (allEvidence.length > 0) {
      const cards = await base44.asServiceRole.entities.ATICard.filter(
        { listing: listingId }, "-created_date", 1
      );
      const card = cards[0];
      if (card) {
        const existing = card.image_attachments || [];
        const merged = [...new Set([...existing, ...allEvidence])];
        await base44.asServiceRole.entities.ATICard.update(card.id, {
          image_attachments: merged,
        });
      }
    }

    // ─── 7) Decision log ──────────────────────────────────────────────
    await base44.entities.DecisionLog.create({
      decision_type: "ati_score",
      subject_type: "listing",
      subject_id: listingId,
      subject_label: `${listing.registration || "—"} · ${listing.year || ""} ${listing.make || ""} ${listing.model || ""}`.trim(),
      inputs: { answers, evidence_counts: Object.fromEntries(Object.entries(evidence).map(([k, v]) => [k, v.length])) },
      outputs: { ati_total: atiTotal, score_label: scoreLabel, dimensions: dimensionScores, omvm_value: omvmValue, discount_pct: discountPct },
      rule_version: "wizard_v1",
      rule_source: "functions/orchestrateATIScoring",
      actor: user.email,
      reasoning: summaryRes.ai_summary,
    });

    return Response.json({
      ok: true,
      passportId: passport.id,
      ati_total: atiTotal,
      score_label: scoreLabel,
      dimensions: dimensionScores,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});