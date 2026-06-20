import { Link } from "react-router-dom";
import { Plane, BadgeCheck, Clock, Flame } from "lucide-react";

const AMBER = "#F8C73E";
const TEAL = "#53C4A2";
const SKY = "#8EB7DC";

function fmtPrice(p, currency = "USD") {
  if (!p) return "Price on request";
  const sym = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  if (p >= 1_000_000) return `${sym}${(p / 1_000_000).toFixed(2)}M`;
  return `${sym}${p.toLocaleString()}`;
}

/**
 * Marketspace aircraft card.
 * High ATI (>=90) → Teal verified-style badge.
 * Otherwise → Amber badge.
 */
export default function AircraftCard({ listing, className = "" }) {
  const ati = listing.ati_score;
  const verified = ati >= 90;
  const badgeColor = verified ? TEAL : AMBER;
  const hotDeal = listing.deal_label === "hot deal";

  return (
    <Link
      to={`/ati-passport/${listing.id}`}
      className={`group block rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${className}`}
      style={{ background: "#0C1620", border: "1px solid rgba(255,255,255,0.11)" }}
    >
      {/* Photo placeholder */}
      <div className="relative aspect-[16/10] overflow-hidden" style={{ background: "#101D28" }}>
        <div className="w-full h-full flex items-center justify-center">
          <Plane className="w-10 h-10" style={{ color: "rgba(142,183,220,0.3)" }} />
        </div>

        {/* ATI badge — top right */}
        {ati ? (
          <div
            className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black"
            style={{ background: "rgba(7,16,24,0.85)", border: `1px solid ${badgeColor}`, color: badgeColor, backdropFilter: "blur(8px)" }}
          >
            {verified && <BadgeCheck className="w-3 h-3" />}
            ATI {ati}
          </div>
        ) : (
          <div
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{ background: "rgba(7,16,24,0.85)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)" }}
          >
            Unscored
          </div>
        )}

        {/* Hot deal strip */}
        {hotDeal && (
          <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 flex items-center gap-1.5"
            style={{ background: "linear-gradient(to top, rgba(7,16,24,0.9), transparent)" }}>
            <Flame className="w-3.5 h-3.5" style={{ color: AMBER }} />
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: AMBER }}>Hot Deal</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-[14px] font-black text-white tracking-tight leading-tight truncate">
          {listing.year} {listing.make} {listing.model}
        </p>
        {listing.registration && (
          <p className="text-[11px] font-mono mt-0.5" style={{ color: SKY }}>{listing.registration}</p>
        )}

        <div className="flex items-end justify-between mt-3">
          <span className="text-[18px] font-black" style={{ color: AMBER }}>{fmtPrice(listing.asking_price, listing.currency)}</span>
        </div>

        {/* Key facts */}
        <div className="flex items-center gap-3 mt-3 pt-3 text-[11px]" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {listing.total_time != null && (
            <span className="flex items-center gap-1" style={{ color: "rgba(255,255,255,0.6)" }}>
              <Clock className="w-3 h-3" style={{ color: SKY }} />
              {Number(listing.total_time).toLocaleString()} h
            </span>
          )}
          {listing.engine_hours != null && (
            <span style={{ color: "rgba(255,255,255,0.6)" }}>{Number(listing.engine_hours).toLocaleString()} SMOH</span>
          )}
        </div>
      </div>
    </Link>
  );
}