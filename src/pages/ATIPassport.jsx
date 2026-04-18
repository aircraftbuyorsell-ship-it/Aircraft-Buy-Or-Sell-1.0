import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Cpu, ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#D4A017]">{children}</p>;
}

function ScoreRing({ score, maxScore = 120, label: scoreLabel }) {
  if (score == null) return null;
  const pct = score / maxScore;
  const r = 56;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const color = score >= 96 ? "#0F7A56" : score >= 76 ? "#185FA5" : score >= 56 ? "#D4A017" : score >= 36 ? "#A67C00" : "#C0392B";
  const label = scoreLabel || (score >= 96 ? "Excellent" : score >= 76 ? "Good" : score >= 56 ? "Fair" : score >= 36 ? "Below Avg" : "Poor");
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#F0EDE6" strokeWidth="8" />
          <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-[#1A1814]">{score}</span>
          <span className="text-[10px] uppercase tracking-widest text-[#AAA49C] font-semibold">ATI Score</span>
        </div>
      </div>
      <span className="text-sm font-bold" style={{ color }}>{label}</span>
    </div>
  );
}

function DimBar({ label, value, max = 15, desc }) {
  const pct = ((value ?? 0) / max) * 100;
  const color = pct >= 80 ? "#0F7A56" : pct >= 55 ? "#D4A017" : "#C0392B";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-[12px] font-semibold text-[#1A1814]">{label}</span>
          <span className="text-[10px] text-[#AAA49C] ml-1.5">{desc}</span>
        </div>
        <span className="text-[12px] font-black text-[#1A1814] shrink-0 ml-2">{value ?? "—"}<span className="text-[#AAA49C] font-normal text-[10px]">/{max}</span></span>
      </div>
      <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// 120pt scale: 8 modules × 15 pts each
const DIMS = [
  { key: "documentation", label: "Documentation Completeness", max: 15, desc: "Logbooks, records" },
  { key: "technical", label: "Maintenance Traceability", max: 15, desc: "AD compliance, trail" },
  { key: "transparency", label: "Engine Health", max: 15, desc: "SMOH vs TBO, compressions" },
  { key: "transaction_ready", label: "Avionics Quality", max: 15, desc: "GPS/WAAS, ADS-B, autopilot" },
  { key: "usage_mission", label: "Usage / Mission Risk", max: 15, desc: "Private vs training vs charter" },
  { key: "storage_exposure", label: "Storage & Exposure", max: 15, desc: "Hangared dry vs outdoor" },
  { key: "config_clarity", label: "Configuration Clarity", max: 15, desc: "Specs consistency, STCs" },
  { key: "market_readiness", label: "Market Readiness", max: 15, desc: "Annual freshness, photos" },
];

function parseList(str) {
  if (!str) return [];
  return str.split("\n").filter(Boolean);
}

export default function ATIPassport() {
  const { listingId } = useParams();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const { data: listing, isLoading: loadingListing } = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => base44.entities.AircraftListing.get(listingId),
    enabled: !!listingId,
  });

  const { data: passport, isLoading: loadingPassport } = useQuery({
    queryKey: ["passport", listingId],
    queryFn: async () => {
      const all = await base44.entities.ATIPassport.filter({ listing: listingId }, "-created_date", 1);
      return all[0] || null;
    },
    enabled: !!listingId,
  });

  const isLoading = loadingListing || loadingPassport;

  const handleGenerate = async () => {
    if (!listing) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the ATI (Aircraft Transparency Index) scoring engine for the ABOS platform.
Score this aircraft listing across 8 dimensions, each scored 0–15 points (integer), for a maximum total of 120 points.

Scoring rubric (each out of 15):
1. documentation: Logbook completeness, airframe/engine records availability
2. technical: AD compliance, maintenance traceability, known squawks
3. transparency: Engine SMOH vs TBO, compression data, oil consumption info
4. transaction_ready: Avionics quality — GPS/WAAS, ADS-B, autopilot capability
5. usage_mission: Usage risk — private use scores higher than flight school or charter
6. storage_exposure: Hangared & dry climate vs outdoor or coastal exposure
7. config_clarity: Spec consistency, STC documentation, no ambiguous mods
8. market_readiness: Annual inspection freshness, quality of photos, listing completeness

Be conservative and realistic. Missing data should lower the score for that dimension.

Aircraft data:
${JSON.stringify(listing, null, 2)}

Return JSON with integer scores (0-15 each) plus narrative fields:
{
  "documentation": 0-15,
  "technical": 0-15,
  "transparency": 0-15,
  "transaction_ready": 0-15,
  "usage_mission": 0-15,
  "storage_exposure": 0-15,
  "config_clarity": 0-15,
  "market_readiness": 0-15,
  "ai_summary": "2-3 sentence executive summary",
  "strengths": ["string", "string", "string"],
  "risks": ["string", "string", "string"],
  "recommendations": ["string", "string", "string"]
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
            ai_summary: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
          },
        },
      });

      const ati_total = result.documentation + result.technical + result.transparency +
        result.transaction_ready + result.usage_mission + result.storage_exposure +
        result.config_clarity + result.market_readiness;

      // OMVM valuation
      const tbo = listing.tbo || 2000;
      const engineAdj = (tbo - (listing.engine_hours || 0)) * 12;
      const avionicsAdj = (listing.avionics?.split(",").length || 0) * 4500;
      const maintAdj = listing.fresh_annual ? 6000 : 0;
      const omvm_value = Math.round(200000 + engineAdj + avionicsAdj + maintAdj);
      const discountPct = listing.asking_price
        ? Math.round(((omvm_value - listing.asking_price) / omvm_value) * 1000) / 10
        : null;
      const deal_score = discountPct == null ? null
        : discountPct > 25 ? 9.5 : discountPct > 15 ? 8.5 : discountPct > 8 ? 7.5
        : discountPct > 2 ? 6.5 : discountPct < -15 ? 2.5 : discountPct < -5 ? 4.0 : 5.0;
      const deal_label = deal_score == null ? null
        : deal_score >= 8.5 ? "hot deal" : deal_score >= 6.5 ? "good deal"
        : deal_score >= 5 ? "fair" : "overpriced";

      await base44.entities.ATIPassport.create({
        listing: listingId,
        ati_total,
        documentation: result.documentation,
        technical: result.technical,
        transparency: result.transparency,
        transaction_ready: result.transaction_ready,
        usage_mission: result.usage_mission,
        storage_exposure: result.storage_exposure,
        config_clarity: result.config_clarity,
        market_readiness: result.market_readiness,
        ai_summary: result.ai_summary,
        strengths: result.strengths.join("\n"),
        risks: result.risks.join("\n"),
        recommendations: result.recommendations.join("\n"),
        omvm_value,
        deal_score,
        deal_label,
        discount_pct: discountPct,
        ati_version: "v2",
      });
      await base44.entities.AircraftListing.update(listingId, {
        ati_score: ati_total,
        omvm_value,
        deal_score,
        deal_label,
        discount_pct: discountPct,
      });

      queryClient.invalidateQueries({ queryKey: ["passport", listingId] });
      queryClient.invalidateQueries({ queryKey: ["listing", listingId] });
    } catch (e) {
      setError(e.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <Link to="/listings" className="inline-flex items-center gap-1.5 text-[11px] text-[#AAA49C] hover:text-[#D4A017] mb-3 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Listings
        </Link>
        <GoldLabel>ATI Passport · v2</GoldLabel>
        {isLoading ? (
          <div className="h-8 w-64 bg-black/5 rounded animate-pulse mt-1" />
        ) : (
          <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight mt-1">
            {listing?.make} {listing?.model}
            {listing?.registration && <span className="text-[#AAA49C] font-mono text-lg ml-2">{listing.registration}</span>}
          </h1>
        )}
        <p className="text-[#6B6560] text-sm mt-0.5">Aircraft Transparency Index Analysis</p>
      </div>

      <div className="px-4 md:px-8 pb-8 max-w-4xl space-y-5">
        {isLoading ? (
          <div className="space-y-4">
            <div className="bg-white border border-black/[0.07] rounded-2xl h-48 animate-pulse" />
            <div className="bg-white border border-black/[0.07] rounded-2xl h-48 animate-pulse" />
          </div>
        ) : !passport ? (
          /* Empty state */
          <div className="bg-white border border-black/[0.07] rounded-2xl p-8 md:p-12 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[#F7F4EF] border border-black/[0.07] flex items-center justify-center mb-5">
              <Cpu className="w-9 h-9 text-[#AAA49C]" />
            </div>
            <h2 className="text-xl font-black text-[#1A1814] mb-2">No ATI Passport yet</h2>
            <p className="text-[#6B6560] text-sm mb-6 max-w-sm">
              Generate an AI-powered Aircraft Transparency Index analysis for{" "}
              <span className="font-semibold text-[#1A1814]">{listing?.make} {listing?.model}</span>.
            </p>
            {error && (
              <div className="bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] text-[#C0392B] text-sm rounded-xl px-4 py-2.5 mb-4">
                {error}
              </div>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 bg-[#D4A017] hover:bg-[#A67C00] disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-colors"
            >
              <Cpu className={`w-5 h-5 ${generating ? "animate-pulse" : ""}`} />
              {generating ? "Generating ATI Score…" : "Generate ATI Score"}
            </button>
          </div>
        ) : (
          <>
            {/* Score + Dimensions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-black/[0.07] rounded-2xl p-6 flex flex-col items-center justify-center">
                <ScoreRing score={passport.ati_total} maxScore={120} />
                <div className="mt-4 text-center">
                  <p className="text-[11px] text-[#AAA49C]">{listing?.make} {listing?.model}</p>
                  {listing?.registration && <p className="text-xs text-[#AAA49C] font-mono">{listing.registration}</p>}
                </div>
              </div>
              <div className="bg-white border border-black/[0.07] rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <GoldLabel>ATI Score Dimensions</GoldLabel>
                  <span className="text-[9px] text-[#AAA49C] font-semibold uppercase tracking-wider">8 modules × 15 pts</span>
                </div>
                {DIMS.map(d => (
                  <DimBar key={d.key} label={d.label} value={passport[d.key]} max={d.max} desc={d.desc} />
                ))}
              </div>
            </div>

            {/* Valuation */}
            <div className="bg-white border border-[rgba(212,160,23,0.25)] rounded-2xl p-5 md:p-6">
              <GoldLabel>OMVM Valuation</GoldLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                {[
                  { label: "Asking Price", value: listing?.asking_price ? `$${listing.asking_price.toLocaleString()}` : "—" },
                  { label: "OMVM Estimate", value: passport.omvm_value ? `$${passport.omvm_value.toLocaleString()}` : "—" },
                  { label: "Discount", value: passport.discount_pct != null ? `${passport.discount_pct >= 0 ? "▼" : "▲"} ${Math.abs(passport.discount_pct)}%` : "—", color: passport.discount_pct >= 0 ? "#0F7A56" : "#C0392B" },
                  { label: "Deal Label", value: passport.deal_label || "—", color: "#D4A017" },
                ].map(item => (
                  <div key={item.label} className="bg-[#F7F4EF] rounded-xl p-3">
                    <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold mb-1">{item.label}</p>
                    <p className="text-base font-black capitalize" style={{ color: item.color || "#1A1814" }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Summary */}
            {passport.ai_summary && (
              <div className="bg-white border border-black/[0.07] rounded-2xl p-5 md:p-6">
                <GoldLabel>AI Analysis</GoldLabel>
                <p className="text-sm text-[#6B6560] leading-relaxed mt-3">{passport.ai_summary}</p>
              </div>
            )}

            {/* Regenerate button */}
            <div className="flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 text-[11px] text-[#AAA49C] hover:text-[#D4A017] disabled:opacity-40 transition-colors font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
                {generating ? "Regenerating…" : "Regenerate ATI Score"}
              </button>
            </div>

            {/* Strengths / Risks / Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Strengths", data: parseList(passport.strengths), icon: CheckCircle, color: "#0F7A56", bg: "rgba(15,122,86,0.06)" },
                { title: "Risks", data: parseList(passport.risks), icon: AlertTriangle, color: "#C0392B", bg: "rgba(192,57,43,0.06)" },
                { title: "Recommendations", data: parseList(passport.recommendations), icon: ShieldCheck, color: "#D4A017", bg: "rgba(212,160,23,0.06)" },
              ].map(section => (
                <div key={section.title} className="bg-white border border-black/[0.07] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <section.icon className="w-4 h-4" style={{ color: section.color }} />
                    <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: section.color }}>{section.title}</p>
                  </div>
                  {section.data.length === 0 ? (
                    <p className="text-[11px] text-[#AAA49C]">—</p>
                  ) : (
                    <ul className="space-y-2">
                      {section.data.map((item, i) => (
                        <li key={i} className="flex gap-2 text-[12px] text-[#6B6560]">
                          <span className="shrink-0 w-1 h-1 rounded-full mt-1.5" style={{ backgroundColor: section.color }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}