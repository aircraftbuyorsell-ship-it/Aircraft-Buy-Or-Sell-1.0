/**
 * ABOS — ATI Report Tier Configuration
 * ------------------------------------
 * Single source of truth for report tiering, live Stripe price mapping,
 * upgrade routing and report assembly.
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
  "executive_summary", "financial_snapshot", "strengths", "risks_detailed",
  "capex_breakdown", "opex_breakdown", "rebuild_roi",
]);

const ATI_PRO_CHARTS = Object.freeze([
  Object.freeze({ type: "pie", id: "capex_composition", title: "Capital Needs Breakdown", data_source: "capex_breakdown" }),
  Object.freeze({ type: "pie", id: "opex_composition", title: "Annual OPEX Breakdown", data_source: "opex_breakdown" }),
  Object.freeze({ type: "bar", id: "value_vs_investment", title: "Total Invested vs. Post-Rebuild Value", data_source: "rebuild_roi" }),
]);

const STRIPE_PRICES = Object.freeze({
  level_2_basic: "price_1U7dkVAT7Be3WR6JsraFG9Ki",
  ati_pro: "price_1U7dkYAT7Be3WR6Jaf9jqrVV",
  ati_pro_tax: "price_1U7dkbAT7Be3WR6JDOjfF3Eg",
});

const REPORT_TIERS = Object.freeze({
  LEVEL_0_SCORE: Object.freeze({
    id: "level_0_score", label: "ATI Score", price_usd: 0, stripe_price_id: null,
    requires_owner_verification: true,
    description: "ATI Score / ATIPassport gated by ownership verification.",
    sections: Object.freeze(["ati_score_summary", "digital_twin_status"]),
    skills: Object.freeze(["aircraftDataHub", "read_ATIPassport"]), charts: Object.freeze([]),
  }),
  LEVEL_2_BASIC: Object.freeze({
    id: "level_2_basic", label: "ATI Report — Level 2", price_usd: 49,
    stripe_price_id: STRIPE_PRICES.level_2_basic, requires_owner_verification: false,
    description: "Snapshot report: market comps, financial snapshot, strengths and risks.",
    sections: Object.freeze(["executive_summary", "financial_snapshot", "strengths", "risks_basic"]),
    skills: Object.freeze(["web_search", "market_pulse", "ati_score_detail"]), charts: Object.freeze([]),
  }),
  ATI_PRO: Object.freeze({
    id: "ati_pro", label: "ATI Pro — Investment Brief", price_usd: 199,
    stripe_price_id: STRIPE_PRICES.ati_pro, requires_owner_verification: false,
    description: "Full investment-grade ABOS Investment Brief.",
    sections: ATI_PRO_SECTIONS, skills: ATI_PRO_SKILLS, charts: ATI_PRO_CHARTS,
  }),
  ATI_PRO_TAX: Object.freeze({
    id: "ati_pro_tax", label: "ATI Pro + Tax & Insurance", price_usd: 698,
    upgrade_from: "ati_pro", upgrade_price_usd: 499,
    stripe_price_id: STRIPE_PRICES.ati_pro_tax, requires_owner_verification: false,
    description: "ATI Pro plus jurisdiction-specific tax, insurance, fractional ownership and lease-rate analysis.",
    sections: Object.freeze([...ATI_PRO_SECTIONS, "tax_analysis", "tax_summary_dashboard", "fractional_ownership", "lease_rate_analysis"]),
    skills: Object.freeze([...ATI_PRO_SKILLS, "abos.skill.tax_benefit.v1", "abos.skill.fractional_ownership.v1", "abos.skill.lease_rate.v1"]),
    charts: Object.freeze([
      ...ATI_PRO_CHARTS,
      Object.freeze({ type: "pie", id: "5yr_ownership_cost_composition", title: "5-Year Net Cost of Ownership", data_source: "tax_summary_dashboard" }),
      Object.freeze({ type: "bar", id: "net_dollar_per_hour_by_structure", title: "Net $/hr — Solo vs. 2/3/4-Owner", data_source: "fractional_ownership" }),
    ]),
  }),
});

function getTierById(tierId) {
  const tier = Object.values(REPORT_TIERS).find((t) => t.id === tierId);
  if (!tier) throw new Error(`Unknown ATI report tier: ${tierId}`);
  return tier;
}

function getTierByStripePriceId(priceId) {
  const tier = Object.values(REPORT_TIERS).find((t) => t.stripe_price_id === priceId);
  if (!tier) throw new Error(`No ATI tier mapped to Stripe price: ${priceId}`);
  return tier;
}

/**
 * Resolve the effective entitlement after checkout.
 * ATI Pro Tax is an upgrade: regardless of the checkout route used,
 * a successful tax-upgrade payment must overwrite the effective report tier
 * to ati_pro_tax, not leave the customer entitled only to ati_pro.
 */
function resolveEffectiveTier({ purchasedTierId, existingTierId = null }) {
  const purchased = getTierById(purchasedTierId);
  if (purchased.id === "ati_pro_tax" && existingTierId === "ati_pro") return purchased;
  return purchased;
}

/**
 * Checkout routing helper. Returns the actual tier and price to charge.
 * An ATI Pro customer selecting Tax is rerouted to the $499 upgrade price.
 */
function resolveCheckout({ requestedTierId, currentTierId = null }) {
  const requested = getTierById(requestedTierId);
  if (requested.id === "ati_pro_tax" && currentTierId === "ati_pro") {
    return { tier: requested, price_id: requested.stripe_price_id, charge_usd: requested.upgrade_price_usd, mode: "upgrade", overwrite_tier_id: "ati_pro_tax" };
  }
  return { tier: requested, price_id: requested.stripe_price_id, charge_usd: requested.price_usd, mode: "purchase", overwrite_tier_id: requested.id };
}

function listTiersForPricingPage() {
  return Object.values(REPORT_TIERS).sort((a, b) => a.price_usd - b.price_usd);
}

function unwrapSkillResult(value) {
  if (!value || typeof value !== "object") return null;
  return value.result ?? value.data ?? value;
}

function firstNumber(obj, keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function extractChartData(sourceKey, skillResults) {
  const values = [], labels = [];
  const add = (label, value) => {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) { labels.push(label); values.push(value); }
  };
  const find = (skillId) => unwrapSkillResult(skillResults[skillId]);
  const engine = find("abos.skill.engine_overhaul.v1");
  const exterior = find("abos.skill.exterior_refurb.v1");
  const avionics = find("abos.skill.avionics_upgrade.v1");
  const opex = find("abos.skill.opex.v1");
  const roi = find("abos.skill.rebuild_roi.v1");
  const tax = find("abos.skill.tax_benefit.v1");
  const fractional = find("abos.skill.fractional_ownership.v1");

  switch (sourceKey) {
    case "capex_breakdown":
      add("Engine", firstNumber(engine, ["grand_total", "total", "total_cost"]));
      add("Exterior", firstNumber(exterior, ["grand_total", "total", "total_cost"]));
      add("Avionics", firstNumber(avionics, ["grand_total", "total", "total_cost"]));
      break;
    case "opex_breakdown":
      add("Fuel", firstNumber(opex, ["fuel_annual", "fuel", "fuel_cost_annual"]));
      add("Inspection", firstNumber(opex, ["inspection_annual", "inspection", "inspection_cost_annual"]));
      add("Maintenance", firstNumber(opex, ["maintenance_annual", "maint", "maintenance"]));
      add("Insurance", firstNumber(opex, ["insurance_annual", "insurance"]));
      add("Hangar", firstNumber(opex, ["hangar_annual", "hangar"]));
      add("Engine Reserve", firstNumber(opex, ["engine_reserve_yr", "engine_reserve"]));
      break;
    case "rebuild_roi":
      add("Total Invested", firstNumber(roi, ["total_invested", "totalInvested"]));
      add("Post-Rebuild Low", firstNumber(roi, ["post_rebuild_low", "low"]));
      add("Post-Rebuild Mid", firstNumber(roi, ["post_rebuild_mid", "mid"]));
      add("Post-Rebuild High", firstNumber(roi, ["post_rebuild_high", "high"]));
      break;
    case "tax_summary_dashboard":
      add("Purchase / Acquisition", firstNumber(tax, ["purchase_tax", "acquisition_tax", "tax"]));
      add("5-Year Tax Impact", firstNumber(tax, ["five_year_tax", "tax_5yr", "five_year_total"]));
      break;
    case "fractional_ownership":
      for (const [label, keys] of [
        ["Solo", ["solo_net_dollar_per_hour", "solo_net_per_hour", "solo_net_hourly"]],
        ["2 Owners", ["two_owner_net_dollar_per_hour", "two_owner_net_per_hour", "two_owner_net_hourly"]],
        ["3 Owners", ["three_owner_net_dollar_per_hour", "three_owner_net_per_hour", "three_owner_net_hourly"]],
        ["4 Owners", ["four_owner_net_dollar_per_hour", "four_owner_net_per_hour", "four_owner_net_hourly"]],
      ]) add(label, firstNumber(fractional, keys));
      break;
    default: throw new Error(`Unsupported ATI chart data source: ${sourceKey}`);
  }
  return values.length ? { labels, values, unit: "USD", source: sourceKey } : null;
}

async function buildReport(tierId, nNumber, invokeSkill) {
  const tier = getTierById(tierId), results = {};
  for (const skillId of tier.skills) results[skillId] = await invokeSkill(skillId, { nNumber });
  const charts = tier.charts.map((chart) => ({ ...chart, data: extractChartData(chart.data_source, results) })).filter((chart) => chart.data);
  return { tier: tier.id, label: tier.label, generated_at: new Date().toISOString(), sections: tier.sections, skill_results: results, charts };
}

module.exports = {
  REPORT_TIERS, STRIPE_PRICES, getTierById, getTierByStripePriceId,
  resolveEffectiveTier, resolveCheckout, listTiersForPricingPage,
  buildReport, extractChartData,
};
