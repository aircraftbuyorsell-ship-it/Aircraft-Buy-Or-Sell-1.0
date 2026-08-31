import { gcrColor } from "./ComplianceBadge";

const SIZE = 140;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export default function GCRScoreGauge({ score }) {
  if (score == null) return null;
  const pct = Math.min(100, Math.max(0, score));
  const dash = (pct / 100) * CIRC;
  const color = gcrColor(score);
  const label = pct >= 75 ? "Compliant" : pct >= 40 ? "Caution" : "Non-Compliant";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeDasharray={`${dash} ${CIRC}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black" style={{ color }}>
            {pct}
          </span>
          <span className="text-[10px] text-[rgba(255,255,255,0.35)] font-semibold mt-0.5">/ 100</span>
        </div>
      </div>
      <span
        className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border"
        style={{
          color,
          background: `${color}10`,
          borderColor: `${color}40`,
        }}
      >
        {label}
      </span>
    </div>
  );
}