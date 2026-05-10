import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, TrendingDown, TrendingUp, CheckCircle2, ThumbsUp, ThumbsDown, X } from "lucide-react";

const SWIPE_THRESHOLD = 80; // px to trigger action

function scoreColor(score) {
  if (!score) return "#AAA49C";
  if (score >= 90) return "#0F7A56";
  if (score >= 72) return "#185FA5";
  if (score >= 54) return "#D4A017";
  return "#C0392B";
}

function scoreLabel(score) {
  if (!score) return "Unscored";
  if (score >= 108) return "Exceptional";
  if (score >= 90) return "Strong Buy";
  if (score >= 72) return "Fair";
  if (score >= 54) return "Caution";
  return "Avoid";
}

function dealStyle(label) {
  const map = {
    "hot deal": { bg: "rgba(212,160,23,0.12)", text: "#A67C00", border: "rgba(212,160,23,0.3)", emoji: "⚡" },
    "good deal": { bg: "rgba(15,122,86,0.1)", text: "#0F7A56", border: "rgba(15,122,86,0.25)", emoji: "✅" },
    "fair": { bg: "rgba(24,95,165,0.08)", text: "#185FA5", border: "rgba(24,95,165,0.2)", emoji: "➡️" },
    "overpriced": { bg: "rgba(192,57,43,0.08)", text: "#C0392B", border: "rgba(192,57,43,0.2)", emoji: "⚠️" },
  };
  return map[(label || "").toLowerCase()] || null;
}

export default function SwipeCard({ listing: l, onLike, onDiscard }) {
  const cardRef = useRef(null);
  const startX = useRef(null);
  const startY = useRef(null);
  const [dx, setDx] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const enginePct = l.tbo && l.engine_hours != null
    ? Math.max(0, Math.min(100, ((l.tbo - l.engine_hours) / l.tbo) * 100))
    : null;
  const engineColor = enginePct > 60 ? "#0F7A56" : enginePct > 30 ? "#D4A017" : "#C0392B";
  const color = scoreColor(l.ati_score);
  const deal = dealStyle(l.deal_label);
  const isBelow = l.discount_pct != null && l.discount_pct >= 0;

  // Touch handlers
  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    setSwiping(true);
  };
  const onTouchMove = (e) => {
    if (startX.current == null) return;
    const dxNow = e.touches[0].clientX - startX.current;
    const dyNow = Math.abs(e.touches[0].clientY - startY.current);
    // Only horizontal swipe
    if (Math.abs(dxNow) > dyNow) {
      e.preventDefault();
      setDx(dxNow);
    }
  };
  const onTouchEnd = () => {
    if (dx > SWIPE_THRESHOLD) {
      onLike && onLike(l);
    } else if (dx < -SWIPE_THRESHOLD) {
      onDiscard && onDiscard(l);
    }
    setDx(0);
    setSwiping(false);
    startX.current = null;
  };

  // Mouse handlers (desktop drag)
  const onMouseDown = (e) => {
    startX.current = e.clientX;
    setSwiping(true);
    const move = (ev) => {
      setDx(ev.clientX - startX.current);
    };
    const up = () => {
      if (dx > SWIPE_THRESHOLD) onLike && onLike(l);
      else if (dx < -SWIPE_THRESHOLD) onDiscard && onDiscard(l);
      setDx(0);
      setSwiping(false);
      startX.current = null;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const rotation = (dx / 20).toFixed(1);
  const likeOpacity = Math.max(0, Math.min(1, dx / SWIPE_THRESHOLD));
  const discardOpacity = Math.max(0, Math.min(1, -dx / SWIPE_THRESHOLD));

  return (
    <div
      ref={cardRef}
      className="relative select-none touch-pan-y"
      style={{
        transform: `translateX(${dx}px) rotate(${rotation}deg)`,
        transition: swiping ? "none" : "transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)",
        cursor: swiping ? "grabbing" : "grab",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
    >
      {/* ── SWIPE OVERLAYS ── */}
      <div className="absolute inset-0 z-10 flex items-start justify-start p-5 pointer-events-none rounded-2xl"
        style={{ opacity: likeOpacity, background: "rgba(15,122,86,0.08)", border: "2px solid rgba(15,122,86,0.4)" }}>
        <div className="flex items-center gap-2 bg-[#0F7A56] text-white px-3 py-1.5 rounded-xl font-black text-sm shadow-lg">
          <ThumbsUp className="w-4 h-4" /> INTERESTED
        </div>
      </div>
      <div className="absolute inset-0 z-10 flex items-start justify-end p-5 pointer-events-none rounded-2xl"
        style={{ opacity: discardOpacity, background: "rgba(192,57,43,0.06)", border: "2px solid rgba(192,57,43,0.35)" }}>
        <div className="flex items-center gap-2 bg-[#C0392B] text-white px-3 py-1.5 rounded-xl font-black text-sm shadow-lg">
          SKIP <ThumbsDown className="w-4 h-4" />
        </div>
      </div>

      {/* ── CARD ── */}
      <div className="bg-white rounded-2xl border border-black/[0.08] shadow-sm overflow-hidden">

        {/* Top band — navy */}
        <div className="bg-[#0B2D5B] px-5 pt-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[#E8A83A] text-[8px] uppercase tracking-[0.2em] font-bold">ATI Score Card</p>
              <h3 className="text-white font-black text-lg leading-tight mt-0.5 truncate">
                {l.year} {l.make} {l.model}
              </h3>
              <p className="text-white/50 font-mono text-[11px] mt-0.5">{l.registration || "—"}</p>
            </div>
            {/* Score circle */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="relative w-14 h-14">
                <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                  <circle cx="28" cy="28" r="22" fill="none" stroke={color} strokeWidth="4"
                    strokeDasharray={`${((l.ati_score || 0) / 120) * 138.2} 138.2`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-white font-black text-base leading-none">{l.ati_score || "—"}</span>
                </div>
              </div>
              <span className="text-[8px] font-bold mt-0.5 uppercase tracking-wide" style={{ color }}>{scoreLabel(l.ati_score)}</span>
            </div>
          </div>
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.06]">
          <div>
            <p className="text-[9px] text-[#AAA49C] uppercase tracking-wider font-semibold">Asking Price</p>
            <p className="text-xl font-black text-[#1A1814]">
              {l.asking_price ? `$${l.asking_price.toLocaleString()}` : <span className="text-[#AAA49C] text-base">Price on request</span>}
            </p>
          </div>
          <div className="text-right">
            {l.omvm_value && (
              <>
                <p className="text-[9px] text-[#AAA49C] uppercase tracking-wider font-semibold">Market Est.</p>
                <p className="text-sm font-black text-[#6B6560]">${l.omvm_value.toLocaleString()}</p>
              </>
            )}
            {l.discount_pct != null && (
              <div className={`flex items-center justify-end gap-0.5 text-[10px] font-black mt-0.5 ${isBelow ? "text-[#0F7A56]" : "text-[#C0392B]"}`}>
                {isBelow ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {Math.abs(l.discount_pct)}% {isBelow ? "below" : "above"} market
              </div>
            )}
          </div>
        </div>

        {/* Specs grid */}
        <div className="grid grid-cols-3 divide-x divide-black/[0.05] border-b border-black/[0.06]">
          {[
            { label: "Total Time", value: l.total_time ? `${l.total_time.toLocaleString()} h` : "—" },
            { label: "Engine", value: l.engine_hours ? `${l.engine_hours.toLocaleString()} h` : "—" },
            { label: "TBO", value: l.tbo ? `${l.tbo.toLocaleString()} h` : "—" },
          ].map(s => (
            <div key={s.label} className="px-3 py-2.5 text-center">
              <p className="text-[9px] text-[#AAA49C] uppercase tracking-wider font-semibold">{s.label}</p>
              <p className="text-[12px] font-black text-[#1A1814] mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Engine life bar */}
        {enginePct != null && (
          <div className="px-5 py-2.5 border-b border-black/[0.06]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-[#AAA49C] uppercase tracking-wider font-semibold">Engine Life Remaining</span>
              <span className="text-[9px] font-black" style={{ color: engineColor }}>{Math.round(enginePct)}%</span>
            </div>
            <div className="h-2 bg-black/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${enginePct}%`, backgroundColor: engineColor }} />
            </div>
          </div>
        )}

        {/* Deal badge + fresh annual + avionics */}
        <div className="px-5 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {deal && (
              <span className="text-[8px] uppercase tracking-wider font-black px-2.5 py-1 rounded-full border"
                style={{ background: deal.bg, color: deal.text, borderColor: deal.border }}>
                {deal.emoji} {l.deal_label}
              </span>
            )}
            {l.fresh_annual && (
              <span className="flex items-center gap-1 text-[8px] font-black text-[#0F7A56] bg-[rgba(15,122,86,0.08)] border border-[rgba(15,122,86,0.2)] px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Fresh Annual
              </span>
            )}
            {l.avionics && (
              <span className="text-[8px] text-[#6B6560] truncate max-w-[120px]">{l.avionics.split(",")[0].trim()}{l.avionics.split(",").length > 1 ? ` +${l.avionics.split(",").length - 1}` : ""}</span>
            )}
          </div>
          <Link
            to={`/ati-passport/${l.id}`}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            className="flex items-center gap-1 text-[10px] text-[#D4A017] hover:text-[#0B2D5B] font-black uppercase tracking-wider transition-colors whitespace-nowrap"
          >
            Full Report <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Swipe hint */}
        <div className="flex items-center justify-between px-5 py-2 bg-[#F7F4EF] border-t border-black/[0.05]">
          <span className="text-[8px] text-[#AAA49C] flex items-center gap-1">← swipe left to skip</span>
          <span className="text-[8px] text-[#AAA49C]">swipe right to shortlist →</span>
        </div>
      </div>
    </div>
  );
}