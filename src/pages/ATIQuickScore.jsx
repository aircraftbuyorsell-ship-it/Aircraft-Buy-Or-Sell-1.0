import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useLocation } from "react-router-dom";
import { Zap, ChevronDown, ChevronUp, Mail, Lock, Loader2 } from "lucide-react";
import { cleanAircraftMake } from "@/lib/cleanAircraftMake";
import QuickScoreResult from "@/components/ati/QuickScoreResult";

export default function ATIQuickScore() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const prefillId = params.get("listing");

  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [nReg, setNReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [blurred, setBlurred] = useState(true);
  const [email, setEmail] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  const { data: listings = [] } = useQuery({
    queryKey: ["listings-active"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }),
  });

  // Auto-fill from listing ID in URL
  useState(() => {
    if (prefillId && listings.length > 0) {
      const l = listings.find((x) => x.id === prefillId);
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
    if (l.registration) setNReg(l.registration);
    setShowPicker(false);
    setResult(null);
    setBlurred(true);
    setUnlocked(false);
    setError("");
  }

  function extractNReg(text) {
    const match = text.match(/N\d{1,6}[A-Z]{0,2}/i);
    return match ? match[0].toUpperCase() : "";
  }

  async function handleScore() {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setBlurred(true);
    setUnlocked(false);
    setError("");

    const detectedReg = extractNReg(input);
    if (detectedReg && !nReg) setNReg(detectedReg);

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
      setResult(res);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Scoring failed. Please try again.");
    }
    setLoading(false);
  }

  async function handleUnlock() {
    if (!email.trim()) return;
    setUnlocking(true);
    setError("");
    try {
      await base44.functions.invoke("unlockAtiQuickScore", { nReg, email, result });
      setUnlocked(true);
      setBlurred(false);
    } catch (e) {
      setError(e?.response?.data?.error || "Unlock failed. You may not have enough credits.");
    }
    setUnlocking(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "#0A081E" }}>
      {/* Header */}
      <div className="px-4 md:px-8 pt-8 pb-6 border-b border-white/[0.07]">
        <p className="text-[9px] uppercase tracking-[0.3em] font-black mb-1" style={{ color: "#00f5ff" }}>
          ATI Tool 1 · 3 credits
        </p>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white leading-tight">
          ATI Quick Score
        </h1>
        <p className="text-white/45 text-[12px] mt-2">
          Paste any listing text or N-number. Get an instant 8-dimension scorecard — unlocked after credit payment.
        </p>
      </div>

      <div className="px-4 md:px-8 py-6 grid lg:grid-cols-[1fr_420px] gap-6 items-start">
        {/* Input panel */}
        <div>
          {/* Listing picker */}
          <div className="mb-4">
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="flex items-center gap-2 text-[11px] font-bold px-4 py-2 rounded-lg border border-white/[0.12] text-white/60 hover:text-white hover:border-white/20 transition-colors">
              Or load from a saved listing {showPicker ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showPicker && listings.length > 0 && (
              <div className="mt-2 rounded-xl border border-white/[0.1] overflow-hidden max-h-56 overflow-y-auto"
                style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(16px)" }}>
                {listings.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => prefillFromListing(l)}
                    className="w-full flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.06] transition-colors text-left">
                    <span className="text-[12px] text-white font-semibold">{l.year} {cleanAircraftMake(l.make)} {l.model}</span>
                    <span className="text-[10px] text-white/35 font-mono">{l.registration || "—"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {nReg && (
            <div className="mb-3 px-3 py-2 rounded-lg flex items-center gap-2"
              style={{ background: "rgba(0,245,255,0.06)", border: "1px solid rgba(0,245,255,0.15)" }}>
              <span className="text-[9px] uppercase tracking-wider font-bold text-[#00f5ff]">N-Reg detected:</span>
              <span className="text-[11px] font-black text-white">{nReg}</span>
            </div>
          )}

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onBlur={() => { const r = extractNReg(input); if (r) setNReg(r); }}
            placeholder={`Paste listing text, N-number, or aircraft specs here…

Example:
2005 Mooney M20C
Reg: N12345
Airframe TT: 3,200 hrs
Engine SMOH: 850 hrs / TBO 1,800
Last Annual: March 2024
Avionics: Garmin G500, GFC 500 AP, ADS-B
Asking: $85,000
Hangared, private owner, all logs`}
            rows={14}
            className="w-full rounded-xl px-4 py-3 text-[13px] leading-relaxed resize-none focus:outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.9)",
            }}
          />

          {error && (
            <div className="mt-3 px-4 py-2.5 rounded-lg text-[12px] font-bold"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
              {error}
            </div>
          )}

          <button
            onClick={handleScore}
            disabled={loading || !input.trim()}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-[13px] uppercase tracking-widest transition-all active:scale-98 disabled:opacity-40"
            style={{
              background: loading ? "rgba(0,245,255,0.1)" : "rgba(0,245,255,0.12)",
              border: "1px solid rgba(0,245,255,0.35)",
              color: "#00f5ff",
            }}>
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

          {result && (
            <div className="space-y-4">
              <QuickScoreResult result={result} nReg={nReg} blurred={blurred} unlocking={unlocking} unlocked={unlocked} />

              {/* ── Unlock CTA ────────────────────────────── */}
              {blurred && !unlocked && (
                <div className="rounded-2xl p-5 border border-[#D4A017]/25"
                  style={{ background: "rgba(212,160,23,0.06)", backdropFilter: "blur(24px)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4 text-[#D4A017]" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A017]">Unlock Full Scorecard</p>
                  </div>
                  <p className="text-white/60 text-[12px] mb-4">
                    Enter your email to receive the complete ATI score. <strong className="text-[#D4A017]">3 credits</strong> will be deducted.
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
                      <Mail className="w-4 h-4 text-white/30 shrink-0" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
                        placeholder="your@email.com"
                        className="flex-1 bg-transparent border-none outline-none text-white text-[13px]"
                        style={{ background: "transparent !important", border: "none !important", color: "#fff !important" }}
                      />
                    </div>
                    <button
                      onClick={handleUnlock}
                      disabled={unlocking || !email.trim()}
                      className="px-5 py-2.5 rounded-lg font-black text-[12px] uppercase tracking-wider transition-all disabled:opacity-40 active:scale-95"
                      style={{
                        background: unlocking ? "rgba(212,160,23,0.2)" : "linear-gradient(135deg, #D4A017, #A67C00)",
                        color: unlocking ? "#D4A017" : "#0B2D5B",
                      }}>
                      {unlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unlock"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}