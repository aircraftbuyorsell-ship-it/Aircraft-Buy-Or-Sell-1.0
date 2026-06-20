import { Link } from "react-router-dom";
import { CheckSquare, Square, TrendingDown, TrendingUp, ArrowUpRight } from "lucide-react";

// ─── ATI Score Ring ──────────────────────────────────────────────
function ATIBadge({ score }) {
  if (score == null) return (
    <div className="w-11 h-11 rounded-full bg-[#F0EDE6] border border-black/[0.06] flex items-center justify-center shrink-0">
      <span className="text-[9px] text-[#4a4550] font-bold">—</span>
    </div>);

  const color = score >= 90 ? "#0F7A56" : score >= 72 ? "#185FA5" : score >= 54 ? "#D4A017" : "#C0392B";
  const bg = score >= 90 ? "rgba(15,122,86,0.08)" : score >= 72 ? "rgba(24,95,165,0.08)" : score >= 54 ? "rgba(212,160,23,0.08)" : "rgba(192,57,43,0.08)";
  return (
    <div className="relative w-11 h-11 shrink-0 rounded-full" style={{ background: bg }}>
      <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
        <circle cx="22" cy="22" r="18" fill="none" stroke={`${color}30`} strokeWidth="3" />
        <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${score / 120 * 113.1} 113.1`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-black" style={{ color }}>{score}</span>
      </div>
    </div>);
}

// ─── Deal Badge ──────────────────────────────────────────────────
function DealBadge({ label }) {
  if (!label) return null;
  const styles = {
    "hot deal": { dot: "#D4A017", bg: "rgba(212,160,23,0.1)", text: "#A67C00", border: "rgba(212,160,23,0.25)" },
    "good deal": { dot: "#0F7A56", bg: "rgba(15,122,86,0.08)", text: "#0F7A56", border: "rgba(15,122,86,0.2)" },
    "fair": { dot: "#185FA5", bg: "rgba(24,95,165,0.07)", text: "#185FA5", border: "rgba(24,95,165,0.18)" },
    "overpriced": { dot: "#C0392B", bg: "rgba(192,57,43,0.07)", text: "#C0392B", border: "rgba(192,57,43,0.18)" }
  };
  const s = styles[label.toLowerCase()];
  if (!s) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border"
    style={{ background: s.bg, color: s.text, borderColor: s.border }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
      {label}
    </span>);
}

// ─── Listing Row ─────────────────────────────────────────────────
export default function ListingRow({ listing, onClick, selected, onToggle }) {
  const enginePct = listing.tbo ?
  Math.max(0, Math.min(100, (listing.tbo - (listing.engine_hours || 0)) / listing.tbo * 100)) :
  null;
  const engineColor = enginePct > 60 ? "#0F7A56" : enginePct > 30 ? "#D4A017" : "#C0392B";
  const hasDiscount = listing.discount_pct != null;
  const isBelow = hasDiscount && listing.discount_pct >= 0;

  return (
    <div
      className={`group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 px-5 md:px-6 py-4 transition-all border-b border-white/[0.05] last:border-0 ${selected ? "bg-[#EBF2FF]/5" : "hover:bg-white/[0.03] cursor-pointer"}`}>

      {/* Checkbox */}
      <button
        onClick={(e) => {e.stopPropagation();onToggle(listing.id);}}
        className="shrink-0 text-[#f5c242] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        style={{ opacity: selected ? 1 : undefined }}>

        {selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-[rgba(255,255,255,0.3)]" />}
      </button>

      {/* ATI Ring */}
      <div onClick={() => !selected && onClick(listing)}>
      <ATIBadge score={listing.ati_score} />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0" onClick={() => !selected && onClick(listing)}>
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <p className="text-[13px] font-black tracking-tight" style={{ color: "#fff" }}>
            {listing.year && `${listing.year} `}{listing.make} {listing.model}
          </p>
          {listing.registration &&
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md" style={{ color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {listing.registration}
            </span>
          }
          <DealBadge label={listing.deal_label} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
          {listing.total_time &&
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>
              <span className="font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>TT </span>{listing.total_time.toLocaleString()} h
            </span>
          }
          {listing.engine_hours &&
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>
              <span className="font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>ENG </span>{listing.engine_hours.toLocaleString()} h
            </span>
          }
          {enginePct != null &&
          <div className="flex items-center gap-1.5">
              <div className="w-20 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${enginePct}%`, backgroundColor: engineColor }} />
              </div>
              <span className="text-[9px] font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{Math.round(enginePct)}%</span>
            </div>
          }
          {listing.avionics &&
          <span className="text-[11px] truncate max-w-[140px]" style={{ color: "rgba(255,255,255,0.4)" }}>{listing.avionics}</span>
          }
        </div>
      </div>

      {/* Price + link */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1 shrink-0" onClick={() => !selected && onClick(listing)}>
        <div className="text-right">
          <p className="text-[15px] font-black tracking-tight" style={{ color: "#fff" }}>
            {listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : <span className="text-sm font-normal" style={{ color: "rgba(255,255,255,0.4)" }}>On request</span>}
          </p>
          {hasDiscount &&
          <div className={`flex items-center justify-end gap-0.5 text-[10px] font-bold mt-0.5 ${isBelow ? "text-[#5dcaa5]" : "text-[#e24b4a]"}`}>
              {isBelow ? <TrendingDown className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
              {Math.abs(listing.discount_pct)}% {isBelow ? "below" : "above"}
            </div>
          }
        </div>
        <Link
          to={`/ati-passport/${listing.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-[10px] text-[#f5c242] hover:text-[#fdd05a] font-bold transition-all whitespace-nowrap bg-[rgba(245,194,66,0.08)] border border-[rgba(245,194,66,0.2)] px-2.5 py-1 rounded-full sm:opacity-0 sm:group-hover:opacity-100">

          Score Card <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>);
}