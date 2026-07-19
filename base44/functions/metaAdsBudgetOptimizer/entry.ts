import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const META_API = "https://graph.facebook.com/v25.0";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("meta_ads");

    // List ad accounts
    if (action === "list_accounts") {
      const r = await fetch(`${META_API}/me/adaccounts?fields=account_id,name,currency,account_status&limit=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await r.json();
      if (data.error) return Response.json({ error: data.error.message }, { status: 400 });
      return Response.json({ accounts: data.data || [] });
    }

    // List ad sets for an account with current budgets + performance
    if (action === "list_adsets") {
      const { accountId, lookbackDays = 7 } = body;
      if (!accountId) return Response.json({ error: "accountId required" }, { status: 400 });
      const result = await fetchAdsetsWithInsights(accessToken, accountId, lookbackDays);
      if (result.error) return Response.json({ error: result.error }, { status: 400 });
      return Response.json(result);
    }

    // Run budget optimization (single account or all accounts)
    if (action === "optimize") {
      const {
        accountId,
        targetCpl = 50,
        increasePct = 20,
        decreasePct = 15,
        minBudget = 5,
        maxBudget = 500,
        lookbackDays = 7,
        dryRun = false,
      } = body;

      // Determine which accounts to process
      let accounts = [];
      if (accountId) {
        const actId = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
        accounts = [{ account_id: actId.replace("act_", ""), name: actId }];
      } else {
        const acctRes = await fetch(`${META_API}/me/adaccounts?fields=account_id,name&limit=100`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const acctData = await acctRes.json();
        if (acctData.error) return Response.json({ error: acctData.error.message }, { status: 400 });
        accounts = acctData.data || [];
      }

      const allAdjustments = [];
      for (const acct of accounts) {
        const actId = `act_${acct.account_id}`;
        const result = await fetchAdsetsWithInsights(accessToken, acct.account_id, lookbackDays);
        if (result.error) {
          allAdjustments.push({ accountId: actId, accountName: acct.name, error: result.error, adjustments: [] });
          continue;
        }
        const adjustments = await optimizeAdsets(base44, accessToken, actId, acct.name, result.adsets, {
          targetCpl: Number(targetCpl),
          increasePct: Number(increasePct),
          decreasePct: Number(decreasePct),
          minBudget: Number(minBudget),
          maxBudget: Number(maxBudget),
          lookbackDays: Number(lookbackDays),
          dryRun,
          actor: user.email || user.id,
        });
        allAdjustments.push({ accountId: actId, accountName: acct.name, adjustments });
      }

      return Response.json({ results: allAdjustments, dryRun, targetCpl: Number(targetCpl), lookbackDays: Number(lookbackDays) });
    }

    // List adjustment history from DecisionLog
    if (action === "log") {
      const logs = await base44.asServiceRole.entities.DecisionLog.filter(
        { rule_source: "metaAdsBudgetOptimizer:optimize" },
        "-created_date",
        50
      );
      return Response.json({ logs: logs || [] });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function fetchAdsetsWithInsights(accessToken, accountId, lookbackDays) {
  const actId = accountId.startsWith("act_") ? accountId : `act_${accountId}`;

  const adsetsRes = await fetch(`${META_API}/${actId}/adsets?fields=id,name,daily_budget,configured_status,campaign_id&limit=200`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const adsetsData = await adsetsRes.json();
  if (adsetsData.error) return { error: adsetsData.error.message };

  const until = new Date();
  const since = new Date();
  since.setDate(since.getDate() - lookbackDays);
  const sinceStr = since.toISOString().slice(0, 10);
  const untilStr = until.toISOString().slice(0, 10);
  const timeRange = encodeURIComponent(JSON.stringify({ since: sinceStr, until: untilStr }));

  const insightsRes = await fetch(`${META_API}/${actId}/insights?fields=adset_id,adset_name,spend,actions&level=adset&time_range=${timeRange}&limit=200`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const insightsData = await insightsRes.json();
  if (insightsData.error) return { error: insightsData.error.message };

  const insightMap = {};
  for (const i of insightsData.data || []) {
    const leads = extractLeads(i.actions);
    const spend = parseFloat(i.spend || "0");
    insightMap[i.adset_id] = { spend, leads, costPerLead: leads > 0 ? spend / leads : null };
  }

  const adsets = (adsetsData.data || []).map((a) => {
    const perf = insightMap[a.id] || { spend: 0, leads: 0, costPerLead: null };
    return {
      id: a.id,
      name: a.name,
      campaignId: a.campaign_id,
      status: a.configured_status,
      dailyBudget: a.daily_budget ? parseInt(a.daily_budget) / 100 : null,
      spend: perf.spend,
      leads: perf.leads,
      costPerLead: perf.costPerLead,
    };
  });

  return { adsets, accountId: actId, lookbackDays };
}

async function optimizeAdsets(base44, accessToken, actId, accountName, adsets, cfg) {
  const adjustments = [];
  const minBudgetCents = Math.round(cfg.minBudget * 100);
  const maxBudgetCents = Math.round(cfg.maxBudget * 100);

  for (const adset of adsets) {
    if (adset.status !== "ACTIVE") continue;
    if (adset.dailyBudget == null) continue;

    const currentBudgetCents = Math.round(adset.dailyBudget * 100);
    let actionType = "hold";
    let newBudgetCents = currentBudgetCents;
    let reason = "";

    if (adset.leads > 0 && adset.costPerLead <= cfg.targetCpl) {
      actionType = "increase";
      newBudgetCents = Math.round(currentBudgetCents * (1 + cfg.increasePct / 100));
      if (newBudgetCents > maxBudgetCents) {
        newBudgetCents = maxBudgetCents;
        reason = `CPL $${adset.costPerLead.toFixed(2)} ≤ target $${cfg.targetCpl} — increased (capped at max $${cfg.maxBudget})`;
      } else {
        reason = `CPL $${adset.costPerLead.toFixed(2)} ≤ target $${cfg.targetCpl} — increased ${cfg.increasePct}%`;
      }
    } else if (adset.leads > 0 && adset.costPerLead > cfg.targetCpl) {
      actionType = "decrease";
      newBudgetCents = Math.round(currentBudgetCents * (1 - cfg.decreasePct / 100));
      if (newBudgetCents < minBudgetCents) {
        newBudgetCents = minBudgetCents;
        reason = `CPL $${adset.costPerLead.toFixed(2)} > target $${cfg.targetCpl} — decreased (floored at min $${cfg.minBudget})`;
      } else {
        reason = `CPL $${adset.costPerLead.toFixed(2)} > target $${cfg.targetCpl} — decreased ${cfg.decreasePct}%`;
      }
    } else if (adset.spend > 0 && adset.leads === 0) {
      actionType = "decrease";
      newBudgetCents = Math.round(currentBudgetCents * (1 - cfg.decreasePct / 100));
      if (newBudgetCents < minBudgetCents) newBudgetCents = minBudgetCents;
      reason = `Spend $${adset.spend.toFixed(2)} with 0 leads — decreased ${cfg.decreasePct}%`;
    } else {
      reason = "No spend in lookback window — holding budget";
    }

    const changePct = currentBudgetCents > 0 ? ((newBudgetCents - currentBudgetCents) / currentBudgetCents) * 100 : 0;
    let applied = false;

    if (actionType !== "hold" && newBudgetCents !== currentBudgetCents && !cfg.dryRun) {
      const updateRes = await fetch(`${META_API}/${adset.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ daily_budget: String(newBudgetCents) }),
      });
      const updateData = await updateRes.json();
      if (updateData.error) {
        reason += ` — update failed: ${updateData.error.message}`;
        actionType = "error";
      } else {
        applied = true;
      }
    }

    adjustments.push({
      adsetId: adset.id,
      adsetName: adset.name,
      accountName,
      spend: adset.spend,
      leads: adset.leads,
      costPerLead: adset.costPerLead,
      oldBudget: currentBudgetCents / 100,
      newBudget: newBudgetCents / 100,
      changePct: Math.round(changePct * 10) / 10,
      action: actionType,
      reason,
      applied,
    });

    // Log decision to DecisionLog
    if (actionType !== "hold" && !cfg.dryRun && applied) {
      try {
        await base44.asServiceRole.entities.DecisionLog.create({
          decision_type: "other",
          subject_type: "other",
          subject_id: adset.id,
          subject_label: `${accountName} — ${adset.name}`,
          inputs: {
            adset_id: adset.id,
            account_id: actId,
            spend: adset.spend,
            leads: adset.leads,
            cost_per_lead: adset.costPerLead,
            old_budget: currentBudgetCents / 100,
            target_cpl: cfg.targetCpl,
          },
          outputs: {
            new_budget: newBudgetCents / 100,
            change_pct: Math.round(changePct * 10) / 10,
            action: actionType,
          },
          rule_version: "meta_budget_v1",
          rule_source: "metaAdsBudgetOptimizer:optimize",
          actor: cfg.actor,
          reasoning: reason,
        });
      } catch { /* skip logging errors */ }
    }
  }

  return adjustments;
}

function extractLeads(actions) {
  if (!Array.isArray(actions)) return 0;
  let total = 0;
  for (const a of actions) {
    if (a.action_type && (a.action_type.includes("lead") || a.action_type.includes("offsite_conversion"))) {
      total += parseInt(a.value || "0");
    }
  }
  return total;
}