import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Skill: abos.skill.mro_schedule.v1 (RFC-253, Batch C)
 * Deterministic MRO (Maintenance, Repair, Overhaul) time calculator for each aircraft part.
 * Computes calendar time estimates for every maintenance event based on aircraft class,
 * utilization, and labor tier.
 * Supports: annual inspection, 100-hour, engine OH, prop OH, avionics, paint, interior, detailing.
 */

const AIRCRAFT_CLASSES = {
  sep: { label: "Single-Engine Piston", annualHours: 12, hundredHourHours: 10, paintHours: 80, interiorHours: 30, avionicsBase: 16 },
  mep: { label: "Multi-Engine Piston", annualHours: 18, hundredHourHours: 15, paintHours: 100, interiorHours: 40, avionicsBase: 20 },
  turboprop: { label: "Turboprop", annualHours: 30, hundredHourHours: 25, paintHours: 160, interiorHours: 60, avionicsBase: 30 },
  jet: { label: "Light Jet", annualHours: 40, hundredHourHours: 35, paintHours: 200, interiorHours: 80, avionicsBase: 40 },
  helicopter: { label: "Helicopter", annualHours: 25, hundredHourHours: 20, paintHours: 60, interiorHours: 20, avionicsBase: 18 },
};

const LABOR_RATES = { regional: 85, mid_tier: 105, premium: 125, specialized: 150 };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;
    const aircraftClass = inputs.aircraft_class || 'sep';
    const laborTier = inputs.labor_tier || 'mid_tier';
    const annualHours = inputs.annual_hours || 200;
    const engineTBO = inputs.engine_tbo || 2000;
    const currentEngineHours = inputs.engine_hours || 0;
    const propTBO = inputs.prop_tbo || 2400;
    const currentPropHours = inputs.prop_hours || 0;
    const partsToInclude = inputs.parts || ['annual', 'hundred_hour', 'engine_overhaul', 'prop_overhaul', 'paint', 'interior', 'detailing', 'avionics_check'];

    const ac = AIRCRAFT_CLASSES[aircraftClass] || AIRCRAFT_CLASSES.sep;
    const laborRate = LABOR_RATES[laborTier] || 105;
    const shopDayHours = 8;

    // Calculate time-to-event for TBO-based items
    const yearsToEngineTBO = annualHours > 0 ? (engineTBO - currentEngineHours) / annualHours : 999;
    const yearsToPropTBO = annualHours > 0 ? (propTBO - currentPropHours) / annualHours : 999;
    const hundredHourInterval = 100;
    const hundredHoursPerYear = annualHours / hundredHourInterval;

    const parts = [];

    // Annual inspection
    if (partsToInclude.includes('annual')) {
      const hours = ac.annualHours;
      const cost = hours * laborRate;
      parts.push({
        part: "Annual Inspection",
        frequency: "Every 12 months",
        labor_hours: hours,
        labor_cost: cost,
        calendar_days: Math.ceil(hours / shopDayHours),
        next_due_years: 1.0,
        description: "Complete airframe inspection per FAR 43 Appendix D",
      });
    }

    // 100-hour inspection
    if (partsToInclude.includes('hundred_hour')) {
      const hours = ac.hundredHourHours;
      const cost = hours * laborRate;
      parts.push({
        part: "100-Hour Inspection",
        frequency: `Every 100 hrs (${hundredHoursPerYear.toFixed(1)}/yr)`,
        labor_hours: hours,
        labor_cost: cost,
        calendar_days: Math.ceil(hours / shopDayHours),
        next_due_years: annualHours > 0 ? 100 / annualHours : null,
        description: "Required for commercial/rental operations",
      });
    }

    // Engine overhaul
    if (partsToInclude.includes('engine_overhaul')) {
      const demountHours = 10;
      const overhaulLaborHours = aircraftClass === 'turboprop' || aircraftClass === 'jet' ? 200 : 40;
      const remountHours = 14;
      const testCellHours = 4;
      const totalOH = demountHours + overhaulLaborHours + remountHours + testCellHours + 4;
      const cost = totalOH * laborRate;
      parts.push({
        part: "Engine Overhaul",
        frequency: `At TBO (${engineTBO} hrs)`,
        labor_hours: totalOH,
        labor_cost: cost,
        calendar_days: Math.ceil(totalOH / shopDayHours),
        next_due_years: Math.round(yearsToEngineTBO * 10) / 10,
        description: `Engine at ${currentEngineHours}/${engineTBO} hrs — ${Math.round(yearsToEngineTBO * 10) / 10} years at ${annualHours} hr/yr`,
      });
    }

    // Prop overhaul
    if (partsToInclude.includes('prop_overhaul')) {
      const totalOH = 3 + 8 + 4 + 2 + 1; // demount + OH + remount + balance + docs
      const cost = totalOH * laborRate;
      parts.push({
        part: "Propeller Overhaul",
        frequency: `At TBO (${propTBO} hrs)`,
        labor_hours: totalOH,
        labor_cost: cost,
        calendar_days: Math.ceil(totalOH / shopDayHours),
        next_due_years: Math.round(yearsToPropTBO * 10) / 10,
        description: `Prop at ${currentPropHours}/${propTBO} hrs — ${Math.round(yearsToPropTBO * 10) / 10} years at ${annualHours} hr/yr`,
      });
    }

    // Paint
    if (partsToInclude.includes('paint')) {
      const hours = ac.paintHours;
      const cost = hours * laborRate;
      parts.push({
        part: "Exterior Paint",
        frequency: "Every 7-10 years",
        labor_hours: hours,
        labor_cost: cost,
        calendar_days: Math.ceil(hours / shopDayHours),
        next_due_years: 7,
        description: "Strip and repaint — corrosion protection and aesthetics",
      });
    }

    // Interior
    if (partsToInclude.includes('interior')) {
      const hours = ac.interiorHours;
      const cost = hours * laborRate;
      parts.push({
        part: "Interior Refurbishment",
        frequency: "Every 8-12 years",
        labor_hours: hours,
        labor_cost: cost,
        calendar_days: Math.ceil(hours / shopDayHours),
        next_due_years: 8,
        description: "Seats, carpet, headliner, panels",
      });
    }

    // Detailing
    if (partsToInclude.includes('detailing')) {
      const hours = aircraftClass === 'turboprop' || aircraftClass === 'jet' ? 20 : 8;
      const cost = hours * 75; // detailing has lower rate
      parts.push({
        part: "Aircraft Detailing",
        frequency: "Quarterly",
        labor_hours: hours,
        labor_cost: cost,
        calendar_days: Math.ceil(hours / shopDayHours),
        next_due_years: 0.25,
        description: "Wash, wax, interior clean, brightwork polish",
      });
    }

    // Avionics check
    if (partsToInclude.includes('avionics_check')) {
      const hours = ac.avionicsBase;
      const cost = hours * laborRate;
      parts.push({
        part: "Avionics Bench Check",
        frequency: "Every 24 months (FAR 91.411/413)",
        labor_hours: hours,
        labor_cost: cost,
        calendar_days: Math.ceil(hours / shopDayHours),
        next_due_years: 2.0,
        description: "Transponder + altimeter system certification",
      });
    }

    // Summary
    const totalAnnualCost = parts.reduce((sum, p) => sum + (p.frequency.includes('12 months') || p.frequency.includes('Quarterly') || p.frequency.includes('100 hrs') ? p.labor_cost : 0), 0);
    const totalLaborHours = parts.reduce((sum, p) => sum + p.labor_hours, 0);
    const totalCalendarDays = parts.reduce((sum, p) => sum + p.calendar_days, 0);

    return Response.json({
      ok: true,
      skill_id: 'abos.skill.mro_schedule.v1',
      version: 'v1',
      result: {
        aircraft_class: ac.label,
        annual_hours: annualHours,
        labor_rate: laborRate,
        parts,
        total_annual_recurring_cost: totalAnnualCost,
        total_labor_hours_all: totalLaborHours,
        total_calendar_days_all: totalCalendarDays,
      },
      confidence: 0.82,
      evidence: [
        `Aircraft class: ${ac.label}`,
        `Utilization: ${annualHours} hr/yr`,
        `Labor rate: $${laborRate}/hr`,
        `Engine: ${currentEngineHours}/${engineTBO} hrs (${Math.round(yearsToEngineTBO*10)/10} yr to TBO)`,
        `Prop: ${currentPropHours}/${propTBO} hrs (${Math.round(yearsToPropTBO*10)/10} yr to TBO)`,
        `${parts.length} MRO events calculated`,
        `Annual recurring cost: $${totalAnnualCost.toLocaleString()}`,
      ],
      model_used: 'engine:pure_math',
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});