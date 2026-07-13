import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Skill: abos.skill.leasing.v1 (RFC-213, Batch B)
 * Migrated from LeasingCalculatorPanel.jsx — PS-3.2 compliance.
 * Pure deterministic math, no LLM. Latency budget < 500ms.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const inputs = body.inputs || body;

    const aircraftPrice = Math.max(0, Number(inputs.aircraft_value) || 850000);
    const downPaymentPct = Math.max(0, Math.min(50, Number(inputs.down_payment_pct) || 15));
    const interestRate = Math.max(0, Number(inputs.interest_rate_annual) || 7.5);
    const termMonths = Math.max(12, Math.min(120, Number(inputs.loan_term_months) || 60));
    const residualPct = Math.max(0, Math.min(80, Number(inputs.residual_value_pct) || 45));
    const salesTaxPct = Math.max(0, Number(inputs.sales_tax_pct) || 0);

    const downPayment = aircraftPrice * (downPaymentPct / 100);
    const financedAmount = aircraftPrice - downPayment;
    const residualValue = aircraftPrice * (residualPct / 100);
    const monthlyRate = interestRate / 100 / 12;
    const depreciationFinanced = financedAmount - residualValue;
    const depreciationMonthly = depreciationFinanced / termMonths;
    const avgBalance = (financedAmount + residualValue) / 2;
    const interestMonthly = avgBalance * monthlyRate;
    const baseMonthly = depreciationMonthly + interestMonthly;
    const taxMonthly = baseMonthly * (salesTaxPct / 100);
    const totalMonthly = baseMonthly + taxMonthly;
    const totalPayments = totalMonthly * termMonths;
    const totalCost = totalPayments + downPayment + residualValue;
    const totalInterest = totalPayments - depreciationFinanced;
    const ltvRatio = financedAmount / aircraftPrice;
    const breakevenLeaseRateHr = totalMonthly / 30;

    const schedule = [];
    let balance = financedAmount;
    for (let m = 1; m <= Math.min(termMonths, 12); m++) {
      const interest = balance * monthlyRate;
      const principal = depreciationMonthly;
      balance -= principal;
      schedule.push({ month: m, principal: Math.round(principal), interest: Math.round(interest), balance: Math.max(Math.round(balance), Math.round(residualValue)) });
    }

    const result = {
      monthly_payment: Math.round(totalMonthly),
      down_payment: Math.round(downPayment),
      financed_amount: Math.round(financedAmount),
      residual_value: Math.round(residualValue),
      total_interest: Math.round(totalInterest),
      total_cost: Math.round(totalCost),
      total_payments: Math.round(totalPayments),
      ltv_ratio: parseFloat(ltvRatio.toFixed(4)),
      breakeven_lease_rate_hr: Math.round(breakevenLeaseRateHr),
      depreciation_monthly: Math.round(depreciationMonthly),
      interest_monthly: Math.round(interestMonthly),
      tax_monthly: Math.round(taxMonthly),
      schedule,
    };

    return Response.json({
      ok: true,
      skill_id: 'abos.skill.leasing.v1',
      version: 'v1',
      result,
      confidence: 1.0,
      evidence: [
        `Aircraft price: $${aircraftPrice.toLocaleString()}`,
        `Down payment: ${downPaymentPct}% = $${Math.round(downPayment).toLocaleString()}`,
        `Financed: $${Math.round(financedAmount).toLocaleString()} at ${interestRate}% APR`,
        `Term: ${termMonths} months, residual: ${residualPct}%`,
        `LTV ratio: ${(ltvRatio * 100).toFixed(1)}%`,
        `Breakeven dry-lease rate: $${Math.round(breakevenLeaseRateHr)}/hr (at 30 hrs/mo)`,
      ],
      model_used: 'engine:pure_math',
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});