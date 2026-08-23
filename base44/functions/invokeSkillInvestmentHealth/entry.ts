import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Skill: abos.skill.investment_health.v1 (RFC-234, Batch D)
 * Aggregator skill — loads Digital Twin, calls dependent skills, generates Investment Brief.
 * Hybrid model: GPT o3 for tool_calling structuring + Llama 4 Maverick for narrative.
 * Dependencies: A1 (OMVM), A2 (ATI), A3 (Engine TBO), B1 (OPEX), B2 (Insurance).
 */

const SKILL_MAP = {
  'abos.skill.opex.v1': 'invokeSkillOpex',
  'abos.skill.insurance_estimate.v1': 'invokeSkillInsurance',
  'abos.skill.leasing.v1': 'invokeSkillLeasing',
  'abos.skill.rebuild_roi.v1': 'invokeSkillRebuildRoi',
  'abos.skill.tax_benefit.v1': 'invokeSkillTaxBenefit',
  'abos.skill.lease_rate.v1': 'invokeSkillLeaseRate',
};

// ── Model Router (PS-3.5) ──
async function callLlama4Maverick(prompt, contextData) {
  const apiKey = Deno.env.get('SAKANA_12byteflow_API_KEY') || Deno.env.get('12byteflow_key');
  if (!apiKey) throw new Error('12byteflow key not configured');
  const response = await fetch('https://api.12byteflow.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'meta/llama-4-maverick',
      messages: [
        { role: 'system', content: 'You are the ABOS Finance Advisor. Synthesize aircraft investment data into actionable briefs. Always respond in JSON with fields: brief_summary (string), strengths (array), risks (array), recommendation (string), confidence_assessment (string).' },
        { role: 'user', content: `${prompt}\n\nDigital Twin Context:\n${JSON.stringify(contextData, null, 2)}` }
      ],
      temperature: 0.4,
      max_tokens: 2000,
    }),
  });
  if (!response.ok) throw new Error(`Llama 4 API error: ${response.status}`);
  const data = await response.json();
  return { content: data.choices?.[0]?.message?.content || '', model: 'meta/llama-4-maverick' };
}

async function callGPT4o(prompt, contextData) {
  const apiKey = Deno.env.get('OpenAI_API_Key_abos_marketspace');
  if (!apiKey) throw new Error('OpenAI key not configured');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are the ABOS Finance Advisor. Synthesize aircraft investment data into actionable briefs. Always respond in JSON with fields: brief_summary (string), strengths (array), risks (array), recommendation (string), confidence_assessment (string).' },
        { role: 'user', content: `${prompt}\n\nDigital Twin Context:\n${JSON.stringify(contextData, null, 2)}` }
      ],
      temperature: 0.4,
      max_tokens: 2000,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
  const data = await response.json();
  return { content: data.choices?.[0]?.message?.content || '', model: 'gpt-4o' };
}

async function callClaude(prompt, contextData) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('Anthropic key not configured');
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: 'You are the ABOS Finance Advisor. Synthesize aircraft investment data into actionable briefs. Always respond in JSON with fields: brief_summary (string), strengths (array), risks (array), recommendation (string), confidence_assessment (string).',
      messages: [{ role: 'user', content: `${prompt}\n\nDigital Twin Context:\n${JSON.stringify(contextData, null, 2)}` }],
    }),
  });
  if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
  const data = await response.json();
  return { content: data.content?.[0]?.text || '', model: 'claude-3-5-sonnet' };
}

async function generateNarrative(prompt, contextData) {
  // Try Llama 4 Maverick first (primary), then GPT-4o, then Claude
  try {
    return await callLlama4Maverick(prompt, contextData);
  } catch (_e) {
    try {
      return await callGPT4o(prompt, contextData);
    } catch (_e2) {
      return await callClaude(prompt, contextData);
    }
  }
}

function computeInvestmentHealthScore({ atiTotal, omvmValue, engineRemainingPct, opexAnnual, clarityScore }) {
  let score = 50;
  if (atiTotal) score += (atiTotal / 120) * 20; // ATI contributes up to 20 pts
  if (engineRemainingPct != null) score += (engineRemainingPct / 100) * 15;
  if (clarityScore != null) score += (clarityScore / 100) * 10;
  if (omvmValue && opexAnnual) {
    const ratio = opexAnnual / omvmValue;
    if (ratio < 0.05) score += 5;
    else if (ratio > 0.15) score -= 10;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;
    const passportId = inputs.passport_id || body.passport_id;
    const registration = (inputs.registration || body.registration || '').trim().toUpperCase();

    // 1) Load Digital Twin context
    let passport = null;
    if (passportId) {
      const passports = await base44.asServiceRole.entities.ATIPassport.filter({ id: passportId }, '-created_date', 1);
      passport = passports[0];
    } else if (registration) {
      const passports = await base44.asServiceRole.entities.ATIPassport.filter({ registration }, '-created_date', 1);
      passport = passports[0];
    }

    if (!passport) {
      return Response.json({ ok: false, error: 'Digital Twin not found for given passport_id or registration' }, { status: 404 });
    }

    // 2) Load Engine Maintenance
    const engineMaintenance = await base44.asServiceRole.entities.EngineMaintenance.filter(
      { registration: passport.registration }, '-created_date', 1
    );

    // 3) Gather skill results from dependencies
    const twinContext = {
      registration: passport.registration,
      ati_total: passport.ati_total || null,
      ati_label: passport.score_label || null,
      omvm_value: passport.omvm_value || null,
      deal_score: passport.deal_score || null,
      deal_label: passport.deal_label || null,
      engine_remaining_pct: passport.engine_remaining_pct || engineMaintenance[0]?.remaining_pct || null,
      engine_tbo_hours: passport.engine_tbo_hours || engineMaintenance[0]?.tbo_hours || null,
      data_confidence: passport.data_confidence || null,
      is_for_sale: passport.is_for_sale || false,
      twin_last_synced_at: passport.twin_last_synced_at || null,
    };

    // 4) Run dependent skills IN DEPENDENCY ORDER.
    // FIX (2026-08-23): Batch D skills (tax_benefit, lease_rate) were gated on
    // the raw caller inputs instead of the actual OPEX skill OUTPUT, so they
    // silently skipped or ran with $0 opex whenever the caller only passed
    // annual_hours/aircraft_preset_id (the normal Finance Advisor call shape).
    // Also: jurisdiction defaulted to 'CZ' unconditionally instead of being
    // inferred from the aircraft's own registration.
    const skillResults = {};

    async function runSkill(skillId, functionName, payload) {
      try {
        const res = await base44.functions.invoke(functionName, payload);
        if (res.data?.ok) {
          skillResults[skillId] = res.data;
          return res.data;
        }
        skillResults[skillId] = res.data || { ok: false, error: 'empty_response' };
        return null;
      } catch (e) {
        skillResults[skillId] = { ok: false, error: e.message };
        return null;
      }
    }

    // 4a) OPEX (Batch B1) — must complete before any Batch D skill runs.
    let opexResult = null;
    if (inputs.annual_hours || inputs.opex_annual || inputs.total_opex_annual || inputs.annual_opex) {
      const opexData = await runSkill('abos.skill.opex.v1', 'invokeSkillOpex', {
        inputs: { aircraft_preset_id: inputs.aircraft_preset_id, annual_hours: inputs.annual_hours, engine_hours: inputs.engine_hours, ...inputs },
      });
      opexResult = opexData?.result || null;
    }
    const resolvedAnnualOpex = opexResult?.total_annual ?? inputs.total_opex_annual ?? inputs.annual_opex ?? null;

    // 4b) Insurance (Batch B2) — feeds lease_rate's insurance_surcharge.
    let insuranceResult = null;
    if (inputs.hull_value || passport.omvm_value) {
      const insData = await runSkill('abos.skill.insurance_estimate.v1', 'invokeSkillInsurance', {
        inputs: { hull_value: inputs.hull_value || passport.omvm_value, aircraft_type: inputs.aircraft_type || 'sep', ...inputs },
      });
      insuranceResult = insData?.result || null;
    }
    const resolvedInsuranceAnnual = insuranceResult?.annual_premium ?? inputs.insurance_surcharge ?? 0;

    // Jurisdiction: infer from FAA registration prefix instead of hardcoding
    // CZ. N-prefix = US-registered aircraft. Explicit input always wins.
    const inferredJurisdiction = inputs.jurisdiction
      ? inputs.jurisdiction
      : /^N/i.test(passport.registration || '') ? 'US' : 'EU';

    // 4c) Tax Benefit (Batch D) — gated on the RESOLVED opex value.
    if (resolvedAnnualOpex || inputs.lease_revenue) {
      await runSkill('abos.skill.tax_benefit.v1', 'invokeSkillTaxBenefit', {
        inputs: { annual_opex: resolvedAnnualOpex, lease_revenue: inputs.lease_revenue, jurisdiction: inferredJurisdiction, usage_type: inputs.usage_type || 'rental', ...inputs },
      });
    }

    // 4d) Lease Rate (Batch D) — gated + populated from resolved OPEX/insurance,
    // not raw caller inputs. This is the fix for the empty lease_rate result.
    if (resolvedAnnualOpex) {
      await runSkill('abos.skill.lease_rate.v1', 'invokeSkillLeaseRate', {
        inputs: { total_opex_annual: resolvedAnnualOpex, insurance_surcharge: resolvedInsuranceAnnual, ...inputs },
      });
    }

    // 5) Compute investment health score
    const opexResult = skillResults['abos.skill.opex.v1']?.result;
    const healthScore = computeInvestmentHealthScore({
      atiTotal: twinContext.ati_total,
      omvmValue: twinContext.omvm_value,
      engineRemainingPct: twinContext.engine_remaining_pct,
      opexAnnual: opexResult?.total_annual,
      clarityScore: opexResult?.clarity_score,
    });

    // 6) Check live traffic status (grounded vs active)
    let liveStatus = 'unknown';
    try {
      const trafficSnapshots = await base44.asServiceRole.entities.TrafficSnapshot.filter(
        { registration: passport.registration }, '-created_date', 1
      );
      if (trafficSnapshots.length > 0) {
        const lastSeen = new Date(trafficSnapshots[0].recorded_at || trafficSnapshots[0].created_date);
        const daysSince = (Date.now() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);
        liveStatus = daysSince > 90 ? 'grounded' : 'active';
      }
    } catch (_) { /* skip-if-missing */ }

    // 7) Generate narrative brief via LLM
    const narrativeContext = {
      twin: twinContext,
      skill_results: Object.entries(skillResults).map(([id, r]) => ({
        skill_id: id,
        result: r.result,
        confidence: r.confidence,
        evidence: r.evidence,
      })),
      health_score: healthScore,
      live_status: liveStatus,
    };

    const narrativePrompt = `As ABOS Finance Advisor, analyze this aircraft investment opportunity. Registration: ${passport.registration}. Investment Health Score: ${healthScore}/100. Live status: ${liveStatus}. Synthesize all skill results into an actionable investment brief.`;

    let narrative = null;
    let modelUsed = 'none';
    try {
      const llmResult = await generateNarrative(narrativePrompt, narrativeContext);
      narrative = llmResult.content;
      modelUsed = llmResult.model;
      // Try to parse JSON from narrative
      try {
        const jsonMatch = narrative.match(/\{[\s\S]*\}/);
        if (jsonMatch) narrative = JSON.parse(jsonMatch[0]);
      } catch (_) { /* keep as string */ }
    } catch (e) {
      narrative = { brief_summary: 'LLM unavailable — showing raw skill data only.', error: e.message };
      modelUsed = 'none';
    }

    const result = {
      investment_health_score: healthScore,
      live_status: liveStatus,
      deal_radar_eligible: healthScore >= 60 && twinContext.deal_label !== 'overpriced',
      twin_context: twinContext,
      skill_results: skillResults,
      ai_brief: narrative,
      recommended_skills_to_run: skillsToRun.map(s => s.skill_id),
    };

    return Response.json({
      ok: true,
      skill_id: 'abos.skill.investment_health.v1',
      version: 'v1',
      result,
      confidence: 0.75,
      evidence: [
        `Digital Twin: ${passport.registration} (ATI: ${twinContext.ati_total || 'N/A'}/120)`,
        `OMVM: $${twinContext.omvm_value ? twinContext.omvm_value.toLocaleString() : 'N/A'}`,
        `Engine remaining: ${twinContext.engine_remaining_pct != null ? twinContext.engine_remaining_pct + '%' : 'N/A'}`,
        `Live status: ${liveStatus}`,
        `Health score: ${healthScore}/100`,
        `Skills executed: ${Object.keys(skillResults).length}`,
        `LLM model: ${modelUsed}`,
      ],
      model_used: modelUsed,
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});