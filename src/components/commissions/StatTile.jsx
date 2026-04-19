export default function StatTile({ label, value, sub, color = "#1A1814" }) {
  return (
    <div className="bg-white border border-black/[0.07] rounded-xl p-4">
      <p className="text-[9px] uppercase tracking-[0.15em] text-[#AAA49C] font-semibold">{label}</p>
      <p className="text-2xl md:text-3xl font-black mt-1 leading-none" style={{ color }}>{value}</p>
      {sub && <p className="text-[11px] text-[#6B6560] mt-1.5">{sub}</p>}
    </div>
  );
}