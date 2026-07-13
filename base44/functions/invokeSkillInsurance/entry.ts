import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Skill: abos.skill.insurance_estimate.v1 (RFC-212, Batch B)
 * Migrated from InsuranceCalculator.jsx — PS-3.2 compliance.
 * Pure deterministic math, no LLM. Latency budget < 500ms.
 */

const AIRCRAFT_TYPES = [
  { label: "Single-Engine Piston (SEP)", value: "sep", baseRate: 0.012 },
  { label: "Multi-Engine Piston (MEP)", value: "mep", baseRate: 0.016 },
  { label: "Turboprop", value: "turboprop", baseRate: 0.020 },
  { label: "Light Jet", value: "light_jet", baseRate: 0.025 },
  { label: "Mid/Heavy Jet", value: "heavy_jet", baseRate: 0.030 },
  { label: "Helicopter", value: "helicopter", baseRate: 0.028 },
];

const USAGE_OPTIONS = [
  { label: "Pleasure / Personal", factor: 1.0 },
  { label: "Business", factor: 1.15 },
  { label: "Instruction / Training", factor: 1.45 },
  { label: "Charter / Part 135", factor: 1.80 },
  { label: "Agricultural", factor: 2.10 },
];

const PILOT_EXPERIENCE = [
  { label: "Low (<250 hrs)", factor: 1.40 },
  { label: "Moderate (250-1000 hrs)", factor: 1.10 },
  { label: "Experienced (1000-3000 hrs)", factor: 0.95 },
  { label: "Veteran (3000+ hrs)", factor: 0.85 },
];

const COVERAGE_TYPES = [
  { label: "Liability Only", factor: 0.45 },
  { label: "Liability + Hull (Standard)", factor: 1.0 },
  { label: "Full Coverage + Passenger", factor: 1.35 },
];

const DEDUCTIBLE_OPTIONS = [
  { label: "$0", factor: 1.12 },
  { label: "$1,000", factor: 1.05 },
  { label: "$2,500", factor: 1.0 },
  { label: "$5,000", factor: 0.92 },
  { label: "$10,000", factor: 0.85 },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;

    const hullValue = Math.max(0, Number(inputs.hull_value) || 250000);
    const aircraftType = inputs.aircraft_type || 'sep';
    const usageLabel = inputs.usage_type || 'Pleasure / Personal';
    const pilotExpLabel = inputs.pilot_experience || 'Moderate (250-1000 hrs)';
    const coverageLabel = inputs.coverage_type || 'Liability + Hull (Standard)';
    const deductibleLabel = inputs.deductible || '$2,500';

    const acType = AIRCRAFT_TYPES.find(a => a.value === aircraftType) || AIRCRAFT_TYPES[0];
    const usageOpt = USAGE_OPTIONS.find(u => u.label === usageLabel) || USAGE_OPTIONS[0];
    const pilotOpt = PILOT_EXPERIENCE.find(p => p.label === pilotExpLabel) || PILOT_EXPERIENCE[1];
    const covOpt = COVERAGE_TYPES.find(c => c.label === coverageLabel) || COVERAGE_TYPES[1];
    const dedOpt = DEDUCTIBLE_OPTIONS.find(d => d.label === deductibleLabel) || DEDUCTIBLE_OPTIONS[2];

    const basePremium = hullValue * acType.baseRate;
    const adjusted = basePremium * usageOpt.factor * pilotOpt.factor * covOpt.factor * dedOpt.factor;
    const annual = Math.round(adjusted);
    const monthly = Math.round(adjusted / 12);
    const liabilityLimit = coverageLabel.includes("Liability") ? 1000000 : 0;
    const ratePct = ((annual / hullValue) * 100).toFixed(2);

    const result = {
      annual_premium: annual,
      monthly_premium: monthly,
      effective_rate_pct: parseFloat(ratePct),
      liability_limit: liabilityLimit,
      base_rate: acType.baseRate,
      aircraft_type_label: acType.label,
      breakdown: {
        base_premium: Math.round(basePremium),
        usage_factor: usageOpt.factor,
        pilot_factor: pilotOpt.factor,
        coverage_factor: covOpt.factor,
        deductible_factor: dedOpt.factor,
      },
    };

    return Response.json({
      ok: true,
      skill_id: 'abos.skill.insurance_estimate.v1',
      version: 'v1',
      result,
      confidence: 1.0,
      evidence: [
        `Hull value: $${hullValue.toLocaleString()}`,
        `Aircraft type: ${acType.label} (base rate ${(acType.baseRate * 100).toFixed(2)}%)`,
        `Usage factor: ${usageOpt.factor}× (${usageOpt.label})`,
        `Pilot factor: ${pilotOpt.factor}× (${pilotOpt.label})`,
        `Coverage factor: ${covOpt.factor}×`,
        `Deductible factor: ${dedOpt.factor}× (${dedOpt.label})`,
      ],
      model_used: 'engine:pure_math',
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});