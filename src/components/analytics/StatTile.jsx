/**
 * StatTile — Core Platform dark tile.
 * #111827 card, no glassmorphism, gold eyebrow, accent value.
 */
export default function StatTile({ label, value, sub, accent = "#D4A017", isDark = false }) {
  if (!isDark) {
    return (
      <div className="rounded-2xl p-5" style={{
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}>
        <p className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: "#6B6560" }}>{label}</p>
        <p className="text-2xl md:text-3xl font-black mt-1" style={{ color: accent }}>
          {value ?? "—"}
        </p>
        {sub && <p className="text-[11px] mt-1" style={{ color: "#6B6560" }}>{sub}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5" style={{
      background: "#111827",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
    }}>
      <p className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
      <p className="text-2xl md:text-3xl font-black mt-1" style={{ color: accent }}>
        {value ?? "—"}
      </p>
      {sub && <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.40)" }}>{sub}</p>}
    </div>
  );
}