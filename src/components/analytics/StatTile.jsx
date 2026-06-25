/**
 * StatTile — Legal Ink style.
 * Translucent card, white text scale, accent value.
 */
export default function StatTile({ label, value, sub, accent = "#f5c242", isDark }) {
  return (
    <div className="rounded-2xl p-5" style={{
      background: "rgba(255,255,255,0.04)",
      border: "0.5px solid rgba(255,255,255,0.08)",
    }}>
      <p className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
      <p className="text-2xl md:text-3xl font-black mt-1" style={{ color: accent }}>
        {value ?? "—"}
      </p>
      {sub && <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.60)" }}>{sub}</p>}
    </div>
  );
}