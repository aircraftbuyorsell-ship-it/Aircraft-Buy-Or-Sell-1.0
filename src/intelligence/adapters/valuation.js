/**
 * Adapters: valuation providers (master spec §11).
 *
 * ABOS must be able to show several valuations side by side and never hide
 * which number came from where. ABOS OMVM is the in-house model; VREF and
 * JETNET are wired here so that enabling them in the registry is the only
 * change needed to light them up in the UI.
 */

import { base44 } from "@/api/base44Client";
import { source, DATA_CLASS } from "../provenance";

function make(providerId, providerName, field, value, { sourceDate = null, calculation = null } = {}) {
  if (value === null || value === undefined || value === "") return null;
  return {
    field,
    value,
    dataClass: providerId === "abos_omvm" ? DATA_CLASS.ABOS_CALCULATION : DATA_CLASS.THIRD_PARTY_VALUATION,
    calculation,
    source: source({
      providerId,
      providerName,
      type: providerId === "abos_omvm" ? DATA_CLASS.ABOS_CALCULATION : DATA_CLASS.THIRD_PARTY_VALUATION,
      sourceDate,
    }),
  };
}

/** ABOS OMVM — the in-house Open Market Valuation Model. */
export async function omvmAdapter({ registration, aircraft = {} }) {
  let data = null;
  try {
    const res = await base44.functions.invoke("invokeOmvmValuation", {
      registration,
      make: aircraft.manufacturer || undefined,
      model: aircraft.model || undefined,
      year: aircraft.year || undefined,
      total_time: aircraft.total_time || undefined,
      engine_hours: aircraft.engine_smoh || undefined,
    });
    data = res?.data ?? res;
  } catch (error) {
    throw new Error(`OMVM unavailable: ${error?.message || error}`);
  }

  const v = data?.valuation || data;
  const value = toNumber(v?.market_value ?? v?.value ?? v?.omvm_value);
  if (value === null) return { candidates: [], note: "OMVM returned no value for this configuration." };

  const p = "abos_omvm";
  const name = "ABOS Market Model";
  const at = v?.calculated_at || data?.created_at || new Date().toISOString();
  const method = v?.methodology_version ? `OMVM ${v.methodology_version}` : "OMVM";
  const comps = toNumber(v?.comparable_count ?? v?.comps_used);

  const candidates = [
    make(p, name, "estimated_value", value, {
      sourceDate: at,
      calculation: `${method}: base model value adjusted for age, hours, engine status, avionics and configuration${comps ? `, against ${comps} comparables` : ""}.`,
    }),
    make(p, name, "value_low", toNumber(v?.range_low ?? v?.low), { sourceDate: at, calculation: `${method} lower bound.` }),
    make(p, name, "value_high", toNumber(v?.range_high ?? v?.high), { sourceDate: at, calculation: `${method} upper bound.` }),
    make(p, name, "market_median", toNumber(v?.market_median ?? v?.median), { sourceDate: at, calculation: `${method} median of comparable asking prices.` }),
    make(p, name, "comparable_count", comps, { sourceDate: at, calculation: "Comparable aircraft used by the model." }),
  ].filter(Boolean);

  return { candidates, freshnessH: 24, costEur: 0, meta: { methodology_version: v?.methodology_version || null } };
}

/**
 * VREF. Disabled in the registry until a contract and key exist; the moment
 * `enabled` flips to true the router will call this and the UI will show a
 * VREF number next to the ABOS one, clearly labelled.
 */
export async function vrefAdapter({ registration, aircraft = {} }) {
  let data = null;
  try {
    const res = await base44.functions.invoke("vrefValuation", {
      registration,
      make: aircraft.manufacturer,
      model: aircraft.model,
      year: aircraft.year,
    });
    data = res?.data ?? res;
  } catch (error) {
    throw new Error(`VREF not configured: ${error?.message || error}`);
  }
  if (!data) return { candidates: [], note: "VREF returned no value." };

  const p = "vref";
  const name = "VREF";
  const at = data.as_of || data.valuation_date || null;

  const candidates = [
    make(p, name, "estimated_value", toNumber(data.retail_value ?? data.value), { sourceDate: at, calculation: "VREF published retail value." }),
    make(p, name, "value_low", toNumber(data.low ?? data.wholesale_value), { sourceDate: at, calculation: "VREF lower bound." }),
    make(p, name, "value_high", toNumber(data.high ?? data.retail_high), { sourceDate: at, calculation: "VREF upper bound." }),
  ].filter(Boolean);

  return { candidates, freshnessH: 720, costEur: 2.5 };
}

/** JETNET market intelligence. Disabled until an enterprise contract exists. */
export async function jetnetAdapter({ registration }) {
  let data = null;
  try {
    const res = await base44.functions.invoke("jetnetAircraft", { registration });
    data = res?.data ?? res;
  } catch (error) {
    throw new Error(`JETNET not configured: ${error?.message || error}`);
  }
  const a = data?.aircraft;
  if (!a) return { candidates: [], note: "JETNET returned no record." };

  const p = "jetnet";
  const name = "JETNET";
  const at = data.as_of || null;

  const candidates = [
    make(p, name, "serial_number", a.serial_number, { sourceDate: at }),
    make(p, name, "manufacturer", a.make, { sourceDate: at }),
    make(p, name, "model", a.model, { sourceDate: at }),
    make(p, name, "year", toNumber(a.year), { sourceDate: at }),
    make(p, name, "total_time", toNumber(a.airframe_hours), { sourceDate: at }),
    make(p, name, "total_cycles", toNumber(a.airframe_cycles), { sourceDate: at }),
    make(p, name, "engine_program", a.engine_program, { sourceDate: at }),
    make(p, name, "days_on_market", toNumber(a.days_on_market), { sourceDate: at }),
    make(p, name, "comparable_count", toNumber(a.comparable_count), { sourceDate: at }),
  ].filter(Boolean);

  return { candidates, freshnessH: 168, costEur: 4.0 };
}

function toNumber(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}
