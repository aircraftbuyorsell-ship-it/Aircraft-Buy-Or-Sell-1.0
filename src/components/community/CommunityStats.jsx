import { C } from "@/theme/community";

const STATS = [
  { label: "Community Style", value: "Owners" },
  { label: "Aircraft Focus", value: "Piper / Cessna" },
  { label: "Post Types", value: "Sell · Buy · Advice" },
  { label: "Trust Layer", value: "ATI Ready" },
];

export default function CommunityStats() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {STATS.map((stat) => (
        <div key={stat.label} className="rounded-2xl p-4 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <p className="text-xl font-black tracking-[-0.04em]" style={{ color: C.goldLight }}>{stat.value}</p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: C.textDim }}>{stat.label}</p>
        </div>
      ))}
    </div>
  );
}