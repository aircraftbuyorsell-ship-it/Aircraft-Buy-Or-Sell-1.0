/**
 * ABOS ASSESS — "Is the price of this specific aircraft defensible?"
 * (master spec §2)
 *
 * Assess never returns a single unexplained number. It returns a ladder of
 * numbers, each labelled with where it came from:
 *
 *   ABOS Market Model   €XXX,XXX   (ABOS calculation)
 *   VREF                €XXX,XXX   (third-party valuation)
 *   Market asking range €XXX–€XXX  (observed)
 *   ABOS synthesized    €XXX–€XXX  (derived)
 *
 * Internal Czech meaning: posouzení hodnoty a ceny. This is explicitly NOT a
 * Czech "znalecký posudek" and must never be described as one.
 */

import { field, value, sectionConfidence, displayName } from "../schema.js";
import { hasValue, DATA_CLASS, DATA_STATUS, aggregateConfidence, calculated } from "../provenance.js";
import { getProvider } from "../registry.js";

export const NOT_AN_APPRAISAL =
  "Assess is a market-data assessment of price defensibility. It is not a certified appraisal and, under Czech law, is not a znalecký posudek.";

/** Factors Assess reasons about, and how much each can move a value. */
const ADJUSTMENT_MODEL = [
  { key: "engine_smoh", label: "Engine status", maxSwing: 0.18 },
  { key: "total_time", label: "Airframe hours", maxSwing: 0.12 },
  { key: "avionics_suite", label: "Avionics", maxSwing: 0.1 },
  { key: "damage_history", label: "Damage history", maxSwing: 0.15 },
  { key: "last_annual", label: "Inspection freshness", maxSwing: 0.05 },
  { key: "interior_year", label: "Interior condition", maxSwing: 0.05 },
  { key: "exterior_year", label: "Exterior condition", maxSwing: 0.04 },
  { key: "ad_compliance", label: "AD / SB compliance", maxSwing: 0.06 },
];

/**
 * @param {Object} aircraft canonical aircraft (resolve with POLICY.ASSESS)
 * @param {Object} [options]
 * @param {string} [options.currency='EUR']
 */
export function assess(aircraft, options = {}) {
  const currency = options.currency || "EUR";

  if (!aircraft || aircraft.error) {
    return emptyAssessment(aircraft?.error || "No aircraft resolved.", currency);
  }

  // --- Collect every valuation opinion on the table, labelled ---------------
  const opinions = [];
  const estimate = field(aircraft, "estimated_value");
  if (hasValue(estimate)) {
    for (const src of estimate.sources) {
      opinions.push({
        provider_id: src.providerId,
        provider: src.providerName,
        label: getProvider(src.providerId)?.public_label || src.providerName,
        kind: src.type === DATA_CLASS.ABOS_CALCULATION ? "abos_model" : "third_party",
        value: estimate.value,
        as_of: src.sourceDate,
        calculation: estimate.calculation,
        confidence: estimate.confidence,
      });
    }
  }

  const asking = value(aircraft, "asking_price");
  const median = value(aircraft, "market_median");
  const low = value(aircraft, "value_low");
  const high = value(aircraft, "value_high");
  const comparables = value(aircraft, "comparable_count");

  // --- ABOS synthesized range ----------------------------------------------
  const inputs = [low, high, median, ...opinions.map((o) => o.value)].filter((n) => Number.isFinite(n) && n > 0);
  const synth = synthesizeRange({ low, high, median, opinions, asking });

  // --- Price position -------------------------------------------------------
  const position = positionOf(asking, synth);

  // --- Which factors ABOS could and could not account for -------------------
  const adjustments = ADJUSTMENT_MODEL.map((a) => {
    const point = field(aircraft, a.key);
    return {
      key: a.key,
      label: a.label,
      known: hasValue(point),
      status: point?.status || DATA_STATUS.UNAVAILABLE,
      display: hasValue(point) ? String(point.value) : null,
      max_swing_pct: Math.round(a.maxSwing * 100),
      note: hasValue(point)
        ? "Accounted for in the model."
        : "Not accounted for — no source supplied this. It could move the value either way.",
      point,
    };
  });

  const unaccounted = adjustments.filter((a) => !a.known);
  const unexplainedSwing = unaccounted.reduce((s, a) => s + a.max_swing_pct, 0);

  // --- Confidence ------------------------------------------------------------
  const valueConfidence = sectionConfidence(aircraft, "value");
  const marketConfidence = sectionConfidence(aircraft, "market");
  const inputConfidence = aggregateConfidence(adjustments.map((a) => a.point));
  const confidence = Number((
    (valueConfidence.confidence * 0.4) +
    (marketConfidence.confidence * 0.25) +
    (inputConfidence.confidence * 0.35)
  ).toFixed(2));

  return {
    subject: displayName(aircraft),
    registration: value(aircraft, "registration"),
    currency,

    asking: asking ?? null,
    asking_point: field(aircraft, "asking_price"),

    /** Every number, with its provenance kept intact. Never merged away. */
    valuations: opinions,
    market_median: median ?? null,
    comparable_count: comparables ?? null,

    /** ABOS's own synthesis — always labelled as a derived range. */
    synthesized: synth,
    synthesized_point: synth.low && synth.high
      ? calculated(`${fmt(synth.low)}–${fmt(synth.high)}`, synth.method, { unit: currency })
      : null,

    position,
    adjustments,
    unaccounted_factors: unaccounted.map((a) => ({ label: a.label, max_swing_pct: a.max_swing_pct })),
    unexplained_swing_pct: Math.min(60, unexplainedSwing),

    confidence,
    confidence_parts: {
      valuation_inputs: Number(valueConfidence.confidence.toFixed(2)),
      market_data: Number(marketConfidence.confidence.toFixed(2)),
      aircraft_specifics: Number(inputConfidence.confidence.toFixed(2)),
    },

    conclusion: conclusionFor(position, asking, synth, unaccounted, comparables),
    caveats: buildCaveats(aircraft, unaccounted, inputs.length),
    disclaimer: NOT_AN_APPRAISAL,
  };
}

/**
 * Build the ABOS range. Every input is weighted by the trust the registry
 * assigns its provider, and the method string is returned so the UI can
 * answer "why did ABOS arrive at this number?" without guessing.
 */
function synthesizeRange({ low, high, median, opinions, asking }) {
  const points = [];
  for (const o of opinions) {
    const weight = getProvider(o.provider_id)?.confidence ?? 0.6;
    points.push({ value: o.value, weight, label: o.label });
  }
  if (Number.isFinite(median) && median > 0) {
    points.push({ value: median, weight: 0.5, label: "Market median" });
  }

  if (!points.length) {
    if (Number.isFinite(low) && Number.isFinite(high)) {
      return { low, high, midpoint: (low + high) / 2, method: "Provider-published range, carried through unchanged.", inputs: ["Provider range"] };
    }
    return { low: null, high: null, midpoint: null, method: "No valuation input was available.", inputs: [] };
  }

  const totalWeight = points.reduce((s, p) => s + p.weight, 0);
  const midpoint = points.reduce((s, p) => s + p.value * p.weight, 0) / totalWeight;

  // Spread: start from any published range, otherwise from the disagreement
  // between opinions, with a floor so a single source never looks exact.
  const published = Number.isFinite(low) && Number.isFinite(high) && high > low
    ? (high - low) / 2 / midpoint
    : null;
  const disagreement = points.length > 1
    ? (Math.max(...points.map((p) => p.value)) - Math.min(...points.map((p) => p.value))) / 2 / midpoint
    : null;
  const spread = Math.max(0.06, published ?? 0, disagreement ?? 0);

  const result = {
    low: Math.round(midpoint * (1 - spread)),
    high: Math.round(midpoint * (1 + spread)),
    midpoint: Math.round(midpoint),
    spread_pct: Math.round(spread * 100),
    inputs: points.map((p) => p.label),
    method: `Confidence-weighted blend of ${points.length} input(s) (${points.map((p) => p.label).join(", ")}), with a ±${Math.round(spread * 100)}% band from ${published !== null ? "the published range" : disagreement !== null ? "the spread between sources" : "the minimum uncertainty floor"}.`,
  };
  if (Number.isFinite(asking)) result.asking_included = false;
  return result;
}

function positionOf(asking, synth) {
  if (!Number.isFinite(asking) || !synth.low || !synth.high) {
    return { state: "unknown", label: "Not established", detail: "There is not enough data to position this asking price." };
  }
  if (asking >= synth.low && asking <= synth.high) {
    const pct = Math.round(((asking - synth.midpoint) / synth.midpoint) * 100);
    return {
      state: "within",
      label: "Within the modelled range",
      detail: pct === 0
        ? "The asking price sits on the modelled midpoint."
        : `The asking price is ${Math.abs(pct)}% ${pct > 0 ? "above" : "below"} the modelled midpoint, inside the range.`,
      delta_pct: pct,
    };
  }
  if (asking > synth.high) {
    const pct = Math.round(((asking - synth.high) / synth.high) * 100);
    return { state: "above", label: "Above the modelled range", detail: `The asking price is ${pct}% above the top of the modelled range.`, delta_pct: pct };
  }
  const pct = Math.round(((synth.low - asking) / synth.low) * 100);
  return { state: "below", label: "Below the modelled range", detail: `The asking price is ${pct}% below the bottom of the modelled range.`, delta_pct: -pct };
}

function conclusionFor(position, asking, synth, unaccounted, comparables) {
  if (position.state === "unknown") {
    return "ABOS does not currently have enough valuation input to say whether this price is defensible.";
  }
  const base = position.state === "within"
    ? "The asking price falls within the modelled range."
    : position.state === "above"
      ? "The asking price sits above the modelled range. It needs a specific justification — configuration, condition or recent work."
      : "The asking price sits below the modelled range. A discount of that size usually has a reason that has not yet surfaced.";

  const caveat = unaccounted.length
    ? ` The model has ${unaccounted.length} unresolved input(s): ${unaccounted.slice(0, 3).map((a) => a.label.toLowerCase()).join(", ")}.`
    : "";
  const comps = Number.isFinite(comparables) && comparables > 0 ? ` Based on ${comparables} comparable aircraft.` : "";
  return base + comps + caveat;
}

function buildCaveats(aircraft, unaccounted, inputCount) {
  const caveats = [];
  if (inputCount <= 1) {
    caveats.push("Only one valuation input was available. A single source is a starting point, not a consensus.");
  }
  if ((aircraft.conflicts || []).length) {
    caveats.push(`${aircraft.conflicts.length} unresolved data conflict(s) feed into this assessment.`);
  }
  if (unaccounted.length >= 3) {
    caveats.push("Several condition inputs are unknown, so the true range is wider than the one shown.");
  }
  const country = value(aircraft, "country");
  if (country && String(country).toUpperCase() !== "US") {
    caveats.push("Most published valuation data is US-oriented. European market pricing can diverge materially.");
  }
  return caveats;
}

function emptyAssessment(reason, currency) {
  return {
    subject: null, registration: null, currency,
    asking: null, valuations: [], market_median: null, comparable_count: null,
    synthesized: { low: null, high: null, midpoint: null, method: reason, inputs: [] },
    position: { state: "unknown", label: "Not established", detail: reason },
    adjustments: [], unaccounted_factors: [], unexplained_swing_pct: 0,
    confidence: 0, conclusion: reason, caveats: [], disclaimer: NOT_AN_APPRAISAL,
  };
}

function fmt(n) {
  return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}
