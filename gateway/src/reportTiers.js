/**
 * ABOS — ATI Report Tier Configuration
 * ------------------------------------
 * Single source of truth for report tiering, pricing metadata and report
 * assembly. Stripe price IDs remain null until real Stripe Price objects are
 * created; never use placeholder IDs in production.
 */

const ATI_PRO_SKILLS = Object.freeze([
  "abos.skill.engine_overhaul.v1",
  "abos.skill.exterior_refurb.v1",
  "abos.skill.avionics_upgrade.v1",
  "abos.skill.mro_schedule.v1",
  "abos.skill.opex.v1",
  "abos.skill.insurance_estimate.v1",
  "abos.skill.rebuild_roi.v1",
]);

const ATI_PRO_SECTIONS = Object.freeze([
  "executive_summary",
  "financial_snapshot",
  "strengths",
  "risks_detailed",
  "capex_breakdown",
  "opex_breakdown",
  "rebuild_roi",
]);

const ATI_PRO_CHARTS = Object.freeze([
  Object.freeze({
    type: "pie",
    id: "capex_composition",
    title: "Capital Needs Breakdown",
    data_source: "capex_breakdown",
  }),
  Object.freeze({
    type: "pie",
    id: "opex_composition",
    title: "Annual OPEX Breakdown",
    data_source: "opex_breakdown",
  }),
  Object.freeze({
    type: "bar",
    id: "value_vs_investment",
    title: "Total Invested vs. Post-Rebuild Value",
    data_source: "rebuild_roi",
  }),
]);

const REPORT_TIERS = Object.freeze({
  LEVEL_0_SCORE: Object.freeze({
    id: "level_0_score",
    label: "ATI Score",
    price_usd: 0,
    stripe_price_id: null,
    requires_owner_verification: true,
    description: "ATI Score / ATIPassport gated by ownership verification.",
    sections: Object.freeze(["ati_score_summary", "digital_twin_status"]),
    skills: Object.freeze(["aircraftDataHub", "read_ATIPassport"]),
    charts: Object.freeze([]),
  }),

  LEVEL_2_BASIC: Object.freeze({
    id: "level_2_basic",
    label: "ATI Report — Level 2",
    price_usd: 49,
    // Set only after a real Stripe Price is created.
    stripe_price_id: null,
    requires_owner_verification: false,
    description: "Snapshot report: market comps, financial snapshot, strengths and risks.",
    sections: Object.freeze([
      "executive_summary",
      "financial_snapshot",
      "strengths",
      "risks_basic",
    ]),
    skills: Object.freeze(["web_search", "market_pulse", "ati_score_detail"]),
    charts: Object.freeze([]),
  }),

  ATI_PRO: Object.freeze({
    id: "ati_pro",
    label: "ATI Pro — Investment Brief",
    price_usd: 199,
    stripe_price_id: null,
    requires_owner_verification: false,
    description: "Investment-grade brief with CAPEX, OPEX, insurance and rebuild analysis.",
    sections: ATI_PRO_SECTIONS,
    skills: ATI_PRO_SKILLS,
    charts: ATI_PRO_CHARTS,
  }),

  ATI_PRO_TAX: Object.freeze({
    id: "ati_pro_tax",
    label: "ATI Pro + Tax & Insurance",
    price_usd: 700,
    stripe_price_id: null,
    upgrade_from: "ati_pro",
    upgrade_price_usd: 500,
    requires_owner_verification: false,
    description: "ATI Pro plus jurisdiction-specific tax, fractional ownership and lease-rate analysis.",
    sections: Object.freeze([
      ...ATI_PRO_SECTIONS,
      "tax_analysis",
      "tax_summary_dashboard",
      "fractional_ownership",
      "lease_rate_analysis",
    ]),
    skills: Object.freeze([
      ...ATI_PRO_SKILLS,
      "abos.skill.tax_benefit.v1",
      "abos.skill.fractional_ownership.v1",
      "abos.skill.lease_rate.v1",
    ]),
    charts: Object.freeze([
      ...ATI_PRO_CHARTS,
      Object.freeze({
        type: "pie",
        id: "5yr_ownership_cost_composition",
        title: "5-Year Net Cost of Ownership",
        data_source: "tax_summary_dashboard",
      }),
      Object.freeze({
        type: "bar",
        id: "net_dollar_per_hour_by_structure",
        title: "Net $/hr — Solo vs. 2/3/4-Owner",
        data_source: "fractional_ownership",
      }),
    ]),
  }),
});

function getTierById(tierId) {
  const tier = Object.values(REPORT_TIERS).find((candidate) => candidate.id === tierId);
  if (!tier) throw new Error(`Unknown ATI report tier: ${tierId}`);
  return tier;
}

function getTierByStripePriceId(priceId) {
  if (!priceId) throw new Error("Stripe price ID is required");
  const tier = Object.values(REPORT_TIERS).find(
    (candidate) => candidate.stripe_price_id === priceId,
  );
  if (!tier) throw new Error(`No ATI tier mapped to Stripe price: ${priceId}`);
  return tier;
}

function listTiersForPricingPage() {
  return Object.values(REPORT_TIERS).sort((a, b) => a.price_usd - b.price_usd);
}

function numeric(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/[$,]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function unwrap(value) {
  let current = value;
  for (let i = 0; i < 3 && current && typeof current === "object"; i += 1) {
    if (current.result && typeof current.result === "object") current = current.result;
    else if (current.data && typeof current.data === "object") current = current.data;
    else break;
  }
  return current || {};
}

function firstNumber(object, keys) {
  for (const key of keys) {
    const value = numeric(object?.[key]);
    if (value !== null) return value;
  }
  return null;
}

function resultFor(skillResults, suffix) {
  const key = Object.keys(skillResults).find((candidate) => candidate.endsWith(suffix));
  return key ? unwrap(skillResults[key]) : {};
}

function chart(labels, values, unit = "USD") {
  if (!labels.length || labels.length !== values.length || values.some((v) => !Number.isFinite(v))) {
    return null;
  }
  return { labels, values, unit };
}

/**
 * Normalize the current heterogeneous skill responses into the renderer
 * contract: { labels, values, unit }. Missing source data returns null so a
 * chart is omitted rather than rendered with fabricated zeros.
 */
function extractChartData(sourceKey, skillResults) {
  switch (sourceKey) {
    case "capex_breakdown": {
      const engine = resultFor(skillResults, "engine_overhaul.v1");
      const exterior = resultFor(skillResults, "exterior_refurb.v1");
      const avionics = resultFor(skillResults, "avionics_upgrade.v1");
      return chart(
        ["Engine", "Exterior", "Avionics"],
        [
          firstNumber(engine, ["grand_total", "total", "total_cost"]),
          firstNumber(exterior, ["grand_total", "total", "total_cost"]),
          firstNumber(avionics, ["grand_total", "total", "total_cost"]),
        ],
      );
    }

    case "opex_breakdown": {
      const opex = resultFor(skillResults, "opex.v1");
      const insurance = resultFor(skillResults, "insurance_estimate.v1");
      const fixed = opex.fixed || {};
      const variable = opex.variable || {};
      const values = [
        firstNumber(variable, ["fuel", "fuel_annual", "annual_fuel"]),
        firstNumber(fixed, ["inspection", "inspection_annual"]),
        firstNumber(fixed, ["maintenance", "maint", "maintenance_annual"]),
        firstNumber(insurance, ["annual_premium", "premium", "annual"]),
        firstNumber(fixed, ["hangar", "hangar_annual"]),
        firstNumber(opex, ["engine_reserve_yr", "engine_reserve", "engine_reserve_annual"]),
      ];
      return chart(
        ["Fuel", "Inspection", "Maintenance", "Insurance", "Hangar", "Engine Reserve"],
        values,
      );
    }

    case "rebuild_roi": {
      const roi = resultFor(skillResults, "rebuild_roi.v1");
      return chart(
        ["Total Invested", "Post-Rebuild Low", "Post-Rebuild Mid", "Post-Rebuild High"],
        [
          firstNumber(roi, ["total_invested", "totalInvested", "invested"]),
          firstNumber(roi, ["post_rebuild_low", "postRebuildLow", "low"]),
          firstNumber(roi, ["post_rebuild_mid", "postRebuildMid", "mid"]),
          firstNumber(roi, ["post_rebuild_high", "postRebuildHigh", "high"]),
        ],
      );
    }

    case "tax_summary_dashboard": {
      const tax = resultFor(skillResults, "tax_benefit.v1");
      const ownership = resultFor(skillResults, "fractional_ownership.v1");
      const source = Object.keys(tax).length ? tax : ownership;
      const values = [
        firstNumber(source, ["personal_5yr_net_cost", "personal_5yr", "five_year_personal"]),
        firstNumber(source, ["business_50_5yr_net_cost", "business_50_5yr", "five_year_50_business"]),
        firstNumber(source, ["business_100_5yr_net_cost", "business_100_5yr", "five_year_100_business"]),
      ];
      return chart(["100% Personal", "50% Business", "100% Business"], values);
    }

    case "fractional_ownership": {
      const fractional = resultFor(skillResults, "fractional_ownership.v1");
      const structures = [
        ["Solo", ["solo_net_per_hour", "solo_net_dollar_per_hour", "solo"]],
        ["2 Owner", ["two_owner_net_per_hour", "owner_2_net_per_hour", "two_owner"]],
        ["3 Owner", ["three_owner_net_per_hour", "owner_3_net_per_hour", "three_owner"]],
        ["4 Owner", ["four_owner_net_per_hour", "owner_4_net_per_hour", "four_owner"]],
      ];
      const labels = [];
      const values = [];
      for (const [label, keys] of structures) {
        const value = firstNumber(fractional, keys);
        if (value !== null) {
          labels.push(label);
          values.push(value);
        }
      }
      return chart(labels, values, "USD/hr");
    }

    default:
      throw new Error(`Unsupported ATI chart data source: ${sourceKey}`);
  }
}

async function buildReport(tierId, nNumber, invokeSkill) {
  const tier = getTierById(tierId);
  if (typeof invokeSkill !== "function") throw new TypeError("invokeSkill must be a function");
  if (!nNumber || typeof nNumber !== "string") throw new TypeError("nNumber is required");

  const results = {};
  for (const skillId of tier.skills) {
    results[skillId] = await invokeSkill(skillId, { nNumber });
  }

  const charts = tier.charts
    .map((definition) => ({
      ...definition,
      data: extractChartData(definition.data_source, results),
    }))
    .filter((definition) => definition.data !== null);

  return {
    tier: tier.id,
    label: tier.label,
    generated_at: new Date().toISOString(),
    sections: tier.sections,
    skill_results: results,
    charts,
  };
}

export {
  REPORT_TIERS,
  getTierById,
  getTierByStripePriceId,
  listTiersForPricingPage,
  extractChartData,
  buildReport,
};
