import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Cpu, ArrowLeft, ShieldCheck, TrendingDown, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#D4A017]">{children}</p>;
}

function ScoreRing({ score, maxScore = 120 }) {
  if (score == null) return null;
  const pct = score / maxScore;
  const r = 56;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const color = score >= 90 ? "#0F7A56" : score >= 65 ? "#D4A017" : "#C0392B";
  const label = score >= 90 ? "Excellent" : score >= 65 ? "Good" : "Poor";
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

function DimBar({ label, value, weight }) {
  const color = value >= 80 ? "#0F7A56" : value >= 55 ? "#D4A017" : "#C0392B";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-[#6B6560]">{label}</span>
        <span className="text-[11px] font-bold text-[#1A1814]">{value ?? "—"}<span className="text-[#AAA49C] font-normal">/100</span></span>
      </div>
      <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value ?? 0}%`, backgroundColor: color }} />
      </div>
      <p className="text-[9px] text-[#AAA49C] mt-0.5">{weight}% weight</p>
    </div>
  );
}

const DIMS = [
  { key: "technical", label: "Technical Condition", weight: 30 },
  { key: "documentation", label: "Documentation", weight: 25 },
  { key: "transparency", label: "Transparency", weight: 25 },
  { key: "transaction_ready", label: "Transaction Ready", weight: 20 },
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
        prompt: `You are the ATI scoring engine for ABOS platform. Score this aircraft on 4 dimensions (0-100):
- technical: airframe condition, engine hours vs TBO, maintenance
- documentation: logbook completeness, annual currency
- transparency: completeness of listing information
- transaction_ready: readiness to transact

Aircraft data: ${JSON.stringify(listing)}

Return ONLY JSON:
{"technical": number, "documentation": number, "transparency": number, "transaction_ready": number, "ai_summary": "string", "strengths": ["string","string"], "risks": ["string","string"], "recommendations": ["string","string"]}`,
        response_json_schema: {
          type: "object",
          properties: {
            technical: { type: "number" }, documentation: { type: "number" },
            transparency: { type: "number" }, transaction_ready: { type: "number" },
            ai_summary: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
          },
        },
      });

      const ati_total = Math.round((result.technical * 0.3 + result.documentation * 0.25 + result.transparency * 0.25 + result.transaction_ready * 0.2) * 10) / 10;
      const tbo = listing.tbo || 2000;
      const engineAdj = (tbo - (listing.engine_hours || 0)) * 12;
      const avionicsAdj = (listing.avionics?.split(",").length || 0) * 4500;
      const maintAdj = listing.fresh_annual ? 6000 : 0;
      const omvm_value = Math.round(200000 + engineAdj + avionicsAdj + maintAdj);
      const discountPct = ((omvm_value - (listing.asking_price || 0)) / omvm_value) * 100;
      const deal_score = discountPct > 25 ? 9.5 : discountPct > 15 ? 8.5 : discountPct > 8 ? 7.5 : discountPct > 2 ? 6.5 : discountPct < -15 ? 2.5 : discountPct < -5 ? 4.0 : 5.0;
      const deal_label = deal_score >= 8.5 ? "hot deal" : deal_score >= 6.5 ? "good deal" : deal_score >= 5 ? "fair" : "overpriced";

      await base44.entities.ATIPassport.create({
        listing: listingId, ati_total, ...result,
        strengths: result.strengths.join("\n"), risks: result.risks.join("\n"),
        recommendations: result.recommendations.join("\n"),
        omvm_value, deal_score, deal_label, discount_pct: Math.round(discountPct * 10) / 10, ati_version: "v2",
      });
      await base44.entities.AircraftListing.update(listingId, { ati_score: ati_total, omvm_value, deal_score, deal_label, discount_pct: Math.round(discountPct * 10) / 10 });

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
                <ScoreRing score={passport.ati_total} />
                <div className="mt-4 text-center">
                  <p className="text-[11px] text-[#AAA49C]">{listing?.make} {listing?.model}</p>
                  {listing?.registration && <p className="text-xs text-[#AAA49C] font-mono">{listing.registration}</p>}
                </div>
              </div>
              <div className="bg-white border border-black/[0.07] rounded-2xl p-6 space-y-4">
                <GoldLabel>Score Dimensions</GoldLabel>
                {DIMS.map(d => (
                  <DimBar key={d.key} label={d.label} value={passport[d.key]} weight={d.weight} />
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