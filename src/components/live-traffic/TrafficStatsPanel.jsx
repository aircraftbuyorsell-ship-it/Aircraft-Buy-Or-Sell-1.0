import { Plane, TrendingUp, ShieldCheck, AlertCircle } from "lucide-react";

export default function TrafficStatsPanel({ aircraft }) {
  if (!aircraft || aircraft.length === 0) return null;

  const withATI = aircraft.filter(a => a.listing?.ati_score);
  const airborne = aircraft.filter(a => !a.on_ground);
  const hotDeals = aircraft.filter(a => a.listing?.deal_label === "hot deal");
  const avgATI = withATI.length > 0
    ? Math.round(withATI.reduce((s, a) => s + a.listing.ati_score, 0) / withATI.length)
    : null;

  const stats = [
    { icon: Plane, label: "Visible Aircraft", value: aircraft.length, color: "#0B2D5B" },
    { icon: TrendingUp, label: "Airborne", value: airborne.length, color: "#185FA5" },
    { icon: ShieldCheck, label: "ATI Scored", value: withATI.length, color: "#0F7A56", sub: avgATI ? `avg ${avgATI}` : null },
    { icon: AlertCircle, label: "Hot Deals", value: hotDeals.length, color: "#D4A017" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(s => (
        <div key={s.label} className="bg-white border border-black/[0.07] rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
            <p className="text-[9px] uppercase tracking-wider font-semibold text-[#AAA49C]">{s.label}</p>
          </div>
          <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          {s.sub && <p className="text-[10px] text-[#6B6560] mt-0.5">{s.sub}</p>}
        </div>
      ))}
    </div>
  );
}