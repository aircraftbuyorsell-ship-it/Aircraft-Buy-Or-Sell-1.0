import { base44 } from "@/api/base44Client";

export async function orchestrateATIScoring({ input, nReg }) {
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
  return res;
}