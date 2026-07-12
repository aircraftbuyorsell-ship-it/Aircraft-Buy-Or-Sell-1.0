import { useMemo } from "react";

const BUCKETS = [
  { min: 1, max: 2 }, { min: 2, max: 3 }, { min: 3, max: 4 },
  { min: 4, max: 5 }, { min: 5, max: 6 }, { min: 6, max: 7 },
  { min: 7, max: 8 }, { min: 8, max: 9 }, { min: 9, max: 10 },
];

const HEIGHT = 40;

export default function ScoreHistogram({ deals, minScore }) {
  const counts = useMemo(() => {
    const buckets = BUCKETS.map((b) => ({ ...b, count: 0 }));
    for (const d of deals) {
      const score = d.deal_score;
      if (score == null) continue;
      const idx = Math.min(Math.floor(score) - 1, BUCKETS.length - 1);
      if (idx >= 0) buckets[idx].count++;
    }
    return buckets;
  }, [deals]);

  const maxCount = Math.max(1, ...counts.map((b) => b.count));
  const barWidth = 100 / BUCKETS.length;

  return (
    <div className="mb-3">
      <svg
        width="100%"
        height={HEIGHT}
        viewBox={`0 0 100 ${HEIGHT}`}
        preserveAspectRatio="none"
        className="block"
      >
        {counts.map((b, i) => {
          const barHeight = (b.count / maxCount) * (HEIGHT - 2);
          const isActive = b.min >= minScore;
          return (
            <rect
              key={i}
              x={i * barWidth}
              y={HEIGHT - barHeight}
              width={barWidth}
              height={Math.max(barHeight, 0.5)}
              fill={isActive ? "#D4A017" : "rgba(255,255,255,0.12)"}
              style={{ transition: "fill 0.2s ease" }}
            />
          );
        })}
      </svg>
    </div>
  );
}