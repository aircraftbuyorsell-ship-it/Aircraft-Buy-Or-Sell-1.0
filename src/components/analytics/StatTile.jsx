export default function StatTile({ label, value, sub, accent = "#0B2D5B" }) {
  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-5">
      <p className="text-[10px] uppercase tracking-[0.15em] text-[#6B6560] font-bold">{label}</p>
      <p className="text-2xl md:text-3xl font-black mt-1" style={{ color: accent }}>
        {value ?? "—"}
      </p>
      {sub && <p className="text-[11px] text-[#6B6560] mt-1">{sub}</p>}
    </div>
  );
}