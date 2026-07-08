import { base44 } from "@/api/base44Client";
import { getOMVMBase, getOMVMConfidence } from "../utils/omvmBaseLookup";

/** Extract make / model / year from free-form listing text for OMVM base lookup. */
function parseAircraftIdentity(text) {
  const t = text || "";
  const year = (t.match(/\b(19|20)\d{2}\b/) || [])[0] || null;
  const KNOWN_MAKES = [
    "CESSNA", "PIPER", "BEECHCRAFT", "CIRRUS", "DIAMOND", "MOONEY",
    "SOCATA", "DAHER", "PILATUS", "TECNAM", "EXTRA", "GRUMMAN",
    "MAULE", "COLUMBIA", "ROBIN", "ZLIN", "LET",
  ];
  const upper = t.toUpperCase();
  let make = KNOWN_MAKES.find((m) => upper.includes(m)) || "";
  // Model = token(s) right after the make
  let model = "";
  if (make) {
    const after = upper.split(make)[1] || "";
    model = (after.trim().match(/^[A-Z0-9-]+(\s?[A-Z0-9-]+)?/) || [""])[0].trim();
  }
  // Cessna shorthand: "C150", "C-172", "C182T" (avoid matching N-numbers)
  if (!make) {
    const cShort = upper.match(/\bC-?(1[0-9]{2}[A-Z]{0,2}|2[0-9]{2}[A-Z]{0,2}|3[0-9]{2}|4[0-9]{2})\b/);
    if (cShort) {
      make = "CESSNA";
      model = cShort[1];
    }
  }
  return { make, model, year };
}

export async function orchestrateATIScoring({ input, nReg }) {
  const { make, model, year } = parseAircraftIdentity(input);
  const omvmBase = getOMVMBase(make, model, year);
  const omvmConfidence = getOMVMConfidence(make, model);

  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an aviation transaction intelligence engine. Analyse the following aircraft listing text and return a structured ATI Quick Score.

AIRCRAFT DATA:
${input}

Score each of these 8 dimensions on a 0–15 scale:
1. documentation (logbooks, FAA records, maintenance history completeness)
2. technical (airframe condition, AD compliance, recent maintenance)
3. transparency (seller disclosure quality, data completeness)
4. transaction_ready (annual freshness, pre-buy willingness, title clarity)
5. usage_mission (private vs training vs charter, pilot-owned vs fleet)
6. storage_exposure (hangared, climate, coastal exposure)
7. config_clarity (STCs, mods, weight & balance, specs accuracy)
8. market_readiness (price alignment, presentation quality, responsiveness)

Also estimate:
- omvm_low: lower bound of Off-Market Value Model range (USD integer)
- omvm_high: upper bound of OMVM range (USD integer)
- asking_price: extract from text if present (USD integer or null)
- flash_line: single most important thing a buyer must know (max 20 words)

Return ONLY valid JSON.`,
    response_json_schema: {
      type: "object",
      properties: {
        documentation: { type: "number" },
        technical: { type: "number" },
        transparency: { type: "number" },
        transaction_ready: { type: "number" },
        usage_mission: { type: "number" },
        storage_exposure: { type: "number" },
        config_clarity: { type: "number" },
        market_readiness: { type: "number" },
        reasons: {
          type: "object",
          properties: {
            documentation: { type: "string" },
            technical: { type: "string" },
            transparency: { type: "string" },
            transaction_ready: { type: "string" },
            usage_mission: { type: "string" },
            storage_exposure: { type: "string" },
            config_clarity: { type: "string" },
            market_readiness: { type: "string" },
          },
        },
        omvm_low: { type: "number" },
        omvm_high: { type: "number" },
        asking_price: { nullable: true, type: "number" },
        flash_line: { type: "string" },
      },
    },
  });

  // Anchor OMVM range around the deterministic per-make/model market base —
  // but ONLY on an exact model match ("high" confidence). A make-only match
  // uses a generic make average (e.g. all Cessnas ≈ $110k+) which produces
  // nonsense values for specific models (C150 shown at $180k). With make-only
  // or no match, trust the LLM's listing-aware estimate instead.
  if (omvmBase > 0 && omvmConfidence === "high") {
    res.omvm_low = Math.round(omvmBase * 0.85);
    res.omvm_high = Math.round(omvmBase * 1.15);
  } else if (!res.omvm_low || !res.omvm_high || res.omvm_low <= 0 || res.omvm_high <= res.omvm_low) {
    // LLM returned no usable range — fall back to the deterministic base
    res.omvm_low = Math.round(omvmBase * 0.8);
    res.omvm_high = Math.round(omvmBase * 1.2);
  }
  res.omvm_base = omvmBase;
  res.omvm_confidence = omvmConfidence;

  return res;
}