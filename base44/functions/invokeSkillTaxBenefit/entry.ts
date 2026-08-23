import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Skill: abos.skill.tax_benefit.v1 (RFC-232, Batch D)
 * Tax shield calculator for aircraft lease revenue.
 * Dependencies: B1 (OPEX).
 *
 * IMPORTANT: ATI Pro Tax must never silently fall back to CZ. A missing or
 * unsupported jurisdiction is an input error so the report cannot be built
 * against the wrong tax regime.
 */

const TAX_BRACKETS = {
  CZ: { personal: 0.15, corporate: 0.21, vat_recoverable: true },
  US: { personal: 0.24, corporate: 0.21, vat_recoverable: false },
  EU: { personal: 0.25, corporate: 0.25, vat_recoverable: true },
};

const USAGE_RELIEF_FACTORS = {
  private: 0.0,
  rental: 1.0,
  school: 0.85,
  business: 0.7,
};

function normalizeJurisdiction(inputs) {
  const explicit = String(
    inputs.jurisdiction ?? inputs.country ?? inputs.tax_jurisdiction ?? ''
  ).trim().toUpperCase();

  // A US state is sufficient to establish the US federal regime when the
  // caller does not separately provide jurisdiction.
  const state = String(inputs.state ?? inputs.us_state ?? '').trim().toUpperCase();
  if (state && /^[A-Z]{2}$/.test(state)) return 'US';

  if (explicit === 'UNITED STATES' || explicit === 'USA' || explicit === 'US') return 'US';
  if (explicit === 'CZECH REPUBLIC' || explicit === 'CZECHIA' || explicit === 'CZ') return 'CZ';
  if (explicit === 'EUROPEAN UNION' || explicit === 'EU') return 'EU';

  return explicit;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;

    const jurisdiction = normalizeJurisdiction(inputs);
    if (!TAX_BRACKETS[jurisdiction]) {
      return Response.json({
        ok: false,
        error: 'tax_jurisdiction_required',
        message: 'A supported tax jurisdiction is required. Provide jurisdiction (US/CZ/EU) or a US state.',
      }, { status: 400 });
    }

    const annualOpex = Math.max(0, Number(inputs.annual_opex ?? inputs.total_opex_annual) || 0);
    const leaseRevenue = Math.max(0, Number(inputs.lease_revenue ?? inputs.annual_lease_revenue) || 0);
    const taxBracketPct = Number(inputs.tax_bracket_pct);
    const usageType = String(inputs.usage_type || 'private').toLowerCase();
    const state = String(inputs.state ?? inputs.us_state ?? '').trim().toUpperCase() || null;

    const taxConfig = TAX_BRACKETS[jurisdiction];
    const effectiveBracket = Number.isFinite(taxBracketPct) && taxBracketPct > 0
      ? taxBracketPct / 100
      : taxConfig.corporate;
    const reliefFactor = Object.prototype.hasOwnProperty.call(USAGE_RELIEF_FACTORS, usageType)
      ? USAGE_RELIEF_FACTORS[usageType]
      : 0;

    const grossIncome = leaseRevenue;
    const deductibleCosts = annualOpex * reliefFactor;
    const taxableIncome = Math.max(0, grossIncome - deductibleCosts);
    const taxWithoutShield = grossIncome * effectiveBracket;
    const taxWithShield = taxableIncome * effectiveBracket;
    const taxSavingAnnual = taxWithoutShield - taxWithShield;
    const effectiveOwnershipCostAfterTax = annualOpex - taxSavingAnnual;
    const taxShieldPct = annualOpex > 0 ? (taxSavingAnnual / annualOpex) * 100 : 0;

    const result = {
      gross_income: Math.round(grossIncome),
      deductible_costs: Math.round(deductibleCosts),
      taxable_income: Math.round(taxableIncome),
      tax_saving_annual: Math.round(taxSavingAnnual),
      effective_ownership_cost_after_tax: Math.round(effectiveOwnershipCostAfterTax),
      tax_shield_pct: parseFloat(taxShieldPct.toFixed(2)),
      effective_tax_rate: parseFloat((effectiveBracket * 100).toFixed(2)),
      jurisdiction,
      state: jurisdiction === 'US' ? state : null,
      usage_type: usageType,
      relief_factor: reliefFactor,
      vat_recoverable: taxConfig.vat_recoverable,
    };

    return Response.json({
      ok: true,
      skill_id: 'abos.skill.tax_benefit.v1',
      version: 'v1',
      result,
      confidence: 0.8,
      evidence: [
        `Jurisdiction: ${jurisdiction}${state ? ` / ${state}` : ''} (${(effectiveBracket * 100).toFixed(1)}% tax rate)`,
        `Usage: ${usageType} (${(reliefFactor * 100).toFixed(0)}% deductibility)`,
        `Gross lease revenue: $${Math.round(grossIncome).toLocaleString()}`,
        `Deductible OPEX: $${Math.round(deductibleCosts).toLocaleString()}`,
        `Tax saving: $${Math.round(taxSavingAnnual).toLocaleString()} (${taxShieldPct.toFixed(1)}% shield)`,
        `Effective ownership cost after tax: $${Math.round(effectiveOwnershipCostAfterTax).toLocaleString()}`,
      ],
      model_used: 'engine:pure_math',
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});