import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Copy, CheckCircle2, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import ATIScoreBreakdown from "@/components/ati/ATIScoreBreakdown";
import { cleanAircraftMake } from "@/lib/cleanAircraftMake";

function scoreColor(score) {
  if (score >= 108) return "#0F7A56";
  if (score >= 90) return "#185FA5";
  if (score >= 72) return "#D4A017";
  if (score >= 54) return "#A67C00";
  return "#C0392B";
}

function scoreLabel(score) {
  if (score >= 108) return "Exceptional";
  if (score >= 90) return "Strong Buy";
  if (score >= 72) return "Fair";
  if (score >= 54) return "Caution";
  return "Red Flags";
}

const DIMS = [
  { key: "documentation", label: "Documentation" },
  { key: "technical", label: "Maintenance" },
  { key: "transparency", label: "Engine Condition" },
  { key: "transaction_ready", label: "Avionics" },
  { key: "usage_mission", label: "Usage History" },
  { key: "storage_exposure", label: "Storage" },
  { key: "config_clarity", label: "Configuration" },
  { key: "market_readiness", label: "Market Readiness" },
];

function DataRow({ label, value, valueClass = "" }) {
  return (
    <div className="flex items-baseline justify-between py-2.5 border-b border-black/[0.05] last:border-0">
      <span className="text-[12px] text-[#6B6560]">{label}</span>
      <span className={`text-[13px] font-semibold text-[#1A1814] ${valueClass}`}>{value}</span>
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
      <div className="min-h-screen bg-[#F7F4EF] px-4 md:px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-6 w-36 bg-black/5 rounded animate-pulse" />
          <div className="h-80 bg-white border border-black/[0.07] rounded-2xl animate-pulse" />
          <div className="h-64 bg-white border border-black/[0.07] rounded-2xl animate-pulse" />
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
          <Link to="/listings" className="text-[#0B2D5B] font-bold hover:underline text-sm">← Back to Listings</Link>
        </div>
      </div>
    );
  }

  const color = scoreColor(passport.ati_total);
  const label = scoreLabel(passport.ati_total);
  const pct = (passport.ati_total / 120) * 100;
  const safeMake = cleanAircraftMake(listing.make);

  return (
    <div className="min-h-screen bg-[#F2F0EB]">

      {/* ── Top navigation bar ─────────────────────── */}
      <div className="bg-white border-b border-black/[0.07] sticky top-0 z-10">
        <div className="px-4 md:px-8 py-3 max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/listings" className="inline-flex items-center gap-1.5 text-[12px] text-[#6B6560] hover:text-[#0B2D5B] transition-colors font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            Listings
          </Link>
          <button onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0B2D5B] hover:text-[#185FA5] transition-colors">
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#0F7A56]" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto space-y-4">

        {/* ── Certificate hero block ──────────────────── */}
        <div className="bg-white rounded-2xl overflow-hidden border border-black/[0.07] shadow-sm">
          {/* Navy header strip */}
          <div className="bg-[#0B2D5B] px-6 pt-6 pb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[#E8A83A] text-[9px] uppercase tracking-[0.25em] font-black mb-1.5">ATI Score Card · ABOS</p>
                <h1 className="text-white font-black text-xl md:text-2xl leading-tight">
                  {listing.year} {safeMake} {listing.model}
                </h1>
                {listing.registration && (
                  <p className="text-white/50 font-mono text-[13px] mt-1">{listing.registration}</p>
                )}
              </div>
              {/* Score badge */}
              <div className="shrink-0 flex flex-col items-center gap-1.5 ml-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center border-2"
                  style={{ borderColor: color, background: `${color}18` }}>
                  <span className="text-2xl font-black" style={{ color }}>{passport.ati_total}</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider" style={{ color }}>{label}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-white/40 text-[10px] font-medium">ATI Score</span>
                <span className="text-white/40 text-[10px] font-medium">{passport.ati_total} / 120</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}60` }} />
              </div>
              {/* Dimension mini-bars */}
              <div className="grid grid-cols-8 gap-1 mt-2.5">
                {DIMS.map(d => {
                  const v = passport[d.key] || 0;
                  const dc = v >= 13 ? "#0F7A56" : v >= 9 ? "#185FA5" : v >= 6 ? "#D4A017" : "#C0392B";
                  return (
                    <div key={d.key} title={`${d.label}: ${v}/15`} className="flex flex-col items-center gap-1">
                      <div className="w-full h-8 bg-white/5 rounded-sm overflow-hidden flex items-end">
                        <div className="w-full rounded-sm" style={{ height: `${(v / 15) * 100}%`, backgroundColor: dc, opacity: 0.85 }} />
                      </div>
                      <span className="text-[7px] text-white/25 font-medium">{v}</span>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-8 gap-1 mt-1">
                {DIMS.map(d => (
                  <span key={d.key} className="text-[6px] text-white/20 text-center leading-tight truncate">{d.label.split(" ")[0]}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Card code footer */}
          <div className="px-6 py-3 bg-[#F7F4EF] border-t border-black/[0.06] flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#AAA49C] font-semibold">Card Reference</span>
            <span className="font-mono text-[12px] font-bold text-[#0B2D5B] tracking-wide">{card.public_card_code}</span>
          </div>
        </div>

        {/* ── Aircraft specs + Valuation side by side ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Specs */}
          <div className="bg-white rounded-2xl border border-black/[0.07] px-6 py-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.18em] font-black text-[#0B2D5B] mb-1">Aircraft Specifications</p>
            <p className="text-[11px] text-[#AAA49C] mb-4">{listing.year} {safeMake} {listing.model}</p>
            <DataRow label="Airframe Total Time" value={listing.total_time ? `${listing.total_time.toLocaleString()} hrs` : "—"} />
            <DataRow label="Engine SMOH" value={listing.engine_hours ? `${listing.engine_hours.toLocaleString()} hrs` : "—"} />
            <DataRow label="TBO" value={listing.tbo ? `${listing.tbo.toLocaleString()} hrs` : "—"} />
            <DataRow label="Last Annual" value={listing.last_annual ? new Date(listing.last_annual).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—"} />
            <DataRow label="Avionics" value={listing.avionics || "—"} />
          </div>

          {/* Valuation */}
          <div className="bg-white rounded-2xl border border-black/[0.07] px-6 py-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.18em] font-black text-[#0B2D5B] mb-1">Valuation</p>
            <p className="text-[11px] text-[#AAA49C] mb-4">Off-Market Value Model · ABOS OMVM v5</p>
            <DataRow label="Asking Price" value={listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : "On request"} />
            <DataRow label="Market Estimate" value={passport.omvm_value ? `$${passport.omvm_value.toLocaleString()}` : "—"} />
            <DataRow
              label="vs. Market"
              value={passport.discount_pct != null
                ? `${passport.discount_pct >= 0 ? "▼ " : "▲ "}${Math.abs(passport.discount_pct)}%`
                : "—"}
              valueClass={passport.discount_pct >= 0 ? "text-[#0F7A56]" : "text-[#C0392B]"}
            />
            <DataRow
              label="Deal Rating"
              value={passport.deal_label ? passport.deal_label.charAt(0).toUpperCase() + passport.deal_label.slice(1) : "—"}
              valueClass={passport.deal_score >= 8.5 ? "text-[#0F7A56]" : passport.deal_score >= 6.5 ? "text-[#185FA5]" : passport.deal_score >= 5 ? "text-[#D4A017]" : "text-[#C0392B]"}
            />
            {passport.deal_radar_eligible && (
              <div className="mt-3 px-3 py-2 rounded-xl bg-[rgba(212,160,23,0.08)] border border-[rgba(212,160,23,0.25)] text-[11px] font-bold text-[#A67C00] flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5" />
                Below market — Deal Radar eligible
              </div>
            )}
          </div>
        </div>

        {/* ── Summary ──────────────────────────────────── */}
        {passport.ai_summary && (
          <div className="bg-white rounded-2xl border border-black/[0.07] px-6 py-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-[#0B2D5B]" />
              <p className="text-[10px] uppercase tracking-[0.18em] font-black text-[#0B2D5B]">Assessment Summary</p>
            </div>
            <p className="text-[13px] text-[#4A4845] leading-relaxed">{passport.ai_summary}</p>
          </div>
        )}

        {/* ── Detailed dimension breakdown ─────────────── */}
        <ATIScoreBreakdown passport={passport} missing_data={passport.missing_data} />

        {/* ── Footer metadata ───────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 pb-6 text-[11px] text-[#AAA49C]">
          <span>Issued {card.issued_at ? new Date(card.issued_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"}</span>
          <div className="flex items-center gap-3">
            <span>v{card.card_version}</span>
            <span className="capitalize">{card.status}</span>
            <span className="font-mono">{card.public_card_code}</span>
          </div>
        </div>
      </div>
    </div>
  );
}