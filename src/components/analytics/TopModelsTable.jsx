const AMBER = "#f5c242";
const TEAL = "#5dcaa5";
const RED = "#e24b4a";
const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const W3 = "rgba(255,255,255,0.35)";
const BORDER = "rgba(255,255,255,0.08)";

/**
 * TopModelsTable — Legal Ink style.
 */
export default function TopModelsTable({ rows, isDark }) {
  const fmtPrice = (v) => v == null ? "—" : `$${(v / 1000).toFixed(0)}k`;

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: "rgba(255,255,255,0.04)",
      border: `0.5px solid ${BORDER}`,
    }}>
      <div className="px-5 py-4" style={{ borderBottom: `0.5px solid ${BORDER}` }}>
        <p className="text-[10px] uppercase tracking-[0.15em] font-black" style={{ color: AMBER }}>Inventory Leaders</p>
        <h3 className="text-base font-black uppercase tracking-tight" style={{ color: W1 }}>Top Models by Listings</h3>
      </div>
      <div style={{ borderBottom: `0.5px solid ${BORDER}` }}>
        <div className="hidden md:grid grid-cols-[1fr_80px_100px_80px] gap-3 px-5 py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
          <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: W3 }}>Model</p>
          <p className="text-[9px] uppercase tracking-wider font-bold text-right" style={{ color: W3 }}>Listings</p>
          <p className="text-[9px] uppercase tracking-wider font-bold text-right" style={{ color: W3 }}>Avg Price</p>
          <p className="text-[9px] uppercase tracking-wider font-bold text-right" style={{ color: W3 }}>Avg ATI</p>
        </div>
      </div>
      <div>
        {rows.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: W3 }}>No data yet</p>
        ) : rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_100px_80px] gap-3 px-5 py-3 items-center"
            style={{ borderBottom: i < rows.length - 1 ? `0.5px solid ${BORDER}` : "none" }}>
            <p className="text-sm font-bold truncate" style={{ color: W1 }}>{r.model}</p>
            <p className="text-sm font-black text-right" style={{ color: AMBER }}>{r.count}</p>
            <p className="text-sm text-right" style={{ color: W1 }}>{fmtPrice(r.avgPrice)}</p>
            <p className="text-sm text-right">
              {r.avgAti != null ? (
                <span className="font-black" style={{ color: r.avgAti >= 85 ? TEAL : r.avgAti >= 65 ? AMBER : RED }}>
                  {r.avgAti}
                </span>
              ) : <span style={{ color: W3 }}>—</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}