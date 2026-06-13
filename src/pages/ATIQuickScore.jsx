import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useLocation } from "react-router-dom";
import { Zap, ChevronDown, ChevronUp } from "lucide-react";
import { cleanAircraftMake } from "@/lib/cleanAircraftMake";

const DIMS = [
  { key: "documentation",      label: "Documentation & Records" },
  { key: "technical",          label: "Technical Condition" },
  { key: "transparency",       label: "Seller Transparency" },
  { key: "transaction_ready",  label: "Transaction Readiness" },
  { key: "usage_mission",      label: "Usage & Mission" },
  { key: "storage_exposure",   label: "Storage & Exposure" },
  { key: "config_clarity",     label: "Configuration Clarity" },
  { key: "market_readiness",   label: "Market Readiness" },
];

function verdictFor(total) {
  if (total >= 100) return { label: "EXCEPTIONAL",  color: "#00f5ff" };
  if (total >= 85)  return { label: "STRONG BUY",   color: "#0F7A56" };
  if (total >= 65)  return { label: "FAIR",          color: "#D4A017" };
  if (total >= 45)  return { label: "CAUTION",       color: "#E8762D" };
  if (total >= 20)  return { label: "RED FLAGS",     color: "#C0392B" };
  return               { label: "AVOID",         color: "#7f0000" };
}

function parseLLMResult(text) {
  try { return JSON.parse(text); } catch {}
  return null;
}

function DimBar({ label, score, reason }) {
  const pct = (score / 15) * 100;
  const color = score >= 13 ? "#00f5ff" : score >= 10 ? "#0F7A56" : score >= 7 ? "#D4A017" : "#C0392B";
  return (
    <div className="py-3 border-b border-white/[0.06] last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-white/80">{label}</span>
        <span className="text-[13px] font-black" style={{ color }}>{score}<span className="text-white/30 text-[10px]">/15</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-1.5">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      {reason && <p className="text-[10px] text-white/45 leading-snug">{reason}</p>}
    </div>
  );
}

export default function ATIQuickScore() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const prefillId = params.get("listing");

  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const { data: listings = [] } = useQuery({
    queryKey: ["listings-active"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }),
  });

  // Auto-fill from listing ID in URL
  useState(() => {
    if (prefillId && listings.length > 0) {
      const l = listings.find(x => x.id === prefillId);
      if (l) prefillFromListing(l);
    }
  });

  function prefillFromListing(l) {
    const make = cleanAircraftMake(l.make);
    const lines = [
      `${l.year || ""} ${make} ${l.model || ""}`.trim(),
      l.registration ? `Registration: ${l.registration}` : "",
      l.total_time != null ? `Airframe Total Time: ${l.total_time} hrs` : "",
      l.engine_hours != null ? `Engine SMOH: ${l.engine_hours} hrs` : "",
      l.tbo != null ? `TBO: ${l.tbo} hrs` : "",
      l.last_annual ? `Last Annual: ${l.last_annual}` : "",
      l.avionics ? `Avionics: ${l.avionics}` : "",
      l.asking_price != null ? `Asking Price: $${l.asking_price.toLocaleString()}` : "",
      l.ai_summary ? `Notes: ${l.ai_summary}` : "",
    ].filter(Boolean);
    setInput(lines.join("\n"));
    setShowPicker(false);
    setResult(null);
  }

  async function handleScore() {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    try {
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

Return ONLY valid JSON matching this schema exactly:
{
  "documentation": number,
  "technical": number,
  "transparency": number,
  "transaction_ready": number,
  "usage_mission": number,
  "storage_exposure": number,
  "config_clarity": number,
  "market_readiness": number,
  "reasons": {
    "documentation": "one-line reason",
    "technical": "one-line reason",
    "transparency": "one-line reason",
    "transaction_ready": "one-line reason",
    "usage_mission": "one-line reason",
    "storage_exposure": "one-line reason",
    "config_clarity": "one-line reason",
    "market_readiness": "one-line reason"
  },
  "omvm_low": number,
  "omvm_high": number,
  "asking_price": number or null,
  "flash_line": "string"
}`,
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
            reasons: { type: "object" },
            omvm_low: { type: "number" },
            omvm_high: { type: "number" },
            asking_price: {},
            flash_line: { type: "string" },
          },
        },
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const total = result
    ? (result.documentation || 0) + (result.technical || 0) + (result.transparency || 0) +
      (result.transaction_ready || 0) + (result.usage_mission || 0) + (result.storage_exposure || 0) +
      (result.config_clarity || 0) + (result.market_readiness || 0)
    : null;
  const dealScore = total != null ? ((total / 120) * 10).toFixed(1) : null;
  const verdict = total != null ? verdictFor(total) : null;
  const omvmMid = result ? Math.round((result.omvm_low + result.omvm_high) / 2) : null;
  const priceDiff = result?.asking_price && omvmMid
    ? (((omvmMid - result.asking_price) / omvmMid) * 100).toFixed(1)
    : null;

  return (
    <div className="min-h-screen" style={{ background: "#0A081E" }}>
      {/* Header */}
      <div className="px-4 md:px-8 pt-8 pb-6 border-b border-white/[0.07]">
        <p className="text-[9px] uppercase tracking-[0.3em] font-black mb-1" style={{ color: "#00f5ff" }}>
          ATI Tool 1 · Free
        </p>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white leading-tight">
          ATI Quick Score
        </h1>
        <p className="text-white/45 text-[12px] mt-2">
          Paste any listing text, N-number, or specs. Get an instant 8-dimension scorecard.
        </p>
      </div>

      <div className="px-4 md:px-8 py-6 grid lg:grid-cols-[1fr_420px] gap-6 items-start">
        {/* Input panel */}
        <div>
          {/* Listing picker */}
          <div className="mb-4">
            <button
              onClick={() => setShowPicker(v => !v)}
              className="flex items-center gap-2 text-[11px] font-bold px-4 py-2 rounded-lg border border-white/[0.12] text-white/60 hover:text-white hover:border-white/20 transition-colors"
            >
              Or load from a saved listing {showPicker ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showPicker && listings.length > 0 && (
              <div className="mt-2 rounded-xl border border-white/[0.1] overflow-hidden max-h-56 overflow-y-auto"
                style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(16px)" }}>
                {listings.map(l => (
                  <button key={l.id} onClick={() => prefillFromListing(l)}
                    className="w-full flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.06] transition-colors text-left">
                    <span className="text-[12px] text-white font-semibold">{l.year} {cleanAircraftMake(l.make)} {l.model}</span>
                    <span className="text-[10px] text-white/35 font-mono">{l.registration || "—"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Paste listing text, N-number, or aircraft specs here…\n\nExample:\n2005 Mooney M20C\nReg: N12345\nAirframe TT: 3,200 hrs\nEngine SMOH: 850 hrs / TBO 1,800\nLast Annual: March 2024\nAvionics: Garmin G500, GFC 500 AP, ADS-B\nAsking: $85,000\nHangared, private owner, all logs`}
            rows={14}
            className="w-full rounded-xl px-4 py-3 text-[13px] leading-relaxed resize-none focus:outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.9)",
            }}
          />
          <button
            onClick={handleScore}
            disabled={loading || !input.trim()}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-[13px] uppercase tracking-widest transition-all active:scale-98 disabled:opacity-40"
            style={{
              background: loading ? "rgba(0,245,255,0.1)" : "rgba(0,245,255,0.12)",
              border: "1px solid rgba(0,245,255,0.35)",
              color: "#00f5ff",
            }}
          >
            <Zap className="w-4 h-4" />
            {loading ? "Analysing…" : "Run ATI Quick Score"}
          </button>
        </div>

        {/* Result panel */}
        <div>
          {!result && !loading && (
            <div className="rounded-2xl border border-white/[0.07] p-8 text-center"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              <Zap className="w-10 h-10 mx-auto mb-3 text-white/20" />
              <p className="text-white/30 text-sm">Score will appear here</p>
            </div>
          )}

          {loading && (
            <div className="rounded-2xl border border-white/[0.07] p-8 text-center"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="w-10 h-10 mx-auto mb-4 border-2 border-[#00f5ff]/30 border-t-[#00f5ff] rounded-full animate-spin" />
              <p className="text-white/40 text-[12px]">Running ATI analysis…</p>
            </div>
          )}

          {result && verdict && (
            <div className="rounded-2xl overflow-hidden border border-white/[0.1]"
              style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)" }}>

              {/* Score hero */}
              <div className="px-6 py-5 border-b border-white/[0.08]"
                style={{ background: `${verdict.color}0d` }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.25em] font-black" style={{ color: verdict.color }}>ATI Quick Score</p>
                    <p className="text-5xl font-black leading-none text-white mt-1">{total}<span className="text-lg text-white/30">/120</span></p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black" style={{ color: verdict.color }}>{dealScore}</div>
                    <div className="text-[9px] text-white/40 uppercase tracking-wider">Deal Score /10</div>
                    <div className="mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block"
                      style={{ background: `${verdict.color}18`, border: `1px solid ${verdict.color}40`, color: verdict.color }}>
                      {verdict.label}
                    </div>
                  </div>
                </div>
                {/* Total bar */}
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(total / 120) * 100}%`, background: `linear-gradient(90deg, ${verdict.color}80, ${verdict.color})` }} />
                </div>
              </div>

              {/* Flash line */}
              {result.flash_line && (
                <div className="px-5 py-3 border-b border-white/[0.07]"
                  style={{ background: "rgba(212,160,23,0.06)" }}>
                  <p className="text-[9px] uppercase tracking-wider text-[#D4A017] font-black mb-0.5">⚡ Key Buyer Alert</p>
                  <p className="text-white text-[13px] font-semibold leading-snug">{result.flash_line}</p>
                </div>
              )}

              {/* Valuation */}
              {omvmMid && (
                <div className="px-5 py-4 border-b border-white/[0.07] grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-white/35 font-semibold">OMVM Range</p>
                    <p className="text-[13px] font-black text-white/80">
                      ${result.omvm_low.toLocaleString()} – ${result.omvm_high.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-white/35 font-semibold">Midpoint</p>
                    <p className="text-[13px] font-black text-white">${omvmMid.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-white/35 font-semibold">Asking</p>
                    {result.asking_price ? (
                      <>
                        <p className="text-[13px] font-black text-white">${result.asking_price.toLocaleString()}</p>
                        {priceDiff && (
                          <p className="text-[10px] font-bold" style={{ color: parseFloat(priceDiff) >= 0 ? "#0F7A56" : "#C0392B" }}>
                            {parseFloat(priceDiff) >= 0 ? "▼" : "▲"} {Math.abs(parseFloat(priceDiff))}% {parseFloat(priceDiff) >= 0 ? "below" : "above"} market
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-[12px] text-white/30">Not listed</p>
                    )}
                  </div>
                </div>
              )}

              {/* Dimension bars */}
              <div className="px-5 py-4">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/35 font-black mb-3">8-Dimension Breakdown</p>
                {DIMS.map(d => (
                  <DimBar
                    key={d.key}
                    label={d.label}
                    score={result[d.key] || 0}
                    reason={result.reasons?.[d.key]}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}