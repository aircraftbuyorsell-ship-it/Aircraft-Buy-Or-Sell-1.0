/**
 * ScoreDonut — the circular score gauge used for ATI and the report scores.
 *
 * Colour follows the band, and the band follows transparency, not quality.
 * A low ATI is drawn in a neutral tone rather than red, because "we cannot
 * see enough" is not a failing grade for the aircraft.
 */

import React from "react";

export const BAND_COLOR = {
  excellent: "#0F7A56",
  good: "#0F7A56",
  moderate: "#D4A017",
  limited: "#AAA49C",
};

/** Result-style colours, for verdicts and report scores where green is earned. */
export const RESULT_COLOR = {
  positive: "#0F7A56",
  attention: "#D4A017",
  risk: "#C0392B",
  neutral: "#AAA49C",
};

export default function ScoreDonut({
  score,
  max = 120,
  label = null,
  sublabel = null,
  color = null,
  size = 112,
  strokeWidth = 10,
  className = "",
}) {
  const safeScore = Number.isFinite(Number(score)) ? Number(score) : 0;
  const pct = max > 0 ? Math.max(0, Math.min(1, safeScore / max)) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * pct;
  const stroke = color || BAND_COLOR.moderate;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${safeScore} out of ${max}`}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" strokeWidth={strokeWidth}
            className="stroke-[#F0EBE3] dark:stroke-white/10"
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={stroke} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circumference - arc}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-black tabular-nums leading-none text-[#1A1814] dark:text-white"
            style={{ fontSize: size * 0.28 }}
          >
            {Math.round(safeScore)}
          </span>
          <span className="mt-0.5 text-[10px] font-bold tabular-nums text-[#AAA49C]">/{max}</span>
        </div>
      </div>

      {label ? (
        <span className="mt-2 text-xs font-bold uppercase tracking-wider" style={{ color: stroke }}>
          {label}
        </span>
      ) : null}
      {sublabel ? (
        <span className="mt-0.5 text-center text-[11px] text-[#6B6560] dark:text-white/50">{sublabel}</span>
      ) : null}
    </div>
  );
}

/** A single labelled score bar — the ATI dimension rows and report findings. */
export function ScoreBar({
  label, score, max = 15, color = null, onClick = null, detail = null, className = "",
}) {
  const safeScore = Number.isFinite(Number(score)) ? Number(score) : 0;
  const pct = max > 0 ? Math.max(0, Math.min(100, (safeScore / max) * 100)) : 0;
  const stroke = color || (pct >= 70 ? BAND_COLOR.good : pct >= 45 ? BAND_COLOR.moderate : BAND_COLOR.limited);
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      {...(onClick ? { type: "button", onClick } : {})}
      className={`block w-full text-left ${onClick ? "group cursor-pointer" : ""} ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className={`min-w-0 flex-1 truncate text-xs ${onClick ? "group-hover:text-[#1A1814] dark:group-hover:text-white" : ""} text-[#6B6560] dark:text-white/60`}>
          {label}
        </span>
        <span className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-[#F0EBE3] sm:w-28 dark:bg-white/10">
          <span className="block h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: stroke }} />
        </span>
        <span className="w-8 shrink-0 text-right text-xs font-bold tabular-nums text-[#1A1814] dark:text-white">
          {Math.round(safeScore)}
        </span>
      </div>
      {detail ? <p className="mt-1 text-[11px] text-[#AAA49C]">{detail}</p> : null}
    </Wrapper>
  );
}

/** Horizontal range bar with a marker — market position on the report. */
export function RangeBar({ low, high, marker = null, lowLabel, highLabel, markerLabel, className = "" }) {
  if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low) return null;
  const pos = (v) => `${Math.max(0, Math.min(100, ((v - low) / (high - low)) * 100))}%`;

  return (
    <div className={className}>
      <div className="relative h-2 rounded-full bg-gradient-to-r from-[#F0EBE3] via-[#D4A017]/35 to-[#F0EBE3] dark:from-white/10 dark:via-[#D4A017]/30 dark:to-white/10">
        {Number.isFinite(marker) ? (
          <div className="absolute -top-1 h-4 w-[2px] rounded bg-[#1A1814] dark:bg-white" style={{ left: pos(marker) }} />
        ) : null}
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold tabular-nums text-[#AAA49C]">
        <span>{lowLabel}</span>
        {markerLabel ? <span className="text-[#1A1814] dark:text-white">{markerLabel}</span> : null}
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
