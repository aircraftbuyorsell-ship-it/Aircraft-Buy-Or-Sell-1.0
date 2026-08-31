import { Link } from "react-router-dom";
import { CheckSquare, Square, TrendingDown, TrendingUp, ArrowUpRight } from "lucide-react";

// ─── DS v3 tokens ────────────────────────────────────────────────
const T = {
  ink2:   "rgba(255,255,255,0.04)",
  amber:  "#f5c242",
  teal:   "#5dcaa5",
  red:    "#e24b4a",
  w1:     "rgba(255,255,255,0.90)",
  w3:     "rgba(255,255,255,0.35)",
  border: "rgba(255,255,255,0.08)",
};

// ATI band → left-border + chip styling
function atiBand(score) {
  if (score == null) return { borderLeft: `3px solid ${T.border}`, color: T.w3, label: null, dim: "rgba(255,255,255,0.06)", bdr: T.border };
  if (score >= 96) return { borderLeft: "3px solid #5dcaa5", color: T.teal, label: "Strong Buy", dim: "rgba(93,202,165,0.09)", bdr: "rgba(93,202,165,0.20)" };
  if (score >= 80) return { borderLeft: "3px solid rgba(93,202,165,0.55)", color: T.teal, label: "Buy", dim: "rgba(93,202,165,0.09)", bdr: "rgba(93,202,165,0.20)" };
  if (score >= 60) return { borderLeft: "3px solid #f5c242", color: T.amber, label: "Review", dim: "rgba(245,194,66,0.09)", bdr: "rgba(245,194,66,0.22)" };
  return { borderLeft: "3px solid #e24b4a", color: T.red, label: "Caution", dim: "rgba(226,75,74,0.10)", bdr: "rgba(226,75,74,0.22)" };
}

function BandChip({ band }) {
  if (!band.label) return null;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: "9999px",
      fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
      background: band.dim, color: band.color, border: `0.5px solid ${band.bdr}`, lineHeight: 1.6, whiteSpace: "nowrap",
    }}>
      {band.label}
    </span>
  );
}

// ─── Listing Row ─────────────────────────────────────────────────
export default function ListingRow({ listing, onClick, selected, onToggle }) {
  const band = atiBand(listing.ati_score);
  const hasDiscount = listing.discount_pct != null;
  const isBelow = hasDiscount && listing.discount_pct >= 0;

  return (
    <div
      className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 transition-colors last:border-0"
      style={{
        padding: "16px 14px 16px 14px",
        borderBottom: `0.5px solid ${T.border}`,
        borderLeft: band.borderLeft,
        background: selected ? T.ink2 : "transparent",
        cursor: selected ? "default" : "pointer",
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = T.ink2; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = "transparent"; }}
    >
      {/* Checkbox — always visible (not hover-only): a hover-gated checkbox is
          effectively invisible/untappable on touch devices with no mouse. */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(listing.id); }}
        className="shrink-0 transition-opacity"
        style={{ color: T.amber, opacity: selected ? 1 : 0.55, padding: "4px", margin: "-4px" }}>
        {selected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" style={{ color: T.w3 }} />}
      </button>

      {/* Photo thumbnail */}
      <div
        onClick={() => !selected && onClick(listing)}
        className="shrink-0 rounded-lg overflow-hidden relative"
        style={{ width: "64px", height: "64px", background: T.ink2, border: `0.5px solid ${T.border}` }}>
        {listing.photo_url || listing.image_attachments?.[0] ? (
          <img
            src={listing.photo_url || listing.image_attachments[0]}
            alt={`${listing.make} ${listing.model}`}
            className="w-full h-full object-cover"
            loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: T.w3, fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em" }}>
            ✈️
          </div>
        )}
      </div>

      {/* ATI score value */}
      <div onClick={() => !selected && onClick(listing)} className="shrink-0 w-11 text-center">
        <span style={{ fontSize: "17px", fontWeight: 600, letterSpacing: "-0.03em", color: band.color, fontVariantNumeric: "tabular-nums" }}>
          {listing.ati_score ?? "—"}
        </span>
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0" onClick={() => !selected && onClick(listing)}>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "-0.02em", color: T.w1, margin: 0 }}>
            {listing.year && `${listing.year} `}{listing.make} {listing.model}
          </p>
          {listing.registration &&
            <span style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", letterSpacing: "0.06em", color: T.w3 }}>
              {listing.registration}
            </span>
          }
          <BandChip band={band} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
          {listing.total_time &&
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)" }}>
              <span style={{ color: T.w3 }}>TT </span>{listing.total_time.toLocaleString()} h
            </span>
          }
          {listing.engine_hours &&
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)" }}>
              <span style={{ color: T.w3 }}>ENG </span>{listing.engine_hours.toLocaleString()} h
            </span>
          }
          {listing.avionics &&
            <span className="truncate max-w-[140px]" style={{ fontSize: "11px", color: T.w3 }}>{listing.avionics}</span>
          }
        </div>
      </div>

      {/* Price + link */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1 shrink-0" onClick={() => !selected && onClick(listing)}>
        <div className="text-right">
          <p style={{ fontSize: "12px", fontWeight: 500, color: T.w1, margin: 0 }}>
            {listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : <span style={{ color: T.w3, fontWeight: 400 }}>On request</span>}
          </p>
          {hasDiscount &&
            <div className="flex items-center justify-end gap-0.5 mt-0.5" style={{ fontSize: "10px", fontWeight: 600, color: isBelow ? T.teal : T.red }}>
              {isBelow ? <TrendingDown className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
              {Math.abs(listing.discount_pct)}% {isBelow ? "below" : "above"}
            </div>
          }
        </div>
        <Link
          to={`/ati-passport/${listing.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 font-bold transition-all whitespace-nowrap rounded-full sm:opacity-0 sm:group-hover:opacity-100"
          style={{ fontSize: "10px", color: T.amber, background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)", padding: "4px 10px" }}>
          Score Card <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>);
}