const GOLD = "#D4A017";

/**
 * TopModelsTable — Core Platform dark table card.
 * #111827 surface, gold eyebrow, clean rows.
 */
export default function TopModelsTable({ rows, isDark = false }) {
  const fmtPrice = (v) => v == null ? "—" : `$${(v / 1000).toFixed(0)}k`;

  const textColor = isDark ? "#ffffff" : "#1A1814";
  const mutedColor = isDark ? "rgba(255,255,255,0.40)" : "#6B6560";
  const accentNum = isDark ? GOLD : "#0B2D5B";
  const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const headerBg = isDark ? "rgba(255,255,255,0.03)" : "#F7F4EF";

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: isDark ? "#111827" : "#ffffff",
      border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
      boxShadow: isDark ? "0 1px 2px rgba(0,0,0,0.2)" : "0 1px 2px rgba(0,0,0,0.04)",
    }}>
      <div className="px-5 py-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
        <p className="text-[10px] uppercase tracking-[0.15em] font-black" style={{ color: GOLD }}>Inventory Leaders</p>
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
                <span className="font-black" style={{ color: r.avgAti >= 85 ? "#10b981" : r.avgAti >= 65 ? GOLD : "#ef4444" }}>
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