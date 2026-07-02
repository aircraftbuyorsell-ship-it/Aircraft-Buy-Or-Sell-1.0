import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck, AlertTriangle, CheckCircle, RefreshCw,
  ArrowLeft, Download, FileText, Wand2, Zap, TrendingDown,
  Star, Eye, ChevronRight, Lock, BadgeCheck
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
import ATITrustBlock from "@/components/ati/ATITrustBlock";
import { ensureCardForListing } from "@/lib/atiCard";
import { logDecision } from "@/lib/logDecision";
import { exportATIPassportPDF } from "@/components/ati/ATIPassportPDF";
import ATIGuideChat from "@/components/ati/ATIGuideChat";
import { cleanAircraftMake } from "@/lib/cleanAircraftMake";

// ─── Helpers ────────────────────────────────────────────────────
function parseList(str) {
  if (!str) return [];
  return str.split("\n").filter(Boolean);
}

function scoreColor(score) {
  if (score >= 108) return "#5dcaa5";
  if (score >= 90) return "#4e8ef7";
  if (score >= 72) return "#f5c242";
  if (score >= 54) return "#f5c242";
  if (score >= 36) return "#f5c242";
  return "#e24b4a";
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
          <circle cx="68" cy="68" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
          <circle cx="68" cy="68" r={r} fill="none" stroke={color} strokeWidth="9"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-[rgba(255,255,255,0.90)] leading-none">{score}</span>
          <span className="text-[9px] uppercase tracking-[0.18em] text-[rgba(255,255,255,0.35)] font-bold mt-0.5">/ 120</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-black uppercase tracking-wider px-3 py-1 rounded-full border" style={{ color, backgroundColor: scoreBg(score), borderColor: `${color}40` }}>{label}</span>
        <span className="text-[10px] text-[rgba(255,255,255,0.35)]">Aircraft Transparency Index</span>
      </div>
    </div>
  );
}

// ─── Dimension Bar ───────────────────────────────────────────────
function DimBar({ label, value, max = 15, desc }) {
  const pct = ((value ?? 0) / max) * 100;
  const color = pct >= 80 ? "#5dcaa5" : pct >= 60 ? "#4e8ef7" : pct >= 40 ? "#f5c242" : "#e24b4a";
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[12px] font-semibold text-[rgba(255,255,255,0.90)] truncate">{label}</span>
          <span className="text-[10px] text-[rgba(255,255,255,0.30)] hidden sm:inline shrink-0">{desc}</span>
        </div>
        <span className="text-[12px] font-black shrink-0 ml-2" style={{ color }}>
          {value ?? "—"}<span className="text-[rgba(255,255,255,0.30)] font-normal text-[10px]">/{max}</span>
        </span>
      </div>
      <div className="h-2 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
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

      let omvm_value = null;
      let discountPct = null;
      let deal_score = null;
      let deal_label = null;
      try {
        const valRes = await base44.functions.invoke("marketExpertValuation", { listingId });
        if (Number.isFinite(valRes?.data?.market_estimate) && valRes.data.market_estimate > 0) {
          omvm_value = valRes.data.market_estimate;
          discountPct = valRes.data.discount_pct;
          deal_score = valRes.data.deal_score;
          deal_label = valRes.data.deal_label;
        }
      } catch (valErr) {
        console.warn("marketExpertValuation failed:", valErr?.message);
      }

      if (discountPct == null && listing.asking_price && omvm_value) {
        discountPct = Math.round(((omvm_value - listing.asking_price) / omvm_value) * 1000) / 10;
      }
      if (deal_score == null) {
        deal_score = discountPct == null ? null
          : discountPct > 25 ? 9.5 : discountPct > 15 ? 8.5 : discountPct > 8 ? 7.5
          : discountPct > 2 ? 6.5 : discountPct < -15 ? 2.5 : discountPct < -5 ? 4.0 : 5.0;
      }
      if (deal_label == null) {
        deal_label = deal_score == null ? null
          : deal_score >= 8.5 ? "hot deal" : deal_score >= 6.5 ? "good deal"
          : deal_score >= 5 ? "fair" : "overpriced";
      }

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

  const safeMake = listing ? cleanAircraftMake(listing.make) : "";

  return (
    <div className="min-h-screen" style={{ background: "transparent" }}>

      {/* ── Sticky nav bar ──────────────────────────── */}
      <div className="bg-[rgba(255,255,255,0.04)] border-b border-[rgba(255,255,255,0.08)] sticky top-0 z-10">
        <div className="px-4 md:px-8 py-3 max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/listings" className="inline-flex items-center gap-1.5 text-[12px] text-[rgba(255,255,255,0.60)] hover:text-[#4e8ef7] transition-colors font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            Listings
          </Link>
          {passport && (
            <div className="flex items-center gap-2 md:gap-3">
              <button onClick={handleGenerate} disabled={generating}
                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#f5c242] hover:text-[#f5c242] transition-colors disabled:opacity-40 bg-[rgba(212,160,23,0.1)] border border-[rgba(212,160,23,0.2)] px-3 py-1.5 rounded-lg">
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
                {generating ? "Updating…" : "Refresh"}
              </button>
              <button onClick={() => setWizardOpen(true)} disabled={generating}
                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#4e8ef7] hover:text-[#4e8ef7] transition-colors disabled:opacity-40 bg-[rgba(11,45,91,0.06)] border border-[rgba(11,45,91,0.12)] px-3 py-1.5 rounded-lg">
                <Wand2 className="w-3.5 h-3.5" />
                Re-score
              </button>
              <button onClick={handleExportPDF} disabled={exporting}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[rgba(255,255,255,0.60)] hover:text-[#4e8ef7] transition-colors disabled:opacity-40">
                <Download className={`w-3.5 h-3.5 ${exporting ? "animate-pulse" : ""}`} />
                {exporting ? "Exporting…" : "PDF"}
              </button>
              <button onClick={() => setPaymentGateOpen(true)}
                className="inline-flex items-center gap-1.5 text-[12px] font-black text-[#4e8ef7] bg-[#f5c242] hover:bg-[#f5bb4e] px-3 py-1.5 rounded-lg transition-colors">
                <Lock className="w-3 h-3" />
                Unlock Full
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto space-y-5">

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-48 bg-[rgba(255,255,255,0.04)] rounded-2xl border border-[rgba(255,255,255,0.08)] animate-pulse" />
            <div className="h-64 bg-[rgba(255,255,255,0.04)] rounded-2xl border border-[rgba(255,255,255,0.08)] animate-pulse" />
          </div>

        ) : !passport ? (
          /* ── Empty / Generate state ─────────────────── */
          <div className="bg-[rgba(255,255,255,0.04)] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden shadow-sm">
            <div className="bg-[#4e8ef7] px-8 py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-7 h-7 text-[#f5c242]" />
              </div>
              <p className="text-[#f5c242] text-[9px] uppercase tracking-[0.25em] font-black mb-2">ATI Score Card · ABOS</p>
              <h2 className="text-white text-xl font-black mb-2">
                {listing?.year} {safeMake} {listing?.model}
              </h2>
              {listing?.registration && <p className="text-white/40 font-mono text-sm mb-4">{listing.registration}</p>}
              <p className="text-white/60 text-sm max-w-sm mx-auto leading-relaxed">
                Generate a comprehensive ATI report — 8 dimensions of aircraft condition, market value, and deal quality.
              </p>
            </div>
            <div className="p-8">
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: ShieldCheck, title: "8-Dimension Analysis", body: "Documentation, engine condition, avionics, history, storage and transaction readiness." },
                  { icon: TrendingDown, title: "Expert Valuation", body: "Professional market appraisal based on live comparables, market conditions, and aircraft condition." },
                  { icon: FileText, title: "Exportable Report", body: "Professional PDF for banks, co-investors and advisors." },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="bg-[rgba(255,255,255,0.03)] rounded-xl p-4">
                    <div className="w-8 h-8 rounded-lg bg-[#4e8ef7] flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4 text-[#f5c242]" />
                    </div>
                    <p className="text-[12px] font-black text-[rgba(255,255,255,0.90)] mb-1">{title}</p>
                    <p className="text-[11px] text-[rgba(255,255,255,0.60)] leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>

              {/* Trust Block — pre-generation placeholder */}
              <div className="mb-8">
                <ATITrustBlock passport={null} card={card} ownershipEvents={ownershipEvents} listing={listing} />
              </div>
              {error && (
                <div className="bg-[rgba(192,57,43,0.07)] border border-[rgba(192,57,43,0.2)] text-[#e24b4a] text-sm rounded-xl px-4 py-3 mb-5">
                  {error}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => setWizardOpen(true)} disabled={generating}
                  className="flex items-center justify-center gap-2 bg-[#4e8ef7] hover:bg-[#4e8ef7] disabled:opacity-50 text-white font-black px-7 py-3 rounded-xl transition-colors text-sm">
                  <Wand2 className="w-4 h-4" />
                  Guided Assessment
                </button>
                <button onClick={handleGenerate} disabled={generating}
                  className="flex items-center justify-center gap-2 bg-[#f5c242] hover:bg-[#f5bb4e] disabled:opacity-50 text-[#4e8ef7] font-black px-7 py-3 rounded-xl transition-colors text-sm">
                  <Zap className={`w-4 h-4 ${generating ? "animate-pulse" : ""}`} />
                  {generating ? "Generating…" : "Quick Generate"}
                </button>
              </div>
            </div>
          </div>

        ) : (
          <>
            {paymentGateOpen && (
              <ATIPaymentGate listing={listing} onClose={() => setPaymentGateOpen(false)} onUnlock={handleGenerate} />
            )}

            {/* ── Report header — clean document style ── */}
            <div className="bg-[rgba(255,255,255,0.04)] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden shadow-sm">
              <div className="px-6 md:px-10 pt-10 pb-8">
                {/* Aircraft identity */}
                <div className="text-center mb-8">
                  <p className="text-[rgba(255,255,255,0.35)] text-[9px] uppercase tracking-[0.25em] font-black mb-2">Aircraft Transparency Index</p>
                  <h1 className="text-[rgba(255,255,255,0.90)] font-black text-2xl md:text-3xl leading-tight">
                    {listing?.year} {safeMake} {listing?.model}
                  </h1>
                  {listing?.registration && (
                    <p className="text-[rgba(255,255,255,0.60)] font-mono text-[15px] mt-1.5">{listing.registration}</p>
                  )}
                  {listing?.asking_price && (
                    <p className="text-[rgba(255,255,255,0.70)] text-[13px] mt-1 font-semibold">Asking ${listing.asking_price.toLocaleString()}</p>
                  )}
                </div>

                {/* ATI SCORE — prominent centered */}
                <div className="text-center border-y border-[rgba(255,255,255,0.08)] py-6 mb-6">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.35)] font-bold mb-2">ATI Score</p>
                  <div className="flex items-baseline justify-center gap-3">
                    <span className="text-5xl md:text-6xl font-black" style={{ color: scoreColor(passport.ati_total) }}>{passport.ati_total}</span>
                    <span className="text-[rgba(255,255,255,0.30)] text-xl font-light">/ 120</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-[13px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full border"
                      style={{ color: scoreColor(passport.ati_total), borderColor: `${scoreColor(passport.ati_total)}40`, backgroundColor: `${scoreColor(passport.ati_total)}10` }}>
                      {passport.score_label || (passport.ati_total >= 108 ? "Exceptional" : passport.ati_total >= 90 ? "Strong Buy" : passport.ati_total >= 72 ? "Fair" : passport.ati_total >= 54 ? "Caution" : "Red Flags")}
                    </span>
                  </div>

                  {/* ATI Index — normalized 0–10 */}
                  <div className="mt-4">
                    <span className="text-[rgba(255,255,255,0.60)] text-[12px] font-semibold">
                      ATI Index: <span className="font-black text-[rgba(255,255,255,0.90)]">{(passport.ati_total / 12).toFixed(1)} / 10</span>
                    </span>
                    <span className="text-[rgba(255,255,255,0.35)] text-[11px] ml-2">(normalized 0–10; not a buy/sell recommendation)</span>
                  </div>
                </div>

                {/* Dimension score bars */}
                <div className="mb-4">
                  <p className="text-[9px] uppercase tracking-[0.15em] text-[rgba(255,255,255,0.35)] font-bold mb-4 text-center">ATI Dimension Scores</p>
                  <div className="space-y-3 max-w-2xl mx-auto">
                    {DIMS.map(d => (
                      <DimBar key={d.key} label={d.label} value={passport[d.key]} desc={d.desc} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Badges row */}
              {(passport.deal_radar_eligible || passport.co_ownership_viable) && (
                <div className="px-6 md:px-10 py-3 border-t border-[rgba(255,255,255,0.08)] flex flex-wrap gap-2 justify-center">
                  {passport.deal_radar_eligible && (
                    <span className="text-[9px] uppercase tracking-wider font-black px-3 py-1.5 rounded-full bg-[rgba(212,160,23,0.10)] text-[#f5c242] border border-[rgba(212,160,23,0.25)]">
                      ⚡ Deal Radar — Below Market
                    </span>
                  )}
                  {passport.co_ownership_viable && (
                    <span className="text-[9px] uppercase tracking-wider font-black px-3 py-1.5 rounded-full bg-[rgba(24,95,165,0.08)] text-[#4e8ef7] border border-[rgba(24,95,165,0.2)]">
                      🤝 Co-Ownership Viable
                    </span>
                  )}
                </div>
              )}

              {/* Ownership stamp */}
              <div className="px-6 md:px-10 py-3 flex items-center justify-center gap-4 flex-wrap border-t border-[rgba(255,255,255,0.08)]">
                {card?.owner_verified ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ borderColor: "rgba(212,160,23,0.3)", background: "rgba(212,160,23,0.06)" }}>
                    <BadgeCheck className="w-4 h-4 text-[#f5c242]" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#f5c242]">
                      Verified by Owner
                    </span>
                    {card.owner_verified_at && (
                      <span className="text-[9px] text-[#f5c242]/60 ml-1">
                        {new Date(card.owner_verified_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                ) : (
                  <>
                    <VerifiedTitleStamp verifiedCount={verifiedOwnershipCount} totalCount={ownershipEvents.length} size="sm" />
                    <span className="text-[10px] text-[rgba(255,255,255,0.35)]">
                      {verifiedOwnershipCount > 0
                        ? `${verifiedOwnershipCount} verified ownership record${verifiedOwnershipCount > 1 ? "s" : ""}`
                        : "No ownership records verified"}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* ── Trust Block ───────────────────────────── */}
            <ATITrustBlock passport={passport} card={card} ownershipEvents={ownershipEvents} listing={listing} />

            {/* ── Specs + Valuation ─────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ── Specifications — grouped into logical blocks ── */}
              <div className="bg-[rgba(255,255,255,0.04)] rounded-2xl border border-[rgba(255,255,255,0.08)] px-6 py-5 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.18em] font-black text-[#4e8ef7] mb-5">Aircraft Specs</p>

                {/* Airframe block */}
                <div className="mb-4">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-[rgba(255,255,255,0.35)] font-bold mb-2">Airframe</p>
                  <div className="space-y-1.5">
                    {[
                      { l: "Total Time", v: listing?.total_time ? `${listing.total_time.toLocaleString()} hrs` : "—" },
                      { l: "Year", v: listing?.year || "—" },
                      { l: "Registration", v: listing?.registration || "—" },
                    ].map(r => (
                      <div key={r.l} className="flex justify-between items-baseline">
                        <span className="text-[12px] font-semibold text-[rgba(255,255,255,0.70)]">{r.l}</span>
                        <span className="text-[13px] font-bold text-[rgba(255,255,255,0.90)] text-right">{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Engine block */}
                <div className="mb-4 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-[rgba(255,255,255,0.35)] font-bold mb-2">Engine</p>
                  <div className="space-y-1.5">
                    {[
                      { l: "Engine SMOH", v: listing?.engine_hours ? `${listing.engine_hours.toLocaleString()} hrs` : "—" },
                      { l: "TBO", v: listing?.tbo ? `${listing.tbo.toLocaleString()} hrs` : "—" },
                      { l: "Remaining", v: listing?.tbo && listing?.engine_hours != null ? `${Math.round(((listing.tbo - listing.engine_hours) / listing.tbo) * 100)}%` : "—" },
                    ].map(r => (
                      <div key={r.l} className="flex justify-between items-baseline">
                        <span className="text-[12px] font-semibold text-[rgba(255,255,255,0.70)]">{r.l}</span>
                        <span className="text-[13px] font-bold text-[rgba(255,255,255,0.90)] text-right">{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Maintenance & Avionics block */}
                <div className="pt-2 border-t border-[rgba(255,255,255,0.08)]">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-[rgba(255,255,255,0.35)] font-bold mb-2">Maintenance & Avionics</p>
                  <div className="space-y-1.5">
                    {[
                      { l: "Last Annual", v: listing?.last_annual ? listing.last_annual : "—" },
                      { l: "Avionics", v: listing?.avionics || "—" },
                    ].map(r => (
                      <div key={r.l} className="flex justify-between items-baseline">
                        <span className="text-[12px] font-semibold text-[rgba(255,255,255,0.70)]">{r.l}</span>
                        <span className="text-[13px] font-bold text-[rgba(255,255,255,0.90)] text-right max-w-[55%] leading-tight">{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Valuation — clean hierarchy ── */}
              <div className="bg-[rgba(255,255,255,0.04)] rounded-2xl border border-[rgba(255,255,255,0.08)] px-6 py-5 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] font-black text-[#4e8ef7] mb-5">Expert Valuation</p>

                  {/* Asking Price — prominent */}
                  <div className="mb-4">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[rgba(255,255,255,0.35)] font-bold mb-1">Asking Price</p>
                    <p className="text-2xl font-black text-[rgba(255,255,255,0.90)]">
                      {listing?.asking_price ? `$${listing.asking_price.toLocaleString()}` : "On request"}
                    </p>
                  </div>

                  {/* Expert Estimate — highlighted box */}
                  <div className="bg-[rgba(255,255,255,0.03)] border border-[#4e8ef7]/10 rounded-xl px-4 py-3 mb-4">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[rgba(255,255,255,0.70)] font-bold mb-1">Expert Estimate</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-black text-[#4e8ef7]">
                        {passport.omvm_value ? `$${passport.omvm_value.toLocaleString()}` : "—"}
                      </p>
                      {(() => {
                        const d = Number(passport.discount_pct);
                        if (!Number.isFinite(d)) return null;
                        const pct = Math.round(Math.abs(d));
                        const isBelow = d >= 0;
                        return (
                          <span className={`text-[12px] font-black px-2 py-0.5 rounded-full border ${isBelow ? "text-[#5dcaa5] border-[#5dcaa5]/20 bg-[#5dcaa5]/5" : "text-[#e24b4a] border-[#e24b4a]/20 bg-[#e24b4a]/5"}`}>
                            {isBelow ? "▼" : "▲"} {pct}%
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Market Benchmark Bar */}
                  {passport.live_market_avg != null && (
                    <div className="mb-4 bg-[rgba(212,160,23,0.04)] border border-[rgba(212,160,23,0.15)] rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-[rgba(255,255,255,0.70)] font-bold">Market Benchmark</p>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            color: passport.market_data_source === 'live' ? '#5dcaa5' : '#f5c242',
                            background: passport.market_data_source === 'live' ? 'rgba(15,122,86,0.08)' : 'rgba(212,160,23,0.08)',
                          }}>
                          {passport.market_data_source === 'live' ? '● Live' : '● Cached'}
                        </span>
                      </div>
                      {(() => {
                        const min = passport.live_min_price || 0;
                        const max = passport.live_max_price || 0;
                        const avg = passport.live_market_avg || 0;
                        const asking = listing?.asking_price || 0;
                        const range = max - min || 1;
                        const pos = Math.max(0, Math.min(100, ((asking - min) / range) * 100));
                        const isBelow = asking < avg * 0.95;
                        const isAt = asking >= avg * 0.95 && asking <= avg * 1.05;
                        const dotColor = isBelow ? '#5dcaa5' : isAt ? '#f5c242' : '#e24b4a';
                        return (
                          <div>
                            <div className="relative h-2 bg-[rgba(255,255,255,0.06)] rounded-full mb-2">
                              <div className="absolute inset-0 h-full rounded-full"
                                style={{ background: 'linear-gradient(90deg, rgba(15,122,86,0.2), rgba(212,160,23,0.2), rgba(192,57,43,0.2))' }} />
                              <div className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md"
                                style={{ left: `calc(${pos}% - 6px)`, top: '-2px', background: dotColor }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-[rgba(255,255,255,0.60)] font-semibold">
                              <span>${(min / 1000).toFixed(0)}K</span>
                              <span style={{ color: '#4A4550' }}>Avg ${avg ? avg.toLocaleString() : '—'}</span>
                              <span>${(max / 1000).toFixed(0)}K</span>
                            </div>
                            <p className="text-[10px] text-[rgba(255,255,255,0.35)] mt-1.5 text-center">
                              {passport.live_listings_count || 0} market listings · Asking price is{' '}
                              <span style={{ color: dotColor, fontWeight: 700 }}>
                                {isBelow ? 'below market' : isAt ? 'at market' : 'above market'}
                              </span>
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Deal Quality row */}
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-[rgba(255,255,255,0.35)] font-bold mb-1">Deal Rating</p>
                      <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase" style={{
                        color: passport.deal_score >= 8.5 ? "#5dcaa5" : passport.deal_score >= 6.5 ? "#4e8ef7" : passport.deal_score >= 5 ? "#f5c242" : "#e24b4a",
                        backgroundColor: passport.deal_score >= 8.5 ? "rgba(15,122,86,0.08)" : passport.deal_score >= 6.5 ? "rgba(24,95,165,0.08)" : passport.deal_score >= 5 ? "rgba(212,160,23,0.08)" : "rgba(192,57,43,0.08)",
                        borderColor: passport.deal_score >= 8.5 ? "rgba(15,122,86,0.2)" : passport.deal_score >= 6.5 ? "rgba(24,95,165,0.18)" : passport.deal_score >= 5 ? "rgba(212,160,23,0.2)" : "rgba(192,57,43,0.18)",
                        borderWidth: 1,
                      }}>
                        {passport.deal_label ? passport.deal_label.charAt(0).toUpperCase() + passport.deal_label.slice(1) : "—"}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-[rgba(255,255,255,0.35)] font-bold mb-1">ATI Score</p>
                      <span className="text-[15px] font-black" style={{ color: scoreColor(passport.ati_total) }}>
                        {passport.ati_total} <span className="text-[10px] font-normal text-[rgba(255,255,255,0.35)]">/ 120</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Executive Summary ─────────────────────── */}
            {passport.ai_summary && (
              <div className="bg-gradient-to-br from-[#F7F4EF] to-white rounded-2xl border border-[rgba(255,255,255,0.08)] px-6 py-5 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.18em] font-black text-[#4e8ef7] mb-3">Executive Summary</p>
                <p className="text-[13px] text-[rgba(255,255,255,0.70)] leading-relaxed font-medium">{passport.ai_summary}</p>
              </div>
            )}

            {/* ── Strengths / Risks / Actions ───────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Key Strengths", data: parseList(passport.strengths), icon: CheckCircle, color: "#5dcaa5", bg: "rgba(15,122,86,0.04)", border: "rgba(15,122,86,0.15)" },
                { title: "Risk Factors", data: parseList(passport.risks), icon: AlertTriangle, color: "#e24b4a", bg: "rgba(192,57,43,0.04)", border: "rgba(192,57,43,0.15)" },
                { title: "Buyer Actions", data: parseList(passport.recommendations), icon: ShieldCheck, color: "#f5c242", bg: "rgba(212,160,23,0.03)", border: "rgba(212,160,23,0.18)" },
              ].map(section => (
                <div key={section.title} className="rounded-2xl border px-6 py-5 shadow-sm" style={{ backgroundColor: section.bg, borderColor: section.border }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${section.color}18` }}>
                      <section.icon className="w-3 h-3" style={{ color: section.color }} />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.15em] font-black" style={{ color: section.color }}>{section.title}</p>
                  </div>
                  {section.data.length === 0 ? (
                    <p className="text-[12px] font-medium text-[rgba(255,255,255,0.35)] italic">None identified</p>
                  ) : (
                    <ul className="space-y-3">
                      {section.data.map((item, i) => (
                        <li key={i} className="flex gap-2.5 text-[12px] text-[rgba(255,255,255,0.70)] leading-relaxed">
                          <span className="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: section.color }} />
                          <span className="font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* ── Missing data ───────────────────────────── */}
            {parseList(passport.missing_data).length > 0 && (
              <div className="bg-[rgba(192,57,43,0.04)] border border-[rgba(192,57,43,0.15)] rounded-2xl px-6 py-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#e24b4a]" />
                  <p className="text-[10px] uppercase tracking-[0.18em] font-black text-[#e24b4a]">Data Gaps — Request Before Offering</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-1.5">
                  {parseList(passport.missing_data).map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12px] text-[#e24b4a]">
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Detailed dimension breakdown ───────────── */}
            <ATIScoreBreakdown passport={passport} missing_data={passport.missing_data} />

            {/* ── Card identity & tools ──────────────────── */}
            {card && <CardIdentityBlock card={card} />}
            {card && <CardInlineEditor card={card} />}

            {/* ── Disclaimers ──────────────────────────────── */}
            <div className="bg-[rgba(255,255,255,0.04)] rounded-2xl border border-[rgba(255,255,255,0.08)] px-6 md:px-10 py-6 text-[11px] leading-relaxed text-[rgba(255,255,255,0.60)] space-y-4">
              <p>
                <strong className="text-[rgba(255,255,255,0.70)]">Important Disclosures.</strong> The Aircraft Transparency Index (ATI) is a proprietary assessment framework designed to evaluate the completeness and quality of aircraft documentation, maintenance records, and market positioning. <strong className="text-[rgba(255,255,255,0.70)]">It is not a pre-purchase inspection, airworthiness certification, or substitute for a physical aircraft examination by a certified A&P mechanic.</strong>
              </p>
              <p>
                <strong className="text-[rgba(255,255,255,0.70)]">No Investment or Purchase Recommendation.</strong> The ATI Score, ATI Index, and related assessments do not constitute investment advice or a recommendation to buy, sell, or hold any aircraft. All purchase decisions should be made with professional guidance from qualified aviation consultants, mechanics, and legal advisors.
              </p>
              <p>
                <strong className="text-[rgba(255,255,255,0.70)]">Data Accuracy.</strong> ATI scoring relies on information provided by sellers, FAA registries, and publicly available sources. ABOS does not independently verify all data points and makes no warranty as to the accuracy, completeness, or timeliness of any information presented in this report.
              </p>
              <p>
                <strong className="text-[rgba(255,255,255,0.70)]">Market Valuation.</strong> Any Expert Estimate or market valuation is based on available comparables and market conditions at the time of scoring. Actual transaction prices may differ materially from any estimate provided.
              </p>
              <p className="text-[rgba(255,255,255,0.35)] text-[10px] pt-2 border-t border-[rgba(255,255,255,0.08)]">
                ABOS MarketSpace · ATI v2 · Scored {passport.created_date ? new Date(passport.created_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"} · © ABOS Standard
              </p>
            </div>

            {/* ── Timeline, Reviews, Ownership ───────────── */}
            {card && <ReviewsPanel card={card} />}
            {card && <AffiliateLinksPanel card={card} />}
            {card && <EventTimeline card={card} />}
            <OwnershipTrace listingId={listingId} />
          </>
        )}
      </div>

      <UpgradeGate open={showGate} onClose={() => setShowGate(false)} feature="ati_passport_full"
        requiredTokens={TOKEN_COSTS.ati_passport_full} userTokens={tokens} isVerified={isVerified} />
      <ATIWizard open={wizardOpen} onClose={() => setWizardOpen(false)} listing={listing} />
      {listing && <ATIGuideChat listing={listing} />}
    </div>
  );
}