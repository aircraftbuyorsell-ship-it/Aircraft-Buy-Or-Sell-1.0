import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Skill: abos.skill.timebuilding_buy.v1 (RFC-262, Batch D)
 * Timebuilding aircraft buy calculator — for a pilot building hours toward a certificate.
 * Compares: buy whole, buy fractional, or rent. Computes break-even and recommends cheapest path.
 * Supports single user (whole ownership) or fractional user (shared purchase).
 */

// ── Shared fractional calc (inlined to avoid cross-function imports) ──
function computeOwnershipCost(opts) {
  const {
    aircraftPrice, numOwners, annualHoursPerOwner, downPaymentPct, financingRatePct,
    loanTermYears, fuelBurnGph, fuelPrice, annualFixed, resaleValuePct, ownershipYears,
  } = opts;

  const sharePct = 1 / numOwners;
  const sharePurchase = aircraftPrice * sharePct;
  const downPayment = sharePurchase * (downPaymentPct / 100);
  const financedAmount = sharePurchase - downPayment;
  const monthlyRate = financingRatePct / 100 / 12;
  const numPayments = loanTermYears * 12;
  let monthlyFinancing = 0;
  if (financedAmount > 0 && monthlyRate > 0) {
    monthlyFinancing = financedAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -numPayments));
  } else if (financedAmount > 0) {
    monthlyFinancing = financedAmount / numPayments;
  }
  const annualFinancing = monthlyFinancing * 12;
  const shareFixedAnnual = annualFixed * sharePct;
  const annualVariable = annualHoursPerOwner * fuelBurnGph * fuelPrice;
  const totalAnnual = annualFinancing + shareFixedAnnual + annualVariable;
  const totalHours = annualHoursPerOwner * ownershipYears;
  const totalCostOverPeriod = totalAnnual * ownershipYears;
  const resaleShare = aircraftPrice * (resaleValuePct / 100) * sharePct;
  const netCost = totalCostOverPeriod - resaleShare;
  const netHourly = totalHours > 0 ? netCost / totalHours : 0;

  return { sharePurchase, downPayment, monthlyFinancing, annualFinancing, shareFixedAnnual, annualVariable, totalAnnual, totalHours, totalCostOverPeriod, resaleShare, netCost, netHourly };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;

    const totalHoursNeeded = Number(inputs.total_hours_needed) || 250;
    const annualHours = Number(inputs.annual_hours) || 150;
    const aircraftPrice = Number(inputs.aircraft_price) || 120000;
    const fractionalShares = Math.max(1, Math.round(Number(inputs.fractional_shares) || 1)); // 1=whole, 2=half, 4=quarter
    const rentalRateHourly = Number(inputs.rental_rate_hourly) || 180;
    const fuelBurnGph = Number(inputs.fuel_burn_gph) || 10;
    const fuelPrice = Number(inputs.fuel_price) || 2.5;
    const annualFixed = Number(inputs.annual_fixed) || 18000; // maintenance + insurance + hangar (whole aircraft)
    const resaleValuePct = Number(inputs.resale_value_pct) || 65;
    const financingRatePct = Number(inputs.financing_rate_pct) || 6;
    const downPaymentPct = Number(inputs.down_payment_pct) || 20;
    const loanTermYears = Number(inputs.loan_term_years) || 10;

    const yearsToBuild = totalHoursNeeded / annualHours;
    const ownershipYears = Math.ceil(yearsToBuild);

    const baseOpts = {
      aircraftPrice, annualHoursPerOwner: annualHours, downPaymentPct, financingRatePct,
      loanTermYears, fuelBurnGph, fuelPrice, annualFixed, resaleValuePct, ownershipYears,
    };

    // ── Buy whole ──
    const whole = computeOwnershipCost({ ...baseOpts, numOwners: 1 });

    // ── Buy fractional ──
    const fractional = computeOwnershipCost({ ...baseOpts, numOwners: fractionalShares });

    // ── Rent ──
    const rentCost = rentalRateHourly * totalHoursNeeded;

    // ── Break-even: hours at which buying whole = renting ──
    // netHourly_whole * hours = rentalRate * hours  → break_even when netHourly = rentalRate
    // But fixed costs matter. Solve: whole.netCost / totalHoursNeeded vs rentalRate
    // Simpler: break_even_hours = whole.netCost / rentalRateHourly (when cumulative buy cost = cumulative rent cost)
    const breakEvenHoursWhole = rentalRateHourly > 0 ? whole.netCost / rentalRateHourly : null;
    const breakEvenHoursFractional = rentalRateHourly > 0 ? fractional.netCost / rentalRateHourly : null;

    // ── Recommendation ──
    const scenarios = [
      { label: 'Buy Whole', netCost: whole.netCost, netHourly: whole.netHourly },
      { label: `Buy Fractional (1/${fractionalShares})`, netCost: fractional.netCost, netHourly: fractional.netHourly },
      { label: 'Rent', netCost: rentCost, netHourly: rentalRateHourly },
    ];
    scenarios.sort((a, b) => a.netCost - b.netCost);
    const cheapest = scenarios[0];

    const result = {
      total_hours_needed: totalHoursNeeded,
      annual_hours: annualHours,
      years_to_build: Math.round(yearsToBuild * 10) / 10,
      ownership_years: ownershipYears,
      buy_whole: {
        share_purchase: Math.round(whole.sharePurchase),
        down_payment: Math.round(whole.downPayment),
        monthly_financing: Math.round(whole.monthlyFinancing),
        total_cost: Math.round(whole.totalCostOverPeriod),
        resale_credit: Math.round(whole.resaleShare),
        net_cost: Math.round(whole.netCost),
        net_hourly: Math.round(whole.netHourly),
      },
      buy_fractional: {
        shares: fractionalShares,
        share_pct: Math.round((100 / fractionalShares) * 10) / 10,
        share_purchase: Math.round(fractional.sharePurchase),
        down_payment: Math.round(fractional.downPayment),
        monthly_financing: Math.round(fractional.monthlyFinancing),
        total_cost: Math.round(fractional.totalCostOverPeriod),
        resale_credit: Math.round(fractional.resaleShare),
        net_cost: Math.round(fractional.netCost),
        net_hourly: Math.round(fractional.netHourly),
      },
      rent: {
        hourly_rate: rentalRateHourly,
        total_cost: Math.round(rentCost),
      },
      break_even_hours_whole: breakEvenHoursWhole ? Math.round(breakEvenHoursWhole) : null,
      break_even_hours_fractional: breakEvenHoursFractional ? Math.round(breakEvenHoursFractional) : null,
      recommendation: cheapest.label,
      cheapest_net_cost: Math.round(cheapest.netCost),
      savings_vs_rent: Math.round(rentCost - cheapest.netCost),
    };

    return Response.json({
      ok: true,
      skill_id: 'abos.skill.timebuilding_buy.v1',
      version: 'v1',
      result,
      confidence: 0.85,
      evidence: [
        `${totalHoursNeeded} hrs needed over ${Math.round(yearsToBuild * 10) / 10} years`,
        `Buy whole: $${Math.round(whole.netCost).toLocaleString()} net ($${Math.round(whole.netHourly)}/hr)`,
        `Buy 1/${fractionalShares}: $${Math.round(fractional.netCost).toLocaleString()} net ($${Math.round(fractional.netHourly)}/hr)`,
        `Rent: $${Math.round(rentCost).toLocaleString()} ($${rentalRateHourly}/hr)`,
        `Break-even (whole): ${breakEvenHoursWhole ? Math.round(breakEvenHoursWhole) : 'N/A'} hrs`,
        `Recommendation: ${cheapest.label}`,
        `Savings vs rent: $${Math.round(rentCost - cheapest.netCost).toLocaleString()}`,
      ],
      model_used: 'engine:pure_math',
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});