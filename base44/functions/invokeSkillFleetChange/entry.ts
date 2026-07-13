import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Skill: abos.skill.fleet_change.v1 (RFC-263, Batch D)
 * Flight School Fleet Change Calculator — "Just in Time" fleet rotation model.
 *
 * The school never owns aircraft long-term. It pays a flat monthly (paušal) covering
 * the lease + a JIT service fee. When an aircraft reaches TBO (out of hours), it is
 * sold at residual value and replaced with a fresh aircraft — the school always has
 * a fleet within TBO, never pays for overhauls.
 *
 * Computes: rotation interval, cost/hour with JIT, revenue, profit margin,
 * and savings vs traditional own-and-overhaul model.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;

    const aircraftPrice = Number(inputs.aircraft_price) || 350000;
    const leasePausalMonthly = Number(inputs.lease_pausal_monthly) || 3500;
    const jitServiceFeeMonthly = Number(inputs.jit_service_fee_monthly) || 800;
    const tboHours = Number(inputs.tbo_hours) || 2000;
    const annualHoursPerAircraft = Number(inputs.annual_hours_per_aircraft) || 600;
    const resaleValueAtTboPct = Number(inputs.resale_value_at_tbo_pct) || 55;
    const numAircraft = Math.max(1, Math.round(Number(inputs.num_aircraft) || 3));
    const fuelBurnGph = Number(inputs.fuel_burn_gph) || 10;
    const fuelPrice = Number(inputs.fuel_price) || 2.5;
    const annualMaintenancePerAircraft = Number(inputs.annual_maintenance_per_aircraft) || 12000;
    const annualInsurancePerAircraft = Number(inputs.annual_insurance_per_aircraft) || 8000;
    const rentalRateCharged = Number(inputs.rental_rate_charged) || 220; // billed to students per hour

    // ── Engine overhaul cost (for comparison) ──
    const engineOverhaulCost = Number(inputs.engine_overhaul_cost) || 30000;

    // ── Rotation interval ──
    const rotationIntervalYears = annualHoursPerAircraft > 0 ? tboHours / annualHoursPerAircraft : 0;

    // ── JIT model: school pays paušal + JIT fee, never overhaul ──
    const annualPausalPerAircraft = (leasePausalMonthly + jitServiceFeeMonthly) * 12;
    const totalAnnualPausal = annualPausalPerAircraft * numAircraft;
    const totalAnnualFuel = numAircraft * annualHoursPerAircraft * fuelBurnGph * fuelPrice;
    const totalAnnualMaintenance = numAircraft * annualMaintenancePerAircraft;
    const totalAnnualInsurance = numAircraft * annualInsurancePerAircraft;
    const totalAnnualCostJit = totalAnnualPausal + totalAnnualFuel + totalAnnualMaintenance + totalAnnualInsurance;

    const totalAnnualHours = numAircraft * annualHoursPerAircraft;
    const costPerHourJit = totalAnnualHours > 0 ? totalAnnualCostJit / totalAnnualHours : 0;

    // ── Resale credit (annualized) ──
    const resaleCreditPerAircraft = aircraftPrice * (resaleValueAtTboPct / 100);
    const annualizedResaleCredit = rotationIntervalYears > 0
      ? (resaleCreditPerAircraft / rotationIntervalYears) * numAircraft
      : 0;
    const netAnnualCostJit = totalAnnualCostJit - annualizedResaleCredit;
    const netCostPerHourJit = totalAnnualHours > 0 ? netAnnualCostJit / totalAnnualHours : 0;

    // ── Revenue (billed to students) ──
    const annualRevenue = totalAnnualHours * rentalRateCharged;
    const profitJit = annualRevenue - netAnnualCostJit;
    const marginPct = annualRevenue > 0 ? (profitJit / annualRevenue) * 100 : 0;

    // ── Traditional model: school owns, overhauls at TBO, keeps flying ──
    // Annualized overhaul cost = engineOverhaulCost / rotationIntervalYears per aircraft
    const annualizedOverhaulPerAircraft = rotationIntervalYears > 0 ? engineOverhaulCost / rotationIntervalYears : 0;
    // In traditional model, school finances the aircraft purchase instead of paying lease paušal
    // Approximate: annualized aircraft cost = aircraftPrice / usefulLifeYears (assume 15yr useful life)
    const usefulLifeYears = 15;
    const annualizedAircraftCostPerAircraft = aircraftPrice / usefulLifeYears;
    const totalAnnualCostTraditional =
      (annualizedAircraftCostPerAircraft + annualizedOverhaulPerAircraft) * numAircraft +
      totalAnnualFuel + totalAnnualMaintenance + totalAnnualInsurance;
    const netAnnualCostTraditional = totalAnnualCostTraditional - annualizedResaleCredit;
    const netCostPerHourTraditional = totalAnnualHours > 0 ? netAnnualCostTraditional / totalAnnualHours : 0;
    const profitTraditional = annualRevenue - netAnnualCostTraditional;
    const marginTraditional = annualRevenue > 0 ? (profitTraditional / annualRevenue) * 100 : 0;

    // ── JIT benefit ──
    const savingsPerHour = netCostPerHourTraditional - netCostPerHourJit;
    const annualSavings = savingsPerHour * totalAnnualHours;

    const result = {
      jit_model: {
        rotation_interval_years: Math.round(rotationIntervalYears * 10) / 10,
        annual_pausal_per_aircraft: Math.round(annualPausalPerAircraft),
        total_annual_pausal: Math.round(totalAnnualPausal),
        total_annual_fuel: Math.round(totalAnnualFuel),
        total_annual_maintenance: Math.round(totalAnnualMaintenance),
        total_annual_insurance: Math.round(totalAnnualInsurance),
        total_annual_cost: Math.round(totalAnnualCostJit),
        annualized_resale_credit: Math.round(annualizedResaleCredit),
        net_annual_cost: Math.round(netAnnualCostJit),
        cost_per_hour_gross: Math.round(costPerHourJit),
        cost_per_hour_net: Math.round(netCostPerHourJit),
        annual_revenue: Math.round(annualRevenue),
        profit: Math.round(profitJit),
        margin_pct: Math.round(marginPct * 10) / 10,
      },
      traditional_model: {
        annualized_aircraft_cost: Math.round(annualizedAircraftCostPerAircraft * numAircraft),
        annualized_overhaul_cost: Math.round(annualizedOverhaulPerAircraft * numAircraft),
        net_annual_cost: Math.round(netAnnualCostTraditional),
        cost_per_hour_net: Math.round(netCostPerHourTraditional),
        profit: Math.round(profitTraditional),
        margin_pct: Math.round(marginTraditional * 10) / 10,
      },
      comparison: {
        savings_per_hour: Math.round(savingsPerHour),
        annual_savings: Math.round(annualSavings),
        jit_advantage: savingsPerHour > 0
          ? 'JIT fleet rotation saves money and keeps fleet fresh'
          : 'Traditional ownership is cheaper — review paušal pricing',
      },
      fleet: {
        num_aircraft: numAircraft,
        total_annual_hours: Math.round(totalAnnualHours),
        tbo_hours: tboHours,
        aircraft_replaced_per_year: Math.round((numAircraft / rotationIntervalYears) * 10) / 10,
      },
    };

    return Response.json({
      ok: true,
      skill_id: 'abos.skill.fleet_change.v1',
      version: 'v1',
      result,
      confidence: 0.85,
      evidence: [
        `${numAircraft} aircraft, ${annualHoursPerAircraft} hrs/yr each`,
        `Rotation every ${Math.round(rotationIntervalYears * 10) / 10} years (TBO ${tboHours}h)`,
        `JIT paušal: $${Math.round(annualPausalPerAircraft).toLocaleString()}/yr per aircraft`,
        `JIT net cost: $${Math.round(netCostPerHourJit)}/hr`,
        `Traditional net cost: $${Math.round(netCostPerHourTraditional)}/hr`,
        `Revenue: $${Math.round(annualRevenue).toLocaleString()}/yr`,
        `JIT margin: ${Math.round(marginPct * 10) / 10}%`,
        `Annual savings: $${Math.round(annualSavings).toLocaleString()}`,
      ],
      model_used: 'engine:pure_math',
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});