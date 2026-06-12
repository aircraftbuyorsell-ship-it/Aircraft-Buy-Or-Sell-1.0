import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck, AlertTriangle, CheckCircle, RefreshCw,
  ArrowLeft, Download, FileText, Wand2, Zap, TrendingDown,
  Star, Eye, ChevronRight, Lock
} from "lucide-react";
import UpgradeGate from "@/components/marketing/UpgradeGate";
import ATIPaymentGate from "@/components/ati/ATIPaymentGate";
import { useBehavior, useAutoTrack } from "@/lib/useBehavior";
import { TOKEN_COSTS } from "@/lib/pricing";
import OwnershipTrace from "@/components/ownership/OwnershipTrace";
import VerifiedTitleStamp from "@/components/ownership/VerifiedTitleStamp";
import CardIdentityBlock from "@/components/cards/CardIdentityBlock";
import AffiliateLinksPanel from "@/components/cards/AffiliateLinksPanel";
import EventTimeline from "@/components/cards/EventTimeline";
import CardImageGallery from "@/components/cards/CardImageGallery";
import CardInlineEditor from "@/components/cards/CardInlineEditor";
import ReviewsPanel from "@/components/cards/ReviewsPanel";
import ATIWizard from "@/components/ati-wizard/ATIWizard";
import ATIScoreBreakdown from "@/components/ati/ATIScoreBreakdown";
import { ensureCardForListing } from "@/lib/atiCard";
import { logDecision } from "@/lib/logDecision";
import { exportATIPassportPDF } from "@/components/ati/ATIPassportPDF";
import ATIGuideChat from "@/components/ati/ATIGuideChat";

// ─── Helpers ────────────────────────────────────────────────────
function parseList(str) {
  if (!str) return [];
  return str.split("\n").filter(Boolean);
}

function scoreColor(score) {
  if (score >= 108) return "#0F7A56";
  if (score >= 90) return "#185FA5";
  if (score >= 72) return "#D4A017";
  if (score >= 54) return "#A67C00";
  if (score >= 36) return "#CD7F32";
  return "#C0392B";
}

function scoreBg(score) {
  if (score >= 108) return "rgba(15,122,86,0.08)";
  if (score >= 90) return "rgba(24,95,165,0.08)";
  if (score >= 72) return "rgba(212,160,23,0.08)";
  if (score >= 54) return "rgba(166,124,0,0.08)";
  if (score >= 36) return "rgba(205,127,50,0.08)";
  return "rgba(192,57,43,0.08)";
}

// ─── Score Ring ─────────────────────────────────────────────────
function ScoreRing({ score, maxScore = 120, label: scoreLabel }) {
  if (score == null) return null;
  const pct = score / maxScore;
  const r = 60;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const color = scoreColor(score);
  const label = scoreLabel || (score >= 108 ? "Exceptional" : score >= 90 ? "Strong Buy" : score >= 72 ? "Fair" : score >= 54 ? "Caution" : score >= 36 ? "Red Flags" : "Avoid");
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 136 136" className="w-full h-full -rotate-90">
          <circle cx="68" cy="68" r={r} fill="none" stroke="#F0EDE6" strokeWidth="9" />
          <circle cx="68" cy="68" r={r} fill="none" stroke={color} strokeWidth="9"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-[#1A1814] leading-none">{score}</span>
          <span className="text-[9px] uppercase tracking-[0.18em] text-[#AAA49C] font-bold mt-0.5">/ 120</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-black uppercase tracking-wider px-3 py-1 rounded-full border" style={{ color, backgroundColor: scoreBg(score), borderColor: `${color}40` }}>{label}</span>
        <span className="text-[10px] text-[#AAA49C]">Aircraft Transparency Index</span>
      </div>
    </div>
  );
}

// ─── Dimension Bar ───────────────────────────────────────────────
function DimBar({ label, value, max = 15, desc }) {
  const pct = ((value ?? 0) / max) * 100;
  const color = pct >= 80 ? "#0F7A56" : pct >= 60 ? "#185FA5" : pct >= 40 ? "#D4A017" : "#C0392B";
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[12px] font-semibold text-[#1A1814] truncate">{label}</span>
          <span className="text-[10px] text-[#C4BEB6] hidden sm:inline shrink-0">{desc}</span>
        </div>
        <span className="text-[12px] font-black shrink-0 ml-2" style={{ color }}>
          {value ?? "—"}<span className="text-[#C4BEB6] font-normal text-[10px]">/{max}</span>
        </span>
      </div>
      <div className="h-2 bg-black/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

const DIMS = [
  { key: "documentation", label: "Documentation & Records", desc: "Logbooks, airframe history" },
  { key: "technical", label: "Maintenance History", desc: "AD compliance, service trail" },
  { key: "transparency", label: "Engine Condition", desc: "SMOH, TBO, compressions" },
  { key: "transaction_ready", label: "Avionics Package", desc: "GPS/WAAS, ADS-B, autopilot" },
  { key: "usage_mission", label: "Operational History", desc: "Private vs training vs charter" },
  { key: "storage_exposure", label: "Storage & Climate", desc: "Hangared, dry vs outdoor" },
  { key: "config_clarity", label: "Configuration Clarity", desc: "Specs, STCs, modifications" },
  { key: "market_readiness", label: "Transaction Readiness", desc: "Annual freshness, completeness" },
];

// ─── Main Page ──────────────────────────────────────────────────
export default function ATIPassport() {
  const { listingId } = useParams();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [showGate, setShowGate] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [paymentGateOpen, setPaymentGateOpen] = useState(false);

  useAutoTrack("ati_passport");
  const { behavior, tokens, tier, isVerified, track } = useBehavior();

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

  const { data: ownershipEvents = [] } = useQuery({
    queryKey: ["ownership-trace", listingId],
    queryFn: () => base44.entities.OwnershipTrace.filter({ listing: listingId }, "-event_date", 50),
    enabled: !!listingId,
  });

  const { data: card } = useQuery({
    queryKey: ["ati-card", listingId],
    queryFn: async () => {
      const cards = await base44.entities.ATICard.filter({ listing: listingId }, "-created_date", 1);
      return cards[0] || null;
    },
    enabled: !!listingId,
  });

  const verifiedOwnershipCount = ownershipEvents.filter(e => e.verification_status === "verified").length;
  const isLoading = loadingListing || loadingPassport;

  const handleGenerate = async () => {
    if (!listing) return;
    const cost = TOKEN_COSTS.ati_passport_full;
    if (tier !== "enterprise" && (!isVerified || tokens < cost)) {
      track("limit_hit", { feature: "ati_passport_full" });
      setShowGate(true);
      return;
    }
    track("ati_generate_attempt", { listingId });
    setGenerating(true);
    setError(null);
    try {
      const me = await base44.auth.me();
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the ATI (Aircraft Transparency Index) scoring engine for ABOS — the world's largest aviation buy/sell community.

Score this aircraft listing across 8 dimensions, each scored 0–15 points (integer), for a maximum TOTAL of 120 points.

═══ SCORING RUBRIC (each out of 15) ═══

1. documentation (0–15): Logbook completeness, airframe/engine records, damage history disclosure.
   AUTO PENALTY: –5 if damage history absent on aircraft >15 years old. Cap at 8 if logbooks missing.

2. technical (0–15): AD compliance, maintenance traceability, known squawks, Form 337 STCs documented.

3. transparency (0–15): Engine SMOH vs TBO, compression data, oil consumption info.
   NEVER fabricate SMOH — if absent flag as DATA_MISSING and score ≤ 8.

4. transaction_ready (0–15): Avionics quality — ADS-B Out compliant (+3), WAAS GPS (+3), autopilot (+3), glass panel (+3), WX/terrain (+3).
   ALWAYS flag non-ADS-B as regulatory risk.

5. usage_mission (0–15): Usage risk — private use scores higher than flight school or charter training.

6. storage_exposure (0–15): Hangared & dry climate scores higher than outdoor or coastal exposure.

7. config_clarity (0–15): Spec consistency, STC documentation, no ambiguous mods, clear configuration.

8. market_readiness (0–15): Annual freshness (recent = higher), photo quality, listing completeness, pre-buy inspection offered.
   Seller refusing pre-buy inspection → cap at 5.

═══ HARD RULES ═══
- NEVER score total 110+ without documented annual, SMOH, and clean damage history
- Be conservative — missing data must lower that dimension's score
- deal_radar_eligible = true ONLY if ati_total >= 93 AND asking price is ≥ 8% below market
- co_ownership_viable = true if asking_price >= 150000

═══ SCORE LABELS (total/120) ═══
108–120 → EXCEPTIONAL | 90–107 → STRONG BUY | 72–89 → FAIR | 54–71 → CAUTION | 36–53 → RED FLAGS | 0–35 → AVOID

Aircraft data:
${JSON.stringify(listing, null, 2)}

Return ONLY raw JSON:
{
  "documentation": 0-15, "technical": 0-15, "transparency": 0-15,
  "transaction_ready": 0-15, "usage_mission": 0-15, "storage_exposure": 0-15,
  "config_clarity": 0-15, "market_readiness": 0-15,
  "score_label": "EXCEPTIONAL|STRONG BUY|FAIR|CAUTION|RED FLAGS|AVOID",
  "ai_summary": "2-3 sentence executive summary",
  "strengths": ["string","string","string"],
  "risks": ["string","string","string"],
  "recommendations": ["string","string","string"],
  "missing_data": ["any critical missing fields"],
  "deal_radar_eligible": true|false,
  "co_ownership_viable": true|false
}`,
        response_json_schema: {
          type: "object",
          properties: {
            documentation: { type: "number" }, technical: { type: "number" },
            transparency: { type: "number" }, transaction_ready: { type: "number" },
            usage_mission: { type: "number" }, storage_exposure: { type: "number" },
            config_clarity: { type: "number" }, market_readiness: { type: "number" },
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

      let omvm_value = 55000;
      try {
        const omvmRes = await base44.functions.invoke("omvmV5Score", { listingId });
        if (Number.isFinite(omvmRes?.data?.omvm_value) && omvmRes.data.omvm_value > 0) {
          omvm_value = omvmRes.data.omvm_value;
        }
      } catch (omvmErr) {
        console.warn("omvmV5Score failed:", omvmErr?.message);
      }

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
        triggered_by: me?.id,
        ati_total,
        documentation: result.documentation, technical: result.technical,
        transparency: result.transparency, transaction_ready: result.transaction_ready,
        usage_mission: result.usage_mission, storage_exposure: result.storage_exposure,
        config_clarity: result.config_clarity, market_readiness: result.market_readiness,
        score_label: result.score_label || null,
        ai_summary: result.ai_summary,
        strengths: (result.strengths || []).join("\n"),
        risks: (result.risks || []).join("\n"),
        recommendations: (result.recommendations || []).join("\n"),
        missing_data: (result.missing_data || []).join("\n"),
        deal_radar_eligible: result.deal_radar_eligible || false,
        co_ownership_viable: result.co_ownership_viable || false,
        omvm_value, deal_score, deal_label, discount_pct: discountPct,
        ati_version: "v2",
      });

      await base44.entities.AircraftListing.update(listingId, {
        ati_score: ati_total, omvm_value, deal_score, deal_label, discount_pct: discountPct,
      });

      const subjectLabel = `${listing.registration || "—"} · ${listing.year || ""} ${listing.make || ""} ${listing.model || ""}`.trim();
      logDecision({
        type: "ati_score",
        subject: { type: "listing", id: listingId, label: subjectLabel },
        inputs: { year: listing.year, make: listing.make, model: listing.model, total_time: listing.total_time, engine_hours: listing.engine_hours, tbo: listing.tbo, fresh_annual: listing.fresh_annual, avionics: listing.avionics, asking_price: listing.asking_price },
        outputs: { ati_total, score_label: result.score_label, dimensions: { documentation: result.documentation, technical: result.technical, transparency: result.transparency, transaction_ready: result.transaction_ready, usage_mission: result.usage_mission, storage_exposure: result.storage_exposure, config_clarity: result.config_clarity, market_readiness: result.market_readiness }, omvm_value, discount_pct: discountPct, deal_score, deal_label },
        version: "ati_v2", source: "pages/ATIPassport:handleGenerate", actor: me?.email || "system", reasoning: result.ai_summary,
      });

      if (result.deal_radar_eligible) {
        logDecision({
          type: "deal_radar_eligible",
          subject: { type: "listing", id: listingId, label: subjectLabel },
          inputs: { ati_total, discount_pct: discountPct, asking_price: listing.asking_price, omvm_value },
          outputs: { eligible: true, co_ownership_viable: result.co_ownership_viable },
          version: "deal_radar_v1", source: "pages/ATIPassport:handleGenerate", actor: me?.email || "system",
          reasoning: `ATI ${ati_total} ≥ 93 AND discount ${discountPct}% ≥ 8% → qualifies for Deal Radar`,
        });
      }

      try {
        await ensureCardForListing({ ...listing, id: listingId }, { issuerEmail: me?.email });
        queryClient.invalidateQueries({ queryKey: ["ati-card", listingId] });
        queryClient.invalidateQueries({ queryKey: ["ati-cards"] });
      } catch (cardErr) {
        console.warn("Card registry update failed:", cardErr);
      }

      if (tier !== "enterprise" && behavior?.id) {
        const newBalance = Math.max(0, tokens - cost);
        await base44.entities.UserBehavior.update(behavior.id, { tokens_remaining: newBalance });
        await base44.entities.TokenTransaction.create({
          user_email: behavior.user_email, type: "consumption", amount: -cost,
          feature: "ati_passport_full", balance_after: newBalance,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["passport", listingId] });
      queryClient.invalidateQueries({ queryKey: ["listing", listingId] });
      queryClient.invalidateQueries({ queryKey: ["user-behavior"] });
    } catch (e) {
      const msg = e.message || "";
      setError(msg.includes("credit") || msg.includes("Integration")
        ? "Scoring engine temporarily unavailable. Your listing data is saved — you can generate the report when the service resumes."
        : (msg || "Scoring unavailable at the moment. Please try again shortly."));
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!listing || !passport) return;
    setExporting(true);
    try {
      await exportATIPassportPDF({ listing, passport, card });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* ── Page Header ─────────────────────────── */}
      <div className="bg-[#0B2D5B] border-b border-white/5">
        <div className="px-4 md:px-8 py-5 max-w-5xl">
          <Link to="/listings" className="inline-flex items-center gap-1.5 text-[11px] text-white/40 hover:text-[#E8A83A] mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Listings
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[#E8A83A] text-[9px] uppercase tracking-[0.2em] font-bold mb-1">ATI Score Card · v2</p>
              {isLoading ? (
                <div className="h-8 w-64 bg-white/10 rounded animate-pulse" />
              ) : (
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {listing?.year} {listing?.make} {listing?.model}
                  {listing?.registration && (
                    <span className="text-white/40 font-mono text-lg ml-3">{listing.registration}</span>
                  )}
                </h1>
              )}
              <p className="text-white/50 text-sm mt-1">
                Independent aircraft valuation & risk assessment for qualified buyers and brokers
              </p>
            </div>

            {passport && (
              <button
                onClick={() => setPaymentGateOpen(true)}
                className="flex items-center gap-2 bg-[#E8A83A] hover:bg-[#f5bb4e] text-[#0B2D5B] font-black text-sm px-5 py-2.5 rounded-xl transition-colors shrink-0"
              >
                <Lock className="w-4 h-4" />
                Unlock Full Report
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 max-w-5xl space-y-5">
        {isLoading ? (
          <div className="space-y-4">
            <div className="bg-white border border-black/[0.07] rounded-2xl h-56 animate-pulse" />
            <div className="bg-white border border-black/[0.07] rounded-2xl h-56 animate-pulse" />
          </div>
        ) : !passport ? (
          /* ── Empty state ── */
          <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
          
            {/* Top banner */}
            <div className="bg-gradient-to-r from-[#0B2D5B] to-[#143C75] px-8 py-8 text-white text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-[#E8A83A]" />
              </div>
              <h2 className="text-2xl font-black mb-2">Get Your Aircraft Intelligence Report</h2>
              <p className="text-white/70 text-sm max-w-md mx-auto leading-relaxed">
                Comprehensive evaluation of aircraft condition, value, and deal potential. Professional-grade transparency for confident buying decisions.
              </p>
            </div>

            <div className="p-8">
              {/* What you get */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: ShieldCheck, title: "Complete Condition Analysis", body: "Documentation quality, maintenance history, engine condition, avionics package, and operational readiness — all assessed professionally." },
                  { icon: TrendingDown, title: "Market Valuation", body: "Verified comparable sales data for your aircraft type. Know the true market value and identify genuine opportunities." },
                  { icon: FileText, title: "Professional PDF Report", body: "Polished, shareable report for banks, partners, and advisors. Includes detailed findings and recommendations." },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="bg-[#F7F4EF] rounded-xl p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-[#0B2D5B] flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-5 h-5 text-[#E8A83A]" />
                    </div>
                    <p className="text-[12px] font-black text-[#1A1814] mb-1">{title}</p>
                    <p className="text-[11px] text-[#6B6560] leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] text-[#C0392B] text-sm rounded-xl px-4 py-3 mb-5">
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setWizardOpen(true)}
                  disabled={generating}
                  className="flex items-center justify-center gap-2 bg-[#0B2D5B] hover:bg-[#143C75] disabled:opacity-50 text-white font-black px-7 py-3.5 rounded-xl transition-colors"
                >
                  <Wand2 className="w-5 h-5" />
                  Detailed Assessment
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center justify-center gap-2 bg-[#E8A83A] hover:bg-[#f5bb4e] disabled:opacity-50 text-[#0B2D5B] font-black px-7 py-3.5 rounded-xl transition-colors"
                >
                  <Zap className={`w-5 h-5 ${generating ? "animate-pulse" : ""}`} />
                  {generating ? "Generating report…" : "Generate Report"}
                </button>
              </div>
              <p className="text-[10px] text-[#AAA49C] text-center mt-3">
                Detailed = comprehensive step-by-step assessment · Quick = instant analysis from listing information
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Payment gate before full report */}
            {paymentGateOpen && (
              <ATIPaymentGate
                listing={listing}
                onClose={() => setPaymentGateOpen(false)}
                onUnlock={handleGenerate}
              />
            )}

            {/* ── Card Identity ── */}
            {card && <CardIdentityBlock card={card} />}
            {card && <CardInlineEditor card={card} />}
            {card && <CardImageGallery card={card} />}

            {/* ── Score Hero ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Score ring + badges */}
              <div className="bg-white border border-black/[0.07] rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
                <ScoreRing score={passport.ati_total} maxScore={120} label={passport.score_label} />

                <div className="text-center">
                  <p className="text-[11px] text-[#AAA49C]">{listing?.year} {listing?.make} {listing?.model}</p>
                  {listing?.registration && <p className="text-[10px] text-[#AAA49C] font-mono">{listing.registration}</p>}
                </div>

                {/* Alert / opportunity badges */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {passport.deal_radar_eligible && (
                    <span className="text-[9px] uppercase tracking-wider font-black px-3 py-1.5 rounded-full border bg-[rgba(212,160,23,0.12)] text-[#A67C00] border-[rgba(212,160,23,0.3)]">
                      ⚡ Deal Radar — Below Market
                    </span>
                  )}
                  {passport.co_ownership_viable && (
                    <span className="text-[9px] uppercase tracking-wider font-black px-3 py-1.5 rounded-full border bg-[rgba(24,95,165,0.08)] text-[#185FA5] border-[rgba(24,95,165,0.2)]">
                      🤝 Co-Ownership Ready
                    </span>
                  )}
                </div>

                {/* Title chain */}
                <div className="w-full pt-4 border-t border-black/[0.06] flex flex-col items-center gap-1">
                  <VerifiedTitleStamp verifiedCount={verifiedOwnershipCount} totalCount={ownershipEvents.length} size="md" />
                  <p className="text-[10px] text-[#AAA49C] text-center max-w-[160px] leading-tight">
                    {verifiedOwnershipCount > 0
                      ? `${verifiedOwnershipCount} verified ownership document${verifiedOwnershipCount > 1 ? "s" : ""} on file`
                      : "No ownership documents verified yet"}
                  </p>
                </div>
              </div>

              {/* Right: Dimension bars */}
              <div className="bg-white border border-black/[0.07] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#D4A017]">Score Breakdown</p>
                  <span className="text-[9px] text-[#AAA49C] font-semibold uppercase tracking-wider bg-black/5 px-2 py-0.5 rounded-full">8 modules × 15 pts</span>
                </div>
                <div className="space-y-3.5">
                  {DIMS.map(d => (
                    <DimBar key={d.key} label={d.label} value={passport[d.key]} max={d.max} desc={d.desc} />
                  ))}
                </div>
              </div>
            </div>

            {/* ── Valuation Panel ── */}
            <div className="bg-white border border-[rgba(212,160,23,0.3)] rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[rgba(212,160,23,0.06)] to-transparent px-6 py-4 border-b border-[rgba(212,160,23,0.15)]">
                <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#D4A017]">Market Valuation Analysis</p>
                <p className="text-[11px] text-[#6B6560] mt-0.5">Compared against verified market transactions for this make/model/year</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-black/[0.05]">
                {[
                  { label: "Asking Price", value: listing?.asking_price ? `$${listing.asking_price.toLocaleString()}` : "—", sub: "Seller's listed price" },
                  { label: "Market Estimate", value: passport.omvm_value ? `$${passport.omvm_value.toLocaleString()}` : "—", sub: "Based on comparable sales" },
                  {
                    label: "Price vs Market",
                    value: passport.discount_pct != null ? `${passport.discount_pct >= 0 ? "▼ " : "▲ "}${Math.abs(passport.discount_pct)}%` : "—",
                    sub: passport.discount_pct >= 0 ? "Below market — potential upside" : "Above market — negotiate down",
                    color: passport.discount_pct >= 0 ? "#0F7A56" : "#C0392B"
                  },
                  {
                    label: "Deal Rating",
                    value: passport.deal_label ? passport.deal_label.charAt(0).toUpperCase() + passport.deal_label.slice(1) : "—",
                    sub: "Based on price vs condition",
                    color: passport.deal_score >= 8.5 ? "#0F7A56" : passport.deal_score >= 6.5 ? "#185FA5" : passport.deal_score >= 5 ? "#D4A017" : "#C0392B"
                  },
                ].map(item => (
                  <div key={item.label} className="px-5 py-4">
                    <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold mb-1">{item.label}</p>
                    <p className="text-lg font-black leading-none" style={{ color: item.color || "#1A1814" }}>{item.value}</p>
                    {item.sub && <p className="text-[10px] text-[#AAA49C] mt-1 leading-tight">{item.sub}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Score Breakdown (detailed readiness) ── */}
            <ATIScoreBreakdown passport={passport} missing_data={passport.missing_data} />

            {/* ── Executive Summary ── */}
            {passport.ai_summary && (
              <div className="bg-white border border-black/[0.07] rounded-2xl p-6">
                <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#0B2D5B] mb-3">Assessment Overview</p>
                <p className="text-sm text-[#4A4845] leading-relaxed">{passport.ai_summary}</p>
              </div>
            )}

            {/* ── Missing Data Warning ── */}
            {parseList(passport.missing_data).length > 0 && (
              <div className="bg-[rgba(192,57,43,0.04)] border border-[rgba(192,57,43,0.18)] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-[#C0392B]" />
                  <p className="text-[10px] uppercase tracking-wider font-black text-[#C0392B]">Data Gaps — Request Before Making an Offer</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-1.5">
                  {parseList(passport.missing_data).map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12px] text-[#C0392B]">
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Strengths / Risks / Actions ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "What Works in Your Favour", data: parseList(passport.strengths), icon: CheckCircle, color: "#0F7A56", bg: "rgba(15,122,86,0.05)", border: "rgba(15,122,86,0.15)" },
                { title: "Risks to Price or Walk Away", data: parseList(passport.risks), icon: AlertTriangle, color: "#C0392B", bg: "rgba(192,57,43,0.05)", border: "rgba(192,57,43,0.15)" },
                { title: "Buyer Action Items", data: parseList(passport.recommendations), icon: ShieldCheck, color: "#D4A017", bg: "rgba(212,160,23,0.05)", border: "rgba(212,160,23,0.2)" },
              ].map(section => (
                <div key={section.title} className="rounded-2xl p-5 border" style={{ backgroundColor: section.bg, borderColor: section.border }}>
                  <div className="flex items-center gap-2 mb-3">
                    <section.icon className="w-4 h-4" style={{ color: section.color }} />
                    <p className="text-[10px] uppercase tracking-wider font-black" style={{ color: section.color }}>{section.title}</p>
                  </div>
                  {section.data.length === 0 ? (
                    <p className="text-[11px] text-[#AAA49C]">—</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {section.data.map((item, i) => (
                        <li key={i} className="flex gap-2 text-[12px] text-[#4A4845] leading-relaxed">
                          <span className="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: section.color }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* ── Re-score actions ── */}
            <div className="flex items-center justify-between flex-wrap gap-3 py-2">
              <p className="text-[11px] text-[#AAA49C]">
                Scored on {passport.created_date ? new Date(passport.created_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"} · ATI v2
              </p>
              <div className="flex gap-4 items-center flex-wrap">
                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="flex items-center gap-2 bg-[#0B2D5B] hover:bg-[#143C75] disabled:opacity-50 text-white font-black text-[12px] px-4 py-2 rounded-xl transition-colors"
                >
                  <Download className={`w-3.5 h-3.5 ${exporting ? "animate-pulse" : ""}`} />
                  {exporting ? "Exporting…" : "Export PDF"}
                </button>
                <button onClick={() => setWizardOpen(true)} disabled={generating}
                  className="flex items-center gap-2 text-[11px] text-[#6B6560] hover:text-[#0B2D5B] disabled:opacity-40 transition-colors font-semibold">
                  <Wand2 className="w-3.5 h-3.5" />
                  Re-score with Guided Assessment
                </button>
                <button onClick={handleGenerate} disabled={generating}
                  className="flex items-center gap-2 text-[11px] text-[#6B6560] hover:text-[#D4A017] disabled:opacity-40 transition-colors font-semibold">
                  <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
                  {generating ? "Updating…" : "Quick Refresh"}
                </button>
              </div>
            </div>

            {/* ── Reviews / Affiliate / Timeline / Ownership ── */}
            {card && <ReviewsPanel card={card} />}
            {card && <AffiliateLinksPanel card={card} />}
            {card && <EventTimeline card={card} />}
            <OwnershipTrace listingId={listingId} />
          </>
        )}
      </div>

      <UpgradeGate
        open={showGate}
        onClose={() => setShowGate(false)}
        feature="ati_passport_full"
        requiredTokens={TOKEN_COSTS.ati_passport_full}
        userTokens={tokens}
        isVerified={isVerified}
      />

      <ATIWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        listing={listing}
      />

      {listing && <ATIGuideChat listing={listing} />}
    </div>
  );
}