import { useEffect, useRef, useState } from "react";
import { TrendingDown, ShieldCheck, Flame, Layers } from "lucide-react";

const AMBER = "#F8C73E";
const TEAL = "#53C4A2";
const SKY = "#8EB7DC";

function useCountUp(target, duration = 1100) {
  const [val, setVal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    cancelAnimationFrame(ref.current);
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [target, duration]);
  return val;
}

function StatTile({ icon: Icon, value, suffix = "", label, color, decimals = 0 }) {
  const animated = useCountUp(value);
  return (
    <div
      className="rounded-2xl p-4 md:p-5 flex flex-col gap-2"
      style={{ background: "#0C1620", border: "1px solid rgba(142,183,220,0.25)" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}1f` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl md:text-3xl font-black tracking-tight" style={{ color }}>
        {animated.toFixed(decimals).toLocaleString()}{suffix}
      </p>
      <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
        {label}
      </p>
    </div>
  );
}

export default function StatCounters({ listings = [] }) {
  const total = listings.length;
  const scored = listings.filter((l) => l.ati_score).length;
  const scoredPct = total > 0 ? Math.round((scored / total) * 100) : 0;

  const discounts = listings.map((l) => l.discount_pct).filter((d) => d != null && d > 0);
  const avgDiscount = discounts.length > 0
    ? Math.round(discounts.reduce((s, d) => s + d, 0) / discounts.length)
    : 0;

  const hotDeals = listings.filter((l) => l.deal_label === "hot deal").length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatTile icon={Layers} value={total} label="Active listings" color={AMBER} />
      <StatTile icon={ShieldCheck} value={scoredPct} suffix="%" label="ATI-scored" color={TEAL} />
      <StatTile icon={TrendingDown} value={avgDiscount} suffix="%" label="Avg below market" color={SKY} />
      <StatTile icon={Flame} value={hotDeals} label="Hot deals live" color={AMBER} />
    </div>
  );
}