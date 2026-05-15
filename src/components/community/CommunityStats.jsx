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
        <div key={stat.label} className="rounded-2xl border border-white/65 bg-white/58 p-4 text-center shadow-sm backdrop-blur-xl">
          <p className="text-xl font-black tracking-[-0.04em] text-[#0B2D5B]">{stat.value}</p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#AAA49C]">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}