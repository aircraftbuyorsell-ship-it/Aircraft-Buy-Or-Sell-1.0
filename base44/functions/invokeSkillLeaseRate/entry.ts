import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

function firstNumber(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return 0;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;

    const totalOpexAnnual = firstNumber(
      inputs.total_opex_annual, inputs.annual_opex, inputs.opex_annual,
      inputs.annual_total_opex, inputs.opex?.annual_total, inputs.opex?.total_annual,
      inputs.result?.total_opex_annual, inputs.result?.annual_opex
    );
    const desiredProfitMarginPct = Math.max(0,
      Number(inputs.desired_profit_margin_pct ?? inputs.profit_margin_pct) || 15);
    const estimatedAnnualHours = Math.max(1,
      Number(inputs.estimated_annual_hours ?? inputs.annual_hours ?? inputs.hours_per_year ?? inputs.result?.estimated_annual_hours) || 300);
    const insuranceSurcharge = firstNumber(
      inputs.insurance_surcharge, inputs.annual_insurance, inputs.insurance_annual,
      inputs.insurance?.annual, inputs.result?.insurance_surcharge, inputs.result?.annual_insurance
    );

    if (totalOpexAnnual <= 0) {
      return Response.json({ ok: false, error: 'lease_rate_opex_required',
        message: 'Lease-rate calculation requires annual OPEX from the OPEX skill.' }, { status: 400 });
    }

    const minDryLeaseRateHr = (totalOpexAnnual + insuranceSurcharge) / estimatedAnnualHours;
    const profitComponent = minDryLeaseRateHr * (desiredProfitMarginPct / 100);
    const recommendedLeaseRateHr = minDryLeaseRateHr + profitComponent;
    const monthlyGrossRevenueAtRate = recommendedLeaseRateHr * (estimatedAnnualHours / 12);
    const denominator = recommendedLeaseRateHr - (insuranceSurcharge / estimatedAnnualHours);
    const breakevenUtilizationHrs = denominator > 0 ? Math.ceil(totalOpexAnnual / denominator) : null;

    const result = {
      min_dry_lease_rate_hr: Math.round(minDryLeaseRateHr),
      recommended_lease_rate_hr: Math.round(recommendedLeaseRateHr),
      monthly_gross_revenue_at_rate: Math.round(monthlyGrossRevenueAtRate),
      breakeven_utilization_hrs: breakevenUtilizationHrs,
      profit_margin_pct: desiredProfitMarginPct,
      annual_opex: Math.round(totalOpexAnnual),
      insurance_surcharge: Math.round(insuranceSurcharge),
      estimated_annual_hours: estimatedAnnualHours,
    };

    return Response.json({ ok: true, skill_id: 'abos.skill.lease_rate.v1', version: 'v1', result,
      confidence: 0.85,
      evidence: [
        `Annual OPEX: $${Math.round(totalOpexAnnual).toLocaleString()}`,
        `Insurance surcharge: $${Math.round(insuranceSurcharge).toLocaleString()}`,
        `Estimated annual hours: ${estimatedAnnualHours}`,
        `Breakeven rate: $${Math.round(minDryLeaseRateHr)}/hr`,
        `Recommended rate (${desiredProfitMarginPct}% margin): $${Math.round(recommendedLeaseRateHr)}/hr`,
        `Monthly gross at recommended rate: $${Math.round(monthlyGrossRevenueAtRate).toLocaleString()}`,
        `Breakeven utilization: ${breakevenUtilizationHrs ?? 'n/a'} hrs/yr`,
      ],
      model_used: 'engine:pure_math', executed_at: new Date().toISOString() });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});