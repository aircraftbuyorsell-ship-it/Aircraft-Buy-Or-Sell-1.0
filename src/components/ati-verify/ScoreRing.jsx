export default function ScoreRing({ label, score, color, size = "md" }) {
  if (score == null) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative" style={{ width: size === "lg" ? 72 : 60, height: size === "lg" ? 72 : 60 }}>
          <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
            <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/20 text-sm font-black">—</span>
          </div>
        </div>
      </div>
    );
  }

  const r = size === "lg" ? 30 : 24;
  const svgSize = size === "lg" ? 72 : 60;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const fontSize = size === "lg" ? "text-lg" : "text-sm";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="w-full h-full -rotate-90">
          <circle cx={svgSize / 2} cy={svgSize / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle cx={svgSize / 2} cy={svgSize / 2} r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${fontSize} font-black text-white`} style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider text-center">{label}</span>
    </div>
  );
}