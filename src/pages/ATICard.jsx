import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Share2, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import ATIScoreBreakdown from "@/components/ati/ATIScoreBreakdown";
import AircraftPhotoBlock from "@/components/aircraft/AircraftPhotoBlock";

function scoreColor(score) {
  if (score >= 108) return "#0F7A56";
  if (score >= 90) return "#185FA5";
  if (score >= 72) return "#D4A017";
  if (score >= 54) return "#A67C00";
  return "#C0392B";
}

function ScoreRing({ score, maxScore = 120, dark = false }) {
  if (score == null) return null;
  const pct = score / maxScore;
  const r = 60;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const color = scoreColor(score);
  const label = score >= 108 ? "Exceptional" : score >= 90 ? "Strong Buy" : score >= 72 ? "Fair" : score >= 54 ? "Caution" : "Red Flags";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-44 h-44">
        <svg viewBox="0 0 136 136" className="w-full h-full -rotate-90">
          <circle cx="68" cy="68" r={r} fill="none" stroke={dark ? "rgba(255,255,255,0.10)" : "#F0EDE6"} strokeWidth="9" />
          <circle cx="68" cy="68" r={r} fill="none" stroke={color} strokeWidth="9"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}60)` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-black leading-none ${dark ? "text-white" : "text-[#1A1814]"}`}>{score}</span>
          <span className={`text-[9px] uppercase tracking-[0.18em] font-bold mt-1 ${dark ? "text-white/40" : "text-[#AAA49C]"}`}>/ 120 points</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-sm font-black uppercase tracking-wider px-4 py-1.5 rounded-full border" style={{ color: dark ? "#fff" : color, backgroundColor: `${color}${dark ? "30" : "15"}`, borderColor: `${color}${dark ? "60" : "40"}` }}>
          {label}
        </span>
        <span className={`text-[10px] ${dark ? "text-white/35" : "text-[#AAA49C]"}`}>Aircraft Transparency Index</span>
      </div>
    </div>
  );
}

export default function ATICard() {
  const { cardCode } = useParams();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      if (navigator.share) navigator.share({ title: `ATI Card ${cardCode}`, url });
    });
  };

  const { data: card, isLoading: loadingCard } = useQuery({
    queryKey: ["ati-card", cardCode],
    queryFn: () => base44.entities.ATICard.filter({ public_card_code: cardCode }, "-created_date", 1).then(r => r[0]),
    enabled: !!cardCode,
  });

  const { data: passport, isLoading: loadingPassport } = useQuery({
    queryKey: ["passport", card?.listing],
    queryFn: () => base44.entities.ATIPassport.filter({ listing: card?.listing }, "-created_date", 1).then(r => r[0]),
    enabled: !!card?.listing,
  });

  const { data: listing, isLoading: loadingListing } = useQuery({
    queryKey: ["listing", card?.listing],
    queryFn: () => base44.entities.AircraftListing.get(card?.listing),
    enabled: !!card?.listing,
  });

  const isLoading = loadingCard || loadingPassport || loadingListing;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] px-4 md:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-8 w-48 bg-black/5 rounded animate-pulse" />
          <div className="h-96 bg-white border border-black/[0.07] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!card || !passport || !listing) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-black text-[#1A1814] mb-2">Card Not Found</p>
          <p className="text-[#6B6560] text-sm mb-4">This ATI card does not exist or has been removed.</p>
          <Link to="/listings" className="text-[#0B2D5B] font-bold hover:underline text-sm">
            ← Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* Header */}
      <div className="bg-[#0B2D5B] border-b border-white/5">
        <div className="px-4 md:px-8 py-5 max-w-4xl mx-auto">
          <Link to="/listings" className="inline-flex items-center gap-1.5 text-[11px] text-white/40 hover:text-[#E8A83A] mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Listings
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[#E8A83A] text-[9px] uppercase tracking-[0.2em] font-bold mb-1">ATI Score Card</p>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {listing.year} {listing.make} {listing.model}
                {listing.registration && (
                  <span className="text-white/40 font-mono text-lg ml-3">{listing.registration}</span>
                )}
              </h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors border border-white/20"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto space-y-5">
        {/* Aircraft photos — uploaded, external DB lookup, or standard placeholder */}
        <AircraftPhotoBlock
          registration={listing.registration}
          make={listing.make}
          model={listing.model}
          year={listing.year}
          photos={card.image_attachments || []}
        />

        {/* Score hero — premium certificate card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative overflow-hidden rounded-2xl p-6 flex flex-col items-center justify-center"
            style={{
              background: "linear-gradient(155deg, #122F5E 0%, #0B2D5B 45%, #081D3D 100%)",
              border: "1px solid rgba(232,168,58,0.30)",
              boxShadow: "0 20px 50px rgba(11,45,91,0.30), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}>
            {/* Gold top accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: "linear-gradient(90deg, transparent 5%, #E8A83A 50%, transparent 95%)" }} />
            {/* Glass sheen */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(115deg, rgba(255,255,255,0.10) 0%, transparent 40%)" }} />
            {/* Watermark */}
            <p className="absolute top-4 right-5 text-[9px] uppercase tracking-[0.25em] font-black text-[#E8A83A]/70">Certified · ABOS</p>
            <ScoreRing score={passport.ati_total} maxScore={120} dark />
            <div className="text-center mt-5 w-full border-t border-white/10 pt-4">
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/35 font-bold">Card Code</p>
              <p className="text-[13px] font-mono font-bold text-[#E8A83A] mt-1 tracking-wide">{card.public_card_code}</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-white border border-black/[0.07] rounded-2xl p-6 space-y-4 shadow-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-bold mb-2">Aircraft Details</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B6560]">Total Time:</span>
                  <span className="font-bold text-[#1A1814]">{listing.total_time?.toLocaleString() || "—"} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6560]">Engine SMOH:</span>
                  <span className="font-bold text-[#1A1814]">{listing.engine_hours?.toLocaleString() || "—"} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6560]">Asking Price:</span>
                  <span className="font-bold text-[#1A1814]">{listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : "—"}</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-black/[0.06]" />

            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-bold mb-2">Valuation</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B6560]">Market Est:</span>
                  <span className="font-bold text-[#1A1814]">${passport.omvm_value?.toLocaleString() || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6560]">Discount:</span>
                  <span className={`font-bold ${passport.discount_pct >= 0 ? "text-[#0F7A56]" : "text-[#C0392B]"}`}>
                    {passport.discount_pct != null ? `${passport.discount_pct >= 0 ? "▼" : "▲"} ${Math.abs(passport.discount_pct)}%` : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6560]">Deal Rating:</span>
                  <span className="font-bold text-[#1A1814]">{passport.deal_label ? passport.deal_label.charAt(0).toUpperCase() + passport.deal_label.slice(1) : "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed score breakdown */}
        <ATIScoreBreakdown passport={passport} missing_data={passport.missing_data} />

        {/* Summary */}
        {passport.ai_summary && (
          <div className="bg-white border border-black/[0.07] rounded-2xl p-6">
            <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#0B2D5B] mb-3">Summary</p>
            <p className="text-sm text-[#4A4845] leading-relaxed">{passport.ai_summary}</p>
          </div>
        )}

        {/* Card metadata */}
        <div className="bg-[#F7F4EF] border border-black/[0.07] rounded-2xl p-4 text-[10px] text-[#6B6560] flex flex-wrap items-center justify-between gap-2">
          <span>Issued: {card.issued_at ? new Date(card.issued_at).toLocaleDateString("en-GB") : "—"}</span>
          <span>·</span>
          <span>Version: {card.card_version}</span>
          <span>·</span>
          <span>Status: {card.status}</span>
        </div>
      </div>
    </div>
  );
}