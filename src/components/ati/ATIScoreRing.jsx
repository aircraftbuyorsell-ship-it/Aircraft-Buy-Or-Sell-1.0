const SIZE = 180;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

function ringColor(score) {
  if (score >= 80) return "#34d399"; // emerald
  if (score >= 65) return "#f59e0b"; // amber
  return "#f87171"; // red
}

function label(score) {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
}

export default function ATIScoreRing({ score }) {
  const pct = Math.min(100, Math.max(0, score || 0));
  const dash = (pct / 100) * CIRC;
  const color = ringColor(pct);

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-6 flex flex-col items-center justify-center gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">ATI Total Score</p>
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          {/* Track */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke="#1e293b" strokeWidth={STROKE}
          />
          {/* Progress */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke={color} strokeWidth={STROKE}
            strokeDasharray={`${dash} ${CIRC}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black text-white">{pct}</span>
          <span className="text-xs text-slate-400 mt-1">/ 100</span>
        </div>
      </div>
      <span
        className="text-sm font-semibold px-3 py-1 rounded-full"
        style={{ background: `${color}20`, color }}
      >
        {label(pct)}
      </span>
    </div>
  );
}