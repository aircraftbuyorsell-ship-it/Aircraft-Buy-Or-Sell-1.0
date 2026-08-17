/**
 * aircraftInput.js — Shared aircraft-input logic used across Valuation Studio,
 * ATI Quick Score, calculators and any page that collects aircraft specs.
 *
 * Unified flow: registration lookup → spec fields → paste listing text → upload file,
 * with LLM auto-extraction and TBO resolved individually by engine type.
 */
import { base44 } from "@/api/base44Client";

export const FIELD_CLASS =
  "w-full rounded-xl px-3 py-2.5 text-sm outline-none transition bg-muted text-foreground border border-border placeholder:text-muted-foreground/60";

/**
 * Common GA engine models → official TBO / fuel / hp.
 * Sourced from Lycoming, Continental, Rotax, P&W, Williams manufacturer TBO schedules.
 * Keyed by engine family prefix (e.g. "IO-360" matches "IO-360-L2A" via prefix lookup).
 */
export const ENGINE_TBO_TABLE = {
  // ── Lycoming reciprocating ──
  "O-235": { tbo: 2000, fuel: "100LL", hp: 115, mfr: "Lycoming" },
  "O-320": { tbo: 2000, fuel: "100LL", hp: 150, mfr: "Lycoming" },
  "O-360": { tbo: 2000, fuel: "100LL", hp: 180, mfr: "Lycoming" },
  "O-540": { tbo: 2000, fuel: "100LL", hp: 235, mfr: "Lycoming" },
  "IO-320": { tbo: 2000, fuel: "100LL", hp: 160, mfr: "Lycoming" },
  "IO-360": { tbo: 2000, fuel: "100LL", hp: 180, mfr: "Lycoming" },
  "IO-540": { tbo: 2000, fuel: "100LL", hp: 235, mfr: "Lycoming" },
  "AEIO-540": { tbo: 2000, fuel: "100LL", hp: 260, mfr: "Lycoming" },
  "TSIO-360": { tbo: 1800, fuel: "100LL", hp: 210, mfr: "Lycoming" },
  "TIO-540": { tbo: 1800, fuel: "100LL", hp: 310, mfr: "Lycoming" },
  "TSIO-540": { tbo: 1800, fuel: "100LL", hp: 350, mfr: "Lycoming" },
  "TIO-550": { tbo: 1800, fuel: "100LL", hp: 350, mfr: "Lycoming" },
  // ── Continental reciprocating ──
  "O-200": { tbo: 1800, fuel: "100LL", hp: 100, mfr: "Continental" },
  "O-300": { tbo: 1800, fuel: "100LL", hp: 145, mfr: "Continental" },
  "O-470": { tbo: 1800, fuel: "100LL", hp: 230, mfr: "Continental" },
  "IO-470": { tbo: 1800, fuel: "100LL", hp: 260, mfr: "Continental" },
  "O-520": { tbo: 1700, fuel: "100LL", hp: 285, mfr: "Continental" },
  "IO-520": { tbo: 1700, fuel: "100LL", hp: 300, mfr: "Continental" },
  "TSIO-520": { tbo: 1600, fuel: "100LL", hp: 310, mfr: "Continental" },
  "GTSIO-520": { tbo: 1600, fuel: "100LL", hp: 435, mfr: "Continental" },
  "IO-550": { tbo: 2000, fuel: "100LL", hp: 300, mfr: "Continental" },
  "TSIO-550": { tbo: 2000, fuel: "100LL", hp: 310, mfr: "Continental" },
  // ── Continental diesel / FADEC ──
  "CD-135": { tbo: 2100, fuel: "Jet-A", hp: 135, mfr: "Continental" },
  "CD-155": { tbo: 2100, fuel: "Jet-A", hp: 155, mfr: "Continental" },
  "CD-170": { tbo: 2100, fuel: "Jet-A", hp: 170, mfr: "Continental" },
  // ── Rotax ──
  "912": { tbo: 2000, fuel: "Mogas", hp: 100, mfr: "Rotax" },
  "912UL": { tbo: 2000, fuel: "Mogas", hp: 80, mfr: "Rotax" },
  "912S": { tbo: 2000, fuel: "Mogas", hp: 100, mfr: "Rotax" },
  "912IS": { tbo: 2200, fuel: "Mogas", hp: 100, mfr: "Rotax" },
  "914": { tbo: 2000, fuel: "Mogas", hp: 115, mfr: "Rotax" },
  "915IS": { tbo: 2200, fuel: "Mogas", hp: 141, mfr: "Rotax" },
  "916IS": { tbo: 2200, fuel: "Mogas", hp: 160, mfr: "Rotax" },
  // ── Turboprop / turbine ──
  "PT6A": { tbo: 3600, fuel: "Jet-A", hp: 0, mfr: "Pratt & Whitney" },
  "TPE331": { tbo: 5400, fuel: "Jet-A", hp: 0, mfr: "Honeywell" },
  "PW118": { tbo: 6000, fuel: "Jet-A", hp: 1800, mfr: "Pratt & Whitney" },
  "WALTER": { tbo: 3600, fuel: "Jet-A", hp: 0, mfr: "GE" },
  // ── Turbofan / turboshaft ──
  "FJ44": { tbo: 3500, fuel: "Jet-A", hp: 0, mfr: "Williams" },
  "PW306": { tbo: 6000, fuel: "Jet-A", hp: 0, mfr: "Pratt & Whitney" },
  "RR250": { tbo: 3500, fuel: "Jet-A", hp: 0, mfr: "Rolls-Royce" },
  "ARIEL": { tbo: 4000, fuel: "Jet-A", hp: 0, mfr: "Safran" },
};

/** Common make|model → likely engine family, so TBO can resolve even without a registry engine code. */
export const MAKE_MODEL_ENGINE = {
  "CESSNA|150": "O-200", "CESSNA|152": "O-235", "CESSNA|162": "O-200",
  "CESSNA|172": "IO-360", "CESSNA|172R": "IO-360", "CESSNA|172S": "IO-360",
  "CESSNA|177": "O-360", "CESSNA|180": "O-470", "CESSNA|182": "IO-540",
  "CESSNA|182T": "IO-540", "CESSNA|185": "IO-520", "CESSNA|206": "IO-520",
  "CESSNA|T206": "TSIO-520", "CESSNA|210": "IO-520", "CESSNA|T210": "TSIO-520",
  "CESSNA|208": "PT6A", "CESSNA|340": "TSIO-520", "CESSNA|414": "TSIO-520",
  "CESSNA|421": "GTSIO-520",
  "PIPER|CHEROKEE": "O-320", "PIPER|WARRIOR": "O-320", "PIPER|ARCHER": "O-360",
  "PIPER|ARROW": "IO-360", "PIPER|SENECA": "TSIO-360", "PIPER|SENECA V": "TSIO-360",
  "PIPER|SARATOGA": "IO-540", "PIPER|LANCE": "IO-540", "PIPER|NAVAJO": "TIO-540",
  "PIPER|CHIEFTAIN": "TIO-540", "PIPER|MALIBU": "TIO-540", "PIPER|MIRAGE": "TIO-540",
  "PIPER|M500": "PT6A", "PIPER|M600": "PT6A", "PIPER|AZTEC": "O-540", "PIPER|TOMAHAWK": "O-235",
  "BEECHCRAFT|BONANZA": "IO-550", "BEECHCRAFT|A36": "IO-550", "BEECHCRAFT|G36": "IO-550",
  "BEECHCRAFT|BARON": "IO-520", "BEECHCRAFT|58": "IO-550", "BEECHCRAFT|DUCHESS": "O-360",
  "BEECHCRAFT|KING AIR 90": "PT6A", "BEECHCRAFT|KING AIR 200": "PT6A", "BEECHCRAFT|KING AIR 350": "PT6A",
  "CIRRUS|SR20": "IO-360", "CIRRUS|SR22": "IO-550", "CIRRUS|SR22T": "TSIO-550", "CIRRUS|SF50": "FJ44",
  "DIAMOND|DA40": "IO-360", "DIAMOND|DA42": "CD-155", "DIAMOND|DA62": "CD-170",
  "MOONEY|M20": "IO-360", "MOONEY|M20J": "IO-360", "MOONEY|M20R": "IO-550", "MOONEY|ACCLAIM": "TSIO-550",
  "DAHER|TBM 900": "PT6A", "DAHER|TBM 930": "PT6A", "PILATUS|PC-12": "PT6A",
};

export const DEFAULT_TBO = 2000;

export function normalizeEngineModel(raw) {
  if (!raw) return "";
  return String(raw).toUpperCase().replace(/\s+/g, "").trim();
}

/** Resolve TBO/fuel/hp for an engine model string via exact then prefix match. */
export function resolveTboForEngine(engineModel) {
  const norm = normalizeEngineModel(engineModel);
  if (!norm) return { tbo: null, fuel_type: null, hp: null, matched: false };
  if (ENGINE_TBO_TABLE[norm]) return { ...ENGINE_TBO_TABLE[norm], matched: true, matched_prefix: norm };
  // Strip suffixes (e.g. IO-360-L2A → IO-360) by progressively trimming from the end.
  for (let len = norm.length - 1; len >= 3; len--) {
    const prefix = norm.slice(0, len);
    if (ENGINE_TBO_TABLE[prefix]) return { ...ENGINE_TBO_TABLE[prefix], matched: true, matched_prefix: prefix };
  }
  return { tbo: null, fuel_type: null, hp: null, matched: false };
}

/** Guess the engine family from make+model when the engine code is unknown. */
export function guessEngineFromMakeModel(make, model) {
  const m = (make || "").toUpperCase().trim();
  const mod = (model || "").toUpperCase().trim();
  if (!m || !mod) return "";
  if (MAKE_MODEL_ENGINE[`${m}|${mod}`]) return MAKE_MODEL_ENGINE[`${m}|${mod}`];
  const first = mod.split(/[\s-]/)[0];
  if (MAKE_MODEL_ENGINE[`${m}|${first}`]) return MAKE_MODEL_ENGINE[`${m}|${first}`];
  const key = Object.keys(MAKE_MODEL_ENGINE).find((k) => {
    const [km, kmod] = k.split("|");
    return km === m && (kmod.startsWith(first) || mod.startsWith(kmod));
  });
  return key ? MAKE_MODEL_ENGINE[key] : "";
}

/** LLM auto-extraction of aircraft specs from pasted listing text + attached files. */
export async function extractAircraftSpecs({ listingText, fileUrls }) {
  const prompt = `Extract aircraft specification fields from the following listing text and any attached documents. Return strict JSON only.
Fields: make (string), model (string), year (number), total_time (airframe hours number), engine_hours (SMOH number), engine_model (string e.g. "IO-360-L2A" — extract the exact engine designation if present), tbo (number), avionics (comma-separated string), asking_price (number USD). Use null for anything not found.

LISTING TEXT:
${listingText || "(none)"}`;
  const res = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        make: { type: ["string", "null"] },
        model: { type: ["string", "null"] },
        year: { type: ["number", "null"] },
        total_time: { type: ["number", "null"] },
        engine_hours: { type: ["number", "null"] },
        engine_model: { type: ["string", "null"] },
        tbo: { type: ["number", "null"] },
        avionics: { type: ["string", "null"] },
        asking_price: { type: ["number", "null"] },
      },
    },
    ...(fileUrls && fileUrls.length ? { file_urls: fileUrls } : {}),
  });
  return res?.data ?? res;
}

/**
 * Merge extracted specs into the current form WITHOUT overwriting user-entered values.
 * Auto-resolves TBO from the engine model (extracted or guessed from make/model).
 * Returns { merged, engineModel, resolved }.
 */
export function mergeExtractedSpecs(current, extracted) {
  const merged = { ...current };
  const fields = ["make", "model", "year", "total_time", "engine_hours", "engine_model", "tbo", "avionics", "asking_price"];
  for (const key of fields) {
    const val = extracted?.[key];
    if (val != null && String(val).trim() !== "" && String(merged[key] || "").trim() === "") {
      merged[key] = key === "avionics" ? String(val) : val;
    }
  }
  const engineModel = merged.engine_model || guessEngineFromMakeModel(merged.make, merged.model);
  if (engineModel) {
    const resolved = resolveTboForEngine(engineModel);
    if (resolved.tbo && !merged.tbo) merged.tbo = resolved.tbo;
    return { merged, engineModel, resolved };
  }
  return { merged, engineModel: "", resolved: null };
}

/** Live resolution from current form state — for inline TBO hints in the UI. */
export function resolveTboFromForm(form) {
  const engineModel = form.engine_model || guessEngineFromMakeModel(form.make, form.model);
  return { engineModel, ...resolveTboForEngine(engineModel) };
}