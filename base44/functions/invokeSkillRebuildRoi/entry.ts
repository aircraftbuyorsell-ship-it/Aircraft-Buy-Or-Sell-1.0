import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Skill: abos.skill.rebuild_roi.v1 (RFC-231, Batch D)
 * Deterministic core math + optional LLM narrative via invokeSkill gateway.
 * Dependencies: A1 (OMVM), B1 (OPEX), C1-C3 (upgrade costs).
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;

    const purchasePrice = Math.max(0, Number(inputs.purchase_price) || 0);
    const rebuildCost = Math.max(0, Number(inputs.rebuild_cost) || 0);
    const targetSellPrice = Math.max(0, Number(inputs.target_sell_price) || 0);
    const holdingMonths = Math.max(1, Number(inputs.holding_months) || 12);
    const opexAnnual = Math.max(0, Number(inputs.opex_annual) || 0);
    const omvmCurrent = Math.max(0, Number(inputs.omvm_current) || 0);

    const totalInvestment = purchasePrice + rebuildCost + (opexAnnual * (holdingMonths / 12));
    const projectedROI = totalInvestment > 0 ? ((targetSellPrice - totalInvestment) / totalInvestment) * 100 : 0;
    const breakevenSellPrice = totalInvestment;
    const monthlyOpex = opexAnnual / 12;
    const monthsToBreakeven = targetSellPrice > totalInvestment
      ? 0
      : monthlyOpex > 0 ? Math.ceil((totalInvestment - targetSellPrice) / monthlyOpex) : 0;

    let dealVerdict;
    if (projectedROI > 25) dealVerdict = 'hot deal';
    else if (projectedROI > 10) dealVerdict = 'good deal';
    else if (projectedROI > -5) dealVerdict = 'fair';
    else dealVerdict = 'overpriced';

    const omvmDelta = targetSellPrice - omvmCurrent;
    const omvmDeltaPct = omvmCurrent > 0 ? (omvmDelta / omvmCurrent) * 100 : 0;

    const result = {
      total_investment: Math.round(totalInvestment),
      projected_roi_pct: parseFloat(projectedROI.toFixed(2)),
      breakeven_sell_price: Math.round(breakevenSellPrice),
      months_to_breakeven: monthsToBreakeven,
      deal_verdict: dealVerdict,
      omvm_delta: Math.round(omvmDelta),
      omvm_delta_pct: parseFloat(omvmDeltaPct.toFixed(2)),
      cost_breakdown: {
        purchase: Math.round(purchasePrice),
        rebuild: Math.round(rebuildCost),
        opex_holding: Math.round(opexAnnual * (holdingMonths / 12)),
      },
      target_sell_price: Math.round(targetSellPrice),
      projected_profit: Math.round(targetSellPrice - totalInvestment),
      holding_months: holdingMonths,
    };

    return Response.json({
      ok: true,
      skill_id: 'abos.skill.rebuild_roi.v1',
      version: 'v1',
      result,
      confidence: 0.85,
      evidence: [
        `Purchase: $${Math.round(purchasePrice).toLocaleString()}`,
        `Rebuild: $${Math.round(rebuildCost).toLocaleString()}`,
        `OPEX holding (${holdingMonths}mo): $${Math.round(opexAnnual * (holdingMonths / 12)).toLocaleString()}`,
        `Total investment: $${Math.round(totalInvestment).toLocaleString()}`,
        `Target sell: $${Math.round(targetSellPrice).toLocaleString()}`,
        `Projected ROI: ${projectedROI.toFixed(1)}% → ${dealVerdict}`,
        omvmCurrent > 0 ? `OMVM delta: ${omvmDeltaPct.toFixed(1)}% vs current valuation` : 'OMVM not provided',
      ],
      model_used: 'engine:pure_math',
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});