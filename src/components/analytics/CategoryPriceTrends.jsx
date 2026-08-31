import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const fmt = (v) => (v == null ? "—" : `$${(v / 1000).toFixed(0)}k`);
const AMBER = "#f5c242";
const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const W3 = "rgba(255,255,255,0.35)";
const CARD = "rgba(255,255,255,0.04)";
const BORDER = "rgba(255,255,255,0.08)";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const rows = payload
    .filter((p) => p.value != null)
    .sort((a, b) => (b.value || 0) - (a.value || 0));
  return (
    <div
      style={{
        background: "rgba(13,17,23,0.98)",
        border: "0.5px solid rgba(245,194,66,0.22)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 11,
        minWidth: 150,
      }}
    >
      <p style={{ fontWeight: 900, color: AMBER, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</p>
      {rows.map((p) => (
        <p key={p.name} style={{ color: p.color, marginTop: 4 }}>
          {p.name}: <strong>{fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

export default function CategoryPriceTrends({ categoryTrends }) {
  if (!categoryTrends || !categoryTrends.length) {
    return (
      <div className="rounded-2xl p-5" style={{ background: CARD, border: `0.5px solid ${BORDER}` }}>
        <p className="text-[10px] uppercase tracking-[0.15em] font-black" style={{ color: AMBER }}>Category Trends</p>
        <h3 className="text-base font-black uppercase tracking-tight mt-1" style={{ color: W1 }}>Price Trends by Aircraft Category</h3>
        <p className="text-xs mt-4" style={{ color: W3 }}>No category pricing data yet.</p>
      </div>
    );
  }

  // Pivot: one row per month, one column per category.
  const months = categoryTrends[0].data.map((d) => d.month);
  const rows = months.map((m, i) => {
    const row = { month: m };
    categoryTrends.forEach((c) => {
      row[c.category] = c.data[i].avgPrice;
    });
    return row;
  });

  return (
    <div className="rounded-2xl p-5" style={{ background: CARD, border: `0.5px solid ${BORDER}` }}>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-black" style={{ color: AMBER }}>Category Trends</p>
          <h3 className="text-base font-black uppercase tracking-tight" style={{ color: W1 }}>Price Trends by Aircraft Category</h3>
          <p className="text-[11px] mt-1" style={{ color: W2 }}>12-month average asking price across popular categories</p>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {categoryTrends.map((c) => (
            <span key={c.category} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: W2 }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
              {c.category}
            </span>
          ))}
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: W3 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: W3 }} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<CustomTooltip />} />
            {categoryTrends.map((c) => (
              <Line key={c.category} type="monotone" dataKey={c.category} stroke={c.color} strokeWidth={2} dot={false} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}