import { X, Plus, ExternalLink, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

// ATI score color helper
function atiColor(score) {
  if (score == null) return "#ffffff30";
  if (score >= 90) return "#00f5ff";
  if (score >= 72) return "#7a00ff";
  if (score >= 54) return "#E8A83A";
  return "#ff4d6d";
}

function atiLabel(score) {
  if (score == null) return "Unscored";
  if (score >= 90) return "EXCEPTIONAL";
  if (score >= 75) return "STRONG BUY";
  if (score >= 60) return "FAIR";
  if (score >= 40) return "CAUTION";
  return "AVOID";
}

function ATIRing({ score, size = 64 }) {
  if (!score) return (
    <div className="flex items-center justify-center rounded-full" style={{ width: size, height: size, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
      <span className="text-white/25 text-[10px] font-bold">—</span>
    </div>
  );
  const color = atiColor(score);
  const pct = (score / 120) * 113.1;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
        <circle cx="22" cy="22" r="18" fill="none" stroke={`${color}25`} strokeWidth="3" />
        <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${pct} 113.1`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-black" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

// Find the "best" value in an array for a given field (highest or lowest)
function bestIdx(listings, field, higher = true) {
  const vals = listings.map(l => l[field]).filter(v => v != null);
  if (vals.length < 2) return -1;
  const best = higher ? Math.max(...vals) : Math.min(...vals);
  return listings.findIndex(l => l[field] === best);
}

const ROWS = [
  { key: "ati_score", label: "ATI Score", unit: "/ 120", higher: true, format: v => v ?? "—" },
  { key: "asking_price", label: "Asking Price", higher: false, format: v => v ? `$${v.toLocaleString()}` : "On request" },
  { key: "deal_label", label: "Deal Rating", format: v => v ?? "—" },
  { key: "omvm_value", label: "Market Value (OMVM)", higher: true, format: v => v ? `$${v.toLocaleString()}` : "—" },
  { key: "discount_pct", label: "vs Market", format: (v) => {
    if (v == null) return "—";
    return v >= 0 ? `${v}% below` : `${Math.abs(v)}% above`;
  }},
  { divider: true, label: "Airframe & Engine" },
  { key: "year", label: "Year", higher: true, format: v => v ?? "—" },
  { key: "total_time", label: "Total Time", unit: " h", higher: false, format: v => v ? v.toLocaleString() : "—" },
  { key: "engine_hours", label: "Engine SMOH", unit: " h", higher: false, format: v => v ? v.toLocaleString() : "—" },
  { key: "tbo", label: "Engine TBO", unit: " h", format: v => v ? v.toLocaleString() : "—" },
  { key: "last_annual", label: "Last Annual", format: v => v ?? "—" },
  { divider: true, label: "Aircraft Details" },
  { key: "registration", label: "Registration", format: v => v ?? "—" },
  { key: "avionics", label: "Avionics", format: v => v ?? "—", multiline: true },
];

const DEAL_STYLE = {
  "hot deal":   { color: "#E8A83A", bg: "rgba(232,168,58,0.12)", border: "rgba(232,168,58,0.25)" },
  "good deal":  { color: "#00f5ff", bg: "rgba(0,245,255,0.08)", border: "rgba(0,245,255,0.20)" },
  "fair":       { color: "#7a00ff", bg: "rgba(122,0,255,0.10)", border: "rgba(122,0,255,0.25)" },
  "overpriced": { color: "#ff4d6d", bg: "rgba(255,77,109,0.10)", border: "rgba(255,77,109,0.22)" },
};

export default function CompareTable({ listings, onRemove, onAdd }) {
  const colCount = listings.length;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(13,20,50,0.70)", backdropFilter: "blur(32px)", border: "1px solid rgba(0,245,255,0.12)", boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,245,255,0.08)" }}>
      {/* Aircraft header columns */}
      <div className="grid" style={{ gridTemplateColumns: `180px repeat(${colCount}, 1fr)${onAdd ? " 100px" : ""}` }}>
        {/* Label column header */}
        <div className="px-4 py-5 border-b border-r" style={{ borderColor: "rgba(0,245,255,0.08)" }}>
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#00f5ff] font-black">Compare</p>
          <p className="text-[11px] text-white/30 mt-0.5">{colCount} aircraft</p>
        </div>

        {/* Aircraft header cards */}
        {listings.map((l, i) => {
          const color = atiColor(l.ati_score);
          return (
            <div key={l.id} className="relative px-4 py-5 border-b border-r flex flex-col items-start gap-2"
              style={{ borderColor: "rgba(0,245,255,0.08)", background: `${color}06` }}>
              <button
                onClick={() => onRemove(l.id)}
                className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <ATIRing score={l.ati_score} size={52} />
              <div>
                <p className="text-[13px] font-black text-white leading-tight">
                  {l.year} {l.make} {l.model}
                </p>
                {l.registration && (
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{l.registration}</p>
                )}
                <p className="text-[9px] font-black mt-1 uppercase tracking-wider" style={{ color }}>{atiLabel(l.ati_score)}</p>
              </div>
              <Link to={`/ati-passport/${l.id}`}
                className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold mt-1 hover:opacity-70 transition-opacity"
                style={{ color }}>
                Full Report <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
          );
        })}

        {/* Add aircraft placeholder */}
        {onAdd && (
          <button onClick={onAdd}
            className="px-4 py-5 border-b flex flex-col items-center justify-center gap-2 transition-all hover:bg-white/[0.04]"
            style={{ borderColor: "rgba(0,245,255,0.08)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ border: "1px dashed rgba(0,245,255,0.30)", color: "rgba(0,245,255,0.40)" }}>
              <Plus className="w-4 h-4" />
            </div>
            <p className="text-[9px] text-white/25 uppercase tracking-wider font-bold">Add</p>
          </button>
        )}
      </div>

      {/* Data rows */}
      {ROWS.map((row, rowIdx) => {
        if (row.divider) {
          return (
            <div key={rowIdx} className="grid" style={{ gridTemplateColumns: `180px repeat(${colCount}, 1fr)${onAdd ? " 100px" : ""}` }}>
              <div className="col-span-full px-4 py-2.5 border-b"
                style={{ borderColor: "rgba(0,245,255,0.08)", background: "rgba(122,0,255,0.08)" }}>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#7a00ff] font-black">{row.label}</p>
              </div>
            </div>
          );
        }

        const winnerIdx = (row.higher != null) ? bestIdx(listings, row.key, row.higher) : -1;
        const rowBg = rowIdx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)";

        return (
          <div key={row.key} className="grid" style={{ gridTemplateColumns: `180px repeat(${colCount}, 1fr)${onAdd ? " 100px" : ""}`, background: rowBg }}>
            {/* Row label */}
            <div className="px-4 py-3.5 border-b border-r flex items-center" style={{ borderColor: "rgba(0,245,255,0.06)" }}>
              <span className="text-[10px] text-white/40 font-semibold">{row.label}</span>
            </div>

            {/* Values */}
            {listings.map((l, i) => {
              const raw = l[row.key];
              const formatted = row.format(raw);
              const isWinner = winnerIdx === i;

              // Special rendering for deal_label
              if (row.key === "deal_label" && raw) {
                const ds = DEAL_STYLE[raw?.toLowerCase()] || {};
                return (
                  <div key={l.id} className="px-4 py-3.5 border-b border-r flex items-center" style={{ borderColor: "rgba(0,245,255,0.06)" }}>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
                      style={{ background: ds.bg, color: ds.color, border: `1px solid ${ds.border}` }}>
                      {raw}
                    </span>
                  </div>
                );
              }

              // Special rendering for discount_pct
              if (row.key === "discount_pct") {
                const below = raw != null && raw >= 0;
                return (
                  <div key={l.id} className="px-4 py-3.5 border-b border-r flex items-center gap-1" style={{ borderColor: "rgba(0,245,255,0.06)" }}>
                    {raw != null ? (
                      <>
                        {below ? <TrendingDown className="w-3 h-3 text-[#00f5ff]" /> : <TrendingUp className="w-3 h-3 text-[#ff4d6d]" />}
                        <span className={`text-[11px] font-bold ${below ? "text-[#00f5ff]" : "text-[#ff4d6d]"}`}>{formatted}</span>
                      </>
                    ) : <span className="text-white/25 text-[11px]">—</span>}
                  </div>
                );
              }

              return (
                <div key={l.id} className="px-4 py-3.5 border-b border-r flex items-center gap-1.5" style={{ borderColor: "rgba(0,245,255,0.06)" }}>
                  {isWinner && raw != null && (
                    <div className="w-1 h-1 rounded-full bg-[#00f5ff] shrink-0" style={{ boxShadow: "0 0 4px rgba(0,245,255,0.8)" }} />
                  )}
                  <span className={`text-[11px] font-semibold ${row.multiline ? "leading-snug break-words" : "truncate"} ${isWinner && raw != null ? "text-white" : "text-white/50"}`}
                    title={row.multiline ? String(formatted) : undefined}>
                    {String(formatted)}{raw != null && row.unit ? row.unit : ""}
                  </span>
                </div>
              );
            })}

            {/* Add column placeholder */}
            {onAdd && <div className="border-b" style={{ borderColor: "rgba(0,245,255,0.06)" }} />}
          </div>
        );
      })}
    </div>
  );
}