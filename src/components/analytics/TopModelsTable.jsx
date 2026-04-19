export default function TopModelsTable({ rows }) {
  const fmtPrice = (v) => v == null ? "—" : `$${(v / 1000).toFixed(0)}k`;
  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-black/[0.06]">
        <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#E8A83A]">Inventory Leaders</p>
        <h3 className="text-base font-black text-[#1A1814] uppercase tracking-tight">Top Models by Listings</h3>
      </div>
      <div className="divide-y divide-black/[0.05]">
        <div className="hidden md:grid grid-cols-[1fr_80px_100px_80px] gap-3 px-5 py-2 bg-[#F7F4EF]">
          <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-bold">Model</p>
          <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-bold text-right">Listings</p>
          <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-bold text-right">Avg Price</p>
          <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-bold text-right">Avg ATI</p>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-[#AAA49C] text-center py-10">No data yet</p>
        ) : rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_100px_80px] gap-3 px-5 py-3 items-center">
            <p className="text-sm font-bold text-[#1A1814] truncate">{r.model}</p>
            <p className="text-sm font-black text-[#0B2D5B] text-right">{r.count}</p>
            <p className="text-sm text-[#1A1814] text-right">{fmtPrice(r.avgPrice)}</p>
            <p className="text-sm text-right">
              {r.avgAti != null ? (
                <span className={`font-black ${r.avgAti >= 85 ? "text-[#0F7A56]" : r.avgAti >= 65 ? "text-[#E8A83A]" : "text-[#C0392B]"}`}>
                  {r.avgAti}
                </span>
              ) : <span className="text-[#AAA49C]">—</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}