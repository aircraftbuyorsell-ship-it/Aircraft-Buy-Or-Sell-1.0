import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, TrendingDown, TrendingUp,
  CheckCircle2, ThumbsUp, ThumbsDown
} from "lucide-react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";

const SWIPE_THRESHOLD = 100;

function scoreColor(s) {
  if (!s) return "#AAA49C";
  if (s >= 90) return "#0F7A56";
  if (s >= 72) return "#185FA5";
  if (s >= 54) return "#D4A017";
  return "#C0392B";
}
function scoreLabel(s) {
  if (!s) return "—";
  if (s >= 108) return "Exceptional";
  if (s >= 90) return "Strong Buy";
  if (s >= 72) return "Fair";
  if (s >= 54) return "Caution";
  return "Avoid";
}
function dealStyle(label) {
  const map = {
    "hot deal":  { bg: "rgba(212,160,23,0.12)",  color: "#A67C00", border: "rgba(212,160,23,0.3)",  emoji: "⚡" },
    "good deal": { bg: "rgba(15,122,86,0.10)",   color: "#0F7A56", border: "rgba(15,122,86,0.25)", emoji: "✅" },
    "fair":      { bg: "rgba(24,95,165,0.08)",   color: "#185FA5", border: "rgba(24,95,165,0.2)",  emoji: "➡️" },
    "overpriced":{ bg: "rgba(192,57,43,0.08)",   color: "#C0392B", border: "rgba(192,57,43,0.2)",  emoji: "⚠️" },
  };
  return map[(label || "").toLowerCase()] || null;
}

function Card({ listing: l }) {
  const enginePct = l.tbo && l.engine_hours != null
    ? Math.max(0, Math.min(100, ((l.tbo - l.engine_hours) / l.tbo) * 100))
    : null;
  const engineColor = enginePct > 60 ? "#0F7A56" : enginePct > 30 ? "#D4A017" : "#C0392B";
  const color = scoreColor(l.ati_score);
  const deal = dealStyle(l.deal_label);
  const isBelow = l.discount_pct != null && l.discount_pct >= 0;

  return (
    <div className="bg-white rounded-2xl border border-black/[0.08] shadow-lg overflow-hidden w-full pointer-events-none select-none">
      {/* Navy header */}
      <div className="bg-[#0B2D5B] px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[#E8A83A] text-[8px] uppercase tracking-[0.2em] font-bold">ATI Score Card</p>
            <h3 className="text-white font-black text-lg leading-tight mt-0.5 truncate">
              {l.year} {l.make} {l.model}
            </h3>
            <p className="text-white/50 font-mono text-[11px] mt-0.5">{l.registration || "—"}</p>
          </div>
          <div className="shrink-0 flex flex-col items-center gap-1">
            <div className="relative w-14 h-14">
              <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <circle cx="28" cy="28" r="22" fill="none" stroke={color} strokeWidth="4"
                  strokeDasharray={`${((l.ati_score || 0) / 120) * 138.2} 138.2`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-black text-base leading-none">{l.ati_score || "—"}</span>
              </div>
            </div>
            <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color }}>{scoreLabel(l.ati_score)}</span>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.06]">
        <div>
          <p className="text-[9px] text-[#AAA49C] uppercase tracking-wider font-semibold mb-0.5">Asking Price</p>
          <p className="text-xl font-black text-[#1A1814]">
            {l.asking_price ? `$${l.asking_price.toLocaleString()}` : <span className="text-[#AAA49C] text-base font-semibold">On request</span>}
          </p>
        </div>
        <div className="text-right">
          {l.omvm_value && <p className="text-[9px] text-[#AAA49C] font-semibold">Est. ${l.omvm_value.toLocaleString()}</p>}
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

      {/* Engine bar */}
      {enginePct != null && (
        <div className="px-5 py-2.5 border-b border-black/[0.06]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-[#AAA49C] uppercase tracking-wider font-semibold">Engine Life</span>
            <span className="text-[9px] font-black" style={{ color: engineColor }}>{Math.round(enginePct)}%</span>
          </div>
          <div className="h-2 bg-black/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${enginePct}%`, backgroundColor: engineColor }} />
          </div>
        </div>
      )}

      {/* Footer row */}
      <div className="px-5 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {deal && (
            <span className="text-[8px] uppercase tracking-wider font-black px-2.5 py-1 rounded-full border"
              style={{ background: deal.bg, color: deal.color, borderColor: deal.border }}>
              {deal.emoji} {l.deal_label}
            </span>
          )}
          {l.fresh_annual && (
            <span className="flex items-center gap-1 text-[8px] font-black text-[#0F7A56] bg-[rgba(15,122,86,0.08)] border border-[rgba(15,122,86,0.2)] px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Fresh Annual
            </span>
          )}
        </div>
        {/* pointer-events restored just for this link */}
        <Link
          to={`/ati-passport/${l.id}`}
          className="pointer-events-auto flex items-center gap-1 text-[10px] text-[#D4A017] hover:text-[#0B2D5B] font-black uppercase tracking-wider transition-colors whitespace-nowrap"
          onClick={e => e.stopPropagation()}
        >
          Full Report <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

// ─── Swipeable top card ────────────────────────────────────────
function SwipeableCard({ listing, onLike, onDiscard }) {
  const controls = useAnimation();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1]);
  const discardOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0]);

  const handleDragEnd = async (_, info) => {
    const offset = info.offset.x;
    if (offset > SWIPE_THRESHOLD) {
      await controls.start({ x: 600, opacity: 0, transition: { duration: 0.3 } });
      onLike(listing);
    } else if (offset < -SWIPE_THRESHOLD) {
      await controls.start({ x: -600, opacity: 0, transition: { duration: 0.3 } });
      onDiscard(listing);
    } else {
      controls.start({ x: 0, rotate: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      animate={controls}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.02 }}
    >
      {/* Like overlay */}
      <motion.div className="absolute inset-0 z-10 flex items-start justify-start p-5 pointer-events-none rounded-2xl overflow-hidden"
        style={{ opacity: likeOpacity, background: "rgba(15,122,86,0.06)", borderWidth: 2, borderStyle: "solid", borderColor: "rgba(15,122,86,0.4)" }}>
        <div className="bg-[#0F7A56] text-white px-4 py-1.5 rounded-xl font-black text-sm flex items-center gap-2 rotate-[-12deg]">
          <ThumbsUp className="w-4 h-4" /> INTERESTED
        </div>
      </motion.div>

      {/* Discard overlay */}
      <motion.div className="absolute inset-0 z-10 flex items-start justify-end p-5 pointer-events-none rounded-2xl overflow-hidden"
        style={{ opacity: discardOpacity, background: "rgba(192,57,43,0.05)", borderWidth: 2, borderStyle: "solid", borderColor: "rgba(192,57,43,0.35)" }}>
        <div className="bg-[#C0392B] text-white px-4 py-1.5 rounded-xl font-black text-sm flex items-center gap-2 rotate-[12deg]">
          SKIP <ThumbsDown className="w-4 h-4" />
        </div>
      </motion.div>

      <Card listing={listing} />
    </motion.div>
  );
}

// ─── Public export: stacked deck ──────────────────────────────
export default function SwipeDeck({ listings, onLike, onDiscard }) {
  // Show top 3 in a stacked deck
  const visible = listings.slice(0, 3);

  if (listings.length === 0) return null;

  return (
    <div className="relative w-full" style={{ height: 520 }}>
      {/* Background cards (depth effect) */}
      {visible.slice(1).map((l, i) => (
        <div
          key={l.id}
          className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
          style={{
            transform: `scale(${1 - (i + 1) * 0.04}) translateY(${(i + 1) * 12}px)`,
            zIndex: visible.length - i - 2,
            opacity: 1 - (i + 1) * 0.15,
          }}
        >
          <Card listing={l} />
        </div>
      ))}

      {/* Top draggable card */}
      <SwipeableCard
        key={visible[0].id}
        listing={visible[0]}
        onLike={onLike}
        onDiscard={onDiscard}
      />
    </div>
  );
}