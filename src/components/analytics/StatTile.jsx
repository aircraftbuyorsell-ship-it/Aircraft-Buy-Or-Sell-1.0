export default function StatTile({ label, value, sub, accent = "#0B2D5B", isDark = false }) {
  const bg = isDark
    ? "linear-gradient(150deg, rgba(120,160,190,0.12) 0%, rgba(25,45,75,0.55) 60%)"
    : "rgba(255,255,255,0.90)";
  const border = isDark ? "1px solid rgba(150,200,225,0.20)" : "1px solid rgba(0,0,0,0.07)";
  const labelColor = isDark ? "rgba(255,255,255,0.40)" : "#6B6560";
  const subColor = isDark ? "rgba(255,255,255,0.35)" : "#6B6560";

  return (
    <div className="rounded-2xl p-5" style={{
      background: bg,
      backdropFilter: isDark ? "blur(24px) saturate(160%)" : undefined,
      WebkitBackdropFilter: isDark ? "blur(24px) saturate(160%)" : undefined,
      border,
      boxShadow: isDark
        ? "0 8px 24px rgba(0,0,0,0.35), inset 0 1px 1px rgba(220,250,255,0.25)"
        : "0 2px 12px rgba(0,0,0,0.04)",
    }}>
      <p className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: labelColor }}>{label}</p>
      <p className="text-2xl md:text-3xl font-black mt-1" style={{ color: accent }}>
        {value ?? "—"}
      </p>
      {sub && <p className="text-[11px] mt-1" style={{ color: subColor }}>{sub}</p>}
    </div>
  );
}