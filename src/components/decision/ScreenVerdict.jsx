/**
 * ScreenVerdict — GO / INVESTIGATE / STOP (master spec §1).
 *
 * The verdict is triage, not judgement. The disclaimer is part of the
 * component, not an optional extra a page can forget to render.
 */

import React from "react";
import { CircleCheck, CircleHelp, OctagonAlert, Minus, TriangleAlert } from "lucide-react";
import { VERDICT, CHECK_STATE } from "@/intelligence";
import { ConfidenceBadge } from "./TrustPrimitives";

const VERDICT_STYLE = {
  [VERDICT.GO]: {
    icon: CircleCheck,
    band: "bg-emerald-600",
    text: "text-emerald-700 dark:text-emerald-300",
    panel: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30",
  },
  [VERDICT.INVESTIGATE]: {
    icon: CircleHelp,
    band: "bg-[#D4A017]",
    text: "text-[#8b6a20] dark:text-[#E8C46A]",
    panel: "border-[#D4A017]/30 bg-[#D4A017]/10 dark:border-[#D4A017]/30 dark:bg-[#D4A017]/10",
  },
  [VERDICT.STOP]: {
    icon: OctagonAlert,
    band: "bg-red-600",
    text: "text-red-700 dark:text-red-300",
    panel: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30",
  },
};

const CHECK_ICON = {
  [CHECK_STATE.PASS]: { Icon: CircleCheck, tone: "text-emerald-600" },
  [CHECK_STATE.ATTENTION]: { Icon: TriangleAlert, tone: "text-amber-600" },
  [CHECK_STATE.RISK]: { Icon: OctagonAlert, tone: "text-red-600" },
  [CHECK_STATE.UNKNOWN]: { Icon: Minus, tone: "text-[#AAA49C]" },
};

export default function ScreenVerdict({ result, onContinue = null, className = "" }) {
  if (!result) return null;
  const style = VERDICT_STYLE[result.verdict] || VERDICT_STYLE[VERDICT.INVESTIGATE];
  const Icon = style.icon;

  return (
    <div className={`overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5 ${className}`}>
      <div className={`h-1.5 w-full ${style.band}`} />

      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className={`flex items-center gap-2 ${style.text}`}>
              <Icon className="h-5 w-5" strokeWidth={2.5} />
              <span className="text-xl font-black uppercase tracking-[0.1em]">{result.verdict}</span>
            </div>
            <h2 className="mt-2 text-lg font-bold text-[#1A1814] dark:text-white">{result.headline}</h2>
            <p className="mt-1 text-sm text-[#6B6560] dark:text-white/60">{result.meaning}</p>
          </div>
          <ConfidenceBadge confidence={result.confidence} showBar />
        </div>

        {result.reasons?.length ? (
          <div className={`mt-5 rounded-xl border p-4 ${style.panel}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6560] dark:text-white/50">
              What drove this
            </p>
            <ul className="mt-2 space-y-1.5">
              {result.reasons.map((reason, i) => (
                <li key={i} className="text-sm text-[#1A1814] dark:text-white/85">{reason}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {result.checks?.length ? (
          <ul className="mt-5 divide-y divide-black/5 dark:divide-white/10">
            {result.checks.map((check) => {
              const { Icon: CheckIcon, tone } = CHECK_ICON[check.state] || CHECK_ICON[CHECK_STATE.UNKNOWN];
              return (
                <li key={check.id} className="flex items-start gap-3 py-3">
                  <CheckIcon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} strokeWidth={2.5} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1A1814] dark:text-white">{check.label}</p>
                    <p className="mt-0.5 text-sm text-[#6B6560] dark:text-white/60">{check.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}

        {result.missing?.length ? (
          <div className="mt-5 rounded-xl border border-black/10 bg-[#F7F4EF] p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6560] dark:text-white/50">
              Not established
            </p>
            <p className="mt-1 text-xs text-[#6B6560] dark:text-white/50">
              No source consulted returned these. That is a gap in the data, not a finding.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.missing.map((m) => (
                <span key={m.key} className="rounded border border-black/10 bg-white px-2 py-0.5 text-[11px] font-medium text-[#6B6560] dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#1A1814] dark:text-white/85">{result.next_step}</p>
          {onContinue && result.verdict !== VERDICT.STOP ? (
            <button
              type="button"
              onClick={onContinue}
              className="rounded-xl bg-[#1A1814] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black"
            >
              Run Assess
            </button>
          ) : null}
        </div>

        <p className="mt-5 border-t border-black/5 pt-4 text-xs leading-relaxed text-[#AAA49C] dark:border-white/10 dark:text-white/40">
          {result.disclaimer}
        </p>
      </div>
    </div>
  );
}

/** Which sources were consulted, and which could not be reached. */
export function SourcesConsulted({ sources = [], className = "" }) {
  if (!sources.length) return null;
  return (
    <div className={`rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5 ${className}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6560] dark:text-white/50">
        Sources consulted
      </p>
      <ul className="mt-2 space-y-1.5">
        {sources.map((s, i) => (
          <li key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-[#1A1814] dark:text-white/85">{s.provider}</span>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              !s.success ? "text-[#AAA49C]" : s.matched ? "text-emerald-700 dark:text-emerald-300" : "text-[#6B6560] dark:text-white/50"
            }`}>
              {!s.success ? "Unavailable" : s.matched ? "Matched" : "No record"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-[#AAA49C] dark:text-white/40">
        &ldquo;No record&rdquo; means this source held nothing for this aircraft. It does not mean the aircraft has no such record.
      </p>
    </div>
  );
}
