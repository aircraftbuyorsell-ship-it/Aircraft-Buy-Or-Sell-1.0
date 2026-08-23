import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Skill: abos.skill.fractional_ownership.v1 (RFC-261, Batch D)
 * Fractional ownership cost calculator — buy a share of an aircraft vs whole ownership vs rental.
 * Determines per-owner purchase share, monthly financing, fixed/variable split, and net hourly cost
 * after resale credit. Supports comparison against hourly rental.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;

    const aircraftPrice = Number(inputs.aircraft_price) || 250000;
    const numOwners = Math.max(1, Math.round(Number(inputs.num_owners) || 2));
    const annualHoursPerOwner = Number(inputs.annual_hours_per_owner) || 100;
    const downPaymentPct = Number(inputs.down_payment_pct) || 20;
    const financingRatePct = Number(inputs.financing_rate_pct) || 6;
    const loanTermYears = Number(inputs.loan_term_years) || 10;
    const fuelBurnGph = Number(inputs.fuel_burn_gph) || 10;
    const fuelPrice = Number(inputs.fuel_price) || 2.5;
    const annualMaintenance = Number(inputs.annual_maintenance) || 8000;
    const annualInsurance = Number(inputs.annual_insurance) || 4000;
    const annualHangar = Number(inputs.annual_hangar) || 6000;
    const resaleValuePct = Number(inputs.resale_value_pct) || 60;
    const ownershipYears = Number(inputs.ownership_years) || 5;
    const rentalRateHourly = Number(inputs.rental_rate_hourly) || 0;

    // ── Share economics ──
    const sharePct = 1 / numOwners;
    const sharePurchase = aircraftPrice * sharePct;
    const downPayment = sharePurchase * (downPaymentPct / 100);
    const financedAmount = sharePurchase - downPayment;

    // ── Amortized monthly financing ──
    const monthlyRate = financingRatePct / 100 / 12;
    const numPayments = loanTermYears * 12;
    let monthlyFinancing = 0;
    if (financedAmount > 0 && monthlyRate > 0) {
      monthlyFinancing = financedAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -numPayments));
    } else if (financedAmount > 0) {
      monthlyFinancing = financedAmount / numPayments;
    }
    const annualFinancing = monthlyFinancing * 12;

    // ── Fixed costs (shared pro-rata) ──
    const totalFixedAnnual = annualMaintenance + annualInsurance + annualHangar;
    const shareFixedAnnual = totalFixedAnnual * sharePct;

    // ── Variable costs (per owner, based on own hours) ──
    const annualVariable = annualHoursPerOwner * fuelBurnGph * fuelPrice;

    // ── Totals ──
    const totalAnnualPerOwner = annualFinancing + shareFixedAnnual + annualVariable;
    const hourlyCost = annualHoursPerOwner > 0 ? totalAnnualPerOwner / annualHoursPerOwner : 0;
    const totalHours = annualHoursPerOwner * ownershipYears;
    const totalCostOverPeriod = totalAnnualPerOwner * ownershipYears;

    // ── Resale credit ──
    const resaleShare = aircraftPrice * (resaleValuePct / 100) * sharePct;
    const netCost = totalCostOverPeriod - resaleShare;
    const netHourly = totalHours > 0 ? netCost / totalHours : 0;

    // ── Rental comparison ──
    let rentalComparison = null;
    let savingsVsRental = null;
    if (rentalRateHourly > 0) {
      rentalComparison = rentalRateHourly * totalHours;
      savingsVsRental = rentalComparison - netCost;
    }

    const result = {
      num_owners: numOwners,
      share_pct: Math.round(sharePct * 10000) / 100,
      share_purchase: Math.round(sharePurchase),
      down_payment: Math.round(downPayment),
      financed_amount: Math.round(financedAmount),
      monthly_financing: Math.round(monthlyFinancing),
      annual_financing: Math.round(annualFinancing),
      share_fixed_annual: Math.round(shareFixedAnnual),
      annual_variable: Math.round(annualVariable),
      total_annual_per_owner: Math.round(totalAnnualPerOwner),
      hourly_cost: Math.round(hourlyCost),
      ownership_years: ownershipYears,
      total_hours: Math.round(totalHours),
      total_cost_over_period: Math.round(totalCostOverPeriod),
      resale_share: Math.round(resaleShare),
      net_cost: Math.round(netCost),
      net_hourly: Math.round(netHourly),
      rental_comparison: rentalComparison ? Math.round(rentalComparison) : null,
      savings_vs_rental: savingsVsRental != null ? Math.round(savingsVsRental) : null,
      recommendation: savingsVsRental != null
        ? (savingsVsRental > 0 ? 'Buying saves money vs rental' : 'Rental is cheaper for this usage level')
        : 'Provide rental_rate_hourly for comparison',
    };

    return Response.json({
      ok: true,
      skill_id: 'abos.skill.fractional_ownership.v1',
      version: 'v1',
      result,
      confidence: 0.88,
      evidence: [
        `${numOwners} owners (${Math.round(sharePct * 100)}% share each)`,
        `Share purchase: $${Math.round(sharePurchase).toLocaleString()}`,
        `Monthly financing: $${Math.round(monthlyFinancing).toLocaleString()}`,
        `Fixed/owner: $${Math.round(shareFixedAnnual).toLocaleString()}/yr`,
        `Variable: $${Math.round(annualVariable).toLocaleString()}/yr`,
        `Net hourly (after resale): $${Math.round(netHourly).toLocaleString()}`,
        ...(rentalComparison ? [`Rental comparison: $${Math.round(rentalComparison).toLocaleString()}`] : []),
      ],
      model_used: 'engine:pure_math',
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});