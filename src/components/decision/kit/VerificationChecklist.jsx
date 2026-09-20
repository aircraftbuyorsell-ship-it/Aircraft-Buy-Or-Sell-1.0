/**
 * VerificationChecklist — the numbered verification steps from the mockups.
 *
 * Each row carries the step, its state, the SOURCE that produced it and WHEN.
 * A row without a source is not a verification; it is a claim. The component
 * enforces that by rendering the attribution slot whether or not it is filled.
 *
 * Rows are never coloured red for missing data. "Insufficient data" is a
 * neutral state that means a further check is needed (§9).
 */

import React from "react";
import {
  CircleCheck, Loader2, Circle, TriangleAlert, ChevronRight, Info,
} from "lucide-react";
import { KNOWLEDGE_CAVEAT, STEP_STATE } from "@/intelligence";

// Re-exported so a screen can import the states alongside the component.
export { STEP_STATE };

const STATE_STYLE = {
  [STEP_STATE.VERIFIED]: {
    label: "Verified",
    Icon: CircleCheck,
    iconTone: "text-emerald-600",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  [STEP_STATE.COMPLETED]: {
    label: "Completed",
    Icon: CircleCheck,
    iconTone: "text-emerald-600",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  [STEP_STATE.IN_PROGRESS]: {
    label: "In progress",
    Icon: Loader2,
    iconTone: "text-[#D4A017] animate-spin",
    chip: "border-[#D4A017]/30 bg-[#D4A017]/10 text-[#8b6a20] dark:border-[#D4A017]/30 dark:text-[#E8C46A]",
  },
  [STEP_STATE.REVIEW]: {
    label: "Review",
    Icon: TriangleAlert,
    iconTone: "text-[#D4A017]",
    chip: "border-[#D4A017]/30 bg-[#D4A017]/10 text-[#8b6a20] dark:border-[#D4A017]/30 dark:text-[#E8C46A]",
  },
  [STEP_STATE.INSUFFICIENT]: {
    label: "Insufficient data",
    Icon: Circle,
    iconTone: "text-[#AAA49C]",
    chip: "border-black/10 bg-white text-[#6B6560] dark:border-white/10 dark:bg-white/5 dark:text-white/50",
  },
  [STEP_STATE.NOT_STARTED]: {
    label: "Not started",
    Icon: Circle,
    iconTone: "text-[#D9D4CC]",
    chip: "border-black/10 bg-white text-[#AAA49C] dark:border-white/10 dark:bg-white/5 dark:text-white/40",
  },
};

export default function VerificationChecklist({
  title,
  subtitle = null,
  steps = [],
  numbered = false,
  showProgress = true,
  onSelect = null,
  footer = null,
  className = "",
}) {
  const done = steps.filter((s) => [STEP_STATE.VERIFIED, STEP_STATE.COMPLETED].includes(s.state)).length;
  const pct = steps.length ? (done / steps.length) * 100 : 0;

  return (
    <section className={`overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5 ${className}`}>
      <div className="border-b border-black/5 p-4 dark:border-white/10 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-black uppercase tracking-[0.08em] text-[#1A1814] dark:text-white">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-sm text-[#6B6560] dark:text-white/60">{subtitle}</p> : null}
          </div>
          {showProgress && steps.length ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tabular-nums text-[#6B6560] dark:text-white/60">
                {done} / {steps.length} complete
              </span>
              <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[#F0EBE3] dark:bg-white/10">
                <span className="block h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${pct}%` }} />
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <ul className="divide-y divide-black/5 dark:divide-white/10">
        {steps.map((step, index) => {
          const style = STATE_STYLE[step.state] || STATE_STYLE[STEP_STATE.NOT_STARTED];
          const { Icon } = style;
          const clickable = Boolean(onSelect);

          return (
            <li key={step.key || index}>
              <div
                {...(clickable ? { role: "button", tabIndex: 0, onClick: () => onSelect(step), onKeyDown: (e) => { if (e.key === "Enter") onSelect(step); } } : {})}
                className={`flex items-start gap-3 p-4 md:px-5 ${clickable ? "cursor-pointer transition hover:bg-[#F7F4EF] dark:hover:bg-white/5" : ""}`}
              >
                <span className="mt-0.5 shrink-0">
                  <Icon className={`h-5 w-5 ${style.iconTone}`} strokeWidth={2.2} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#1A1814] dark:text-white">
                    {numbered ? <span className="text-[#AAA49C]">{index + 1}. </span> : null}
                    {step.label}
                  </p>
                  {step.description ? (
                    <p className="mt-0.5 text-sm text-[#6B6560] dark:text-white/55">{step.description}</p>
                  ) : null}

                  {/* Attribution slot — always rendered, so a missing source is visible */}
                  <p className="mt-1 text-[11px] text-[#AAA49C]">
                    {step.source
                      ? <>Source: <span className="font-semibold text-[#6B6560] dark:text-white/60">{step.source}</span>{step.at ? ` · ${step.at}` : ""}</>
                      : "No source attributed yet."}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.chip}`}>
                    {step.stateLabel || style.label}
                  </span>
                  {step.result ? (
                    <span className="max-w-[10rem] text-right text-[11px] text-[#6B6560] dark:text-white/55">{step.result}</span>
                  ) : null}
                  {Number.isFinite(step.score) ? (
                    <span className="text-sm font-black tabular-nums text-[#1A1814] dark:text-white">
                      {step.score}<span className="text-[10px] text-[#AAA49C]">/{step.scoreMax || 100}</span>
                    </span>
                  ) : null}
                  {clickable ? <ChevronRight className="h-4 w-4 text-[#D9D4CC]" /> : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-black/5 bg-[#F7F4EF] p-4 dark:border-white/10 dark:bg-white/5 md:px-5">
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-[#6B6560] dark:text-white/50">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          {KNOWLEDGE_CAVEAT}
        </p>
        {footer}
      </div>
    </section>
  );
}

/** The big coloured result banner above a checklist. */
export function ResultBanner({
  tone = "positive", eyebrow, title, body = null, score = null, scoreMax = 100, scoreLabel = null, className = "",
}) {
  const style = {
    positive: {
      panel: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30",
      accent: "text-emerald-700 dark:text-emerald-300",
      Icon: CircleCheck,
    },
    attention: {
      panel: "border-[#D4A017]/30 bg-[#D4A017]/10 dark:border-[#D4A017]/30 dark:bg-[#D4A017]/10",
      accent: "text-[#8b6a20] dark:text-[#E8C46A]",
      Icon: TriangleAlert,
    },
    neutral: {
      panel: "border-black/10 bg-[#F7F4EF] dark:border-white/10 dark:bg-white/5",
      accent: "text-[#6B6560] dark:text-white/60",
      Icon: Info,
    },
  }[tone] || {};
  const { Icon } = style;

  return (
    <div className={`flex flex-wrap items-start justify-between gap-4 rounded-2xl border p-4 md:p-5 ${style.panel} ${className}`}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.accent}`} strokeWidth={2.5} /> : null}
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#AAA49C]">{eyebrow}</p>
          ) : null}
          <p className={`mt-0.5 text-base font-black ${style.accent}`}>{title}</p>
          {body ? <p className="mt-1 text-sm text-[#6B6560] dark:text-white/60">{body}</p> : null}
        </div>
      </div>

      {Number.isFinite(score) ? (
        <div className="shrink-0 text-right">
          {scoreLabel ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#AAA49C]">{scoreLabel}</p>
          ) : null}
          <p className="text-2xl font-black tabular-nums text-[#1A1814] dark:text-white">
            {score}<span className="text-sm text-[#AAA49C]">/{scoreMax}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
