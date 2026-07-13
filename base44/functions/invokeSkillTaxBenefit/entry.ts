import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Skill: abos.skill.tax_benefit.v1 (RFC-232, Batch D)
 * Tax shield calculator for aircraft lease revenue.
 * Dependencies: B1 (OPEX).
 * Supports CZ, US, EU jurisdictions with rental/school usage tax relief.
 */

const TAX_BRACKETS = {
  CZ: { personal: 0.15, corporate: 0.21, vat_recoverable: true },
  US: { personal: 0.24, corporate: 0.21, vat_recoverable: false },
  EU: { personal: 0.25, corporate: 0.25, vat_recoverable: true },
};

const USAGE_RELIEF_FACTORS = {
  private:  0.0,
  rental:   1.0,
  school:   0.85,
  business: 0.7,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;

    const annualOpex = Math.max(0, Number(inputs.annual_opex) || 0);
    const leaseRevenue = Math.max(0, Number(inputs.lease_revenue) || 0);
    const taxBracketPct = Number(inputs.tax_bracket_pct) || null;
    const jurisdiction = (inputs.jurisdiction || 'CZ').toUpperCase();
    const usageType = inputs.usage_type || 'private';

    const taxConfig = TAX_BRACKETS[jurisdiction] || TAX_BRACKETS.CZ;
    const effectiveBracket = taxBracketPct !== null ? taxBracketPct / 100 : taxConfig.corporate;
    const reliefFactor = USAGE_RELIEF_FACTORS[usageType] || 0;

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
        `Jurisdiction: ${jurisdiction} (${(effectiveBracket * 100).toFixed(1)}% tax rate)`,
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