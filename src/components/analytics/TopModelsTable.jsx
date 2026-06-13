export default function TopModelsTable({ rows, isDark = false }) {
  const fmtPrice = (v) => v == null ? "—" : `$${(v / 1000).toFixed(0)}k`;

  const textColor = isDark ? "#ffffff" : "#1A1814";
  const mutedColor = isDark ? "rgba(255,255,255,0.35)" : "#AAA49C";
  const accentLabel = isDark ? "#00f5ff" : "#E8A83A";
  const accentNum = isDark ? "#00f5ff" : "#0B2D5B";
  const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const headerBg = isDark ? "rgba(255,255,255,0.04)" : "#F7F4EF";

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: isDark
        ? "linear-gradient(150deg, rgba(110,140,175,0.12) 0%, rgba(25,45,75,0.55) 60%)"
        : "rgba(255,255,255,0.90)",
      backdropFilter: isDark ? "blur(24px) saturate(160%)" : undefined,
      WebkitBackdropFilter: isDark ? "blur(24px) saturate(160%)" : undefined,
      border: isDark ? "1px solid rgba(150,200,225,0.20)" : "1px solid rgba(0,0,0,0.07)",
      boxShadow: isDark ? "0 16px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(220,250,255,0.20)" : "0 2px 12px rgba(0,0,0,0.04)",
    }}>
      <div className="px-5 py-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
        <p className="text-[10px] uppercase tracking-[0.15em] font-black" style={{ color: accentLabel }}>Inventory Leaders</p>
        <h3 className="text-base font-black uppercase tracking-tight" style={{ color: textColor }}>Top Models by Listings</h3>
      </div>
      <div style={{ borderBottom: `1px solid ${borderColor}` }}>
        <div className="hidden md:grid grid-cols-[1fr_80px_100px_80px] gap-3 px-5 py-2" style={{ background: headerBg }}>
          <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: mutedColor }}>Model</p>
          <p className="text-[9px] uppercase tracking-wider font-bold text-right" style={{ color: mutedColor }}>Listings</p>
          <p className="text-[9px] uppercase tracking-wider font-bold text-right" style={{ color: mutedColor }}>Avg Price</p>
          <p className="text-[9px] uppercase tracking-wider font-bold text-right" style={{ color: mutedColor }}>Avg ATI</p>
        </div>
      </div>
      <div>
        {rows.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: mutedColor }}>No data yet</p>
        ) : rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_100px_80px] gap-3 px-5 py-3 items-center"
            style={{ borderBottom: i < rows.length - 1 ? `1px solid ${borderColor}` : "none" }}>
            <p className="text-sm font-bold truncate" style={{ color: textColor }}>{r.model}</p>
            <p className="text-sm font-black text-right" style={{ color: accentNum }}>{r.count}</p>
            <p className="text-sm text-right" style={{ color: textColor }}>{fmtPrice(r.avgPrice)}</p>
            <p className="text-sm text-right">
              {r.avgAti != null ? (
                <span className="font-black" style={{ color: r.avgAti >= 85 ? "#0F7A56" : r.avgAti >= 65 ? "#E8A83A" : "#C0392B" }}>
                  {r.avgAti}
                </span>
              ) : <span style={{ color: mutedColor }}>—</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}