/**
 * ATIWidget — the Aircraft Transparency Index panel (master spec §25).
 *
 * Every dimension is clickable and opens "Why this score?" with evidence,
 * sources, what is missing and how to improve it. A score that cannot explain
 * itself has no business being on the page.
 *
 * The widget always carries what ATI actually measures, because a bare number
 * out of 120 invites exactly the wrong reading.
 */

import React from "react";
import { Info, X, ArrowUpRight } from "lucide-react";
import { explainDimension } from "@/intelligence";
import ScoreDonut, { ScoreBar, BAND_COLOR } from "./ScoreDonut";
import { StatusPill } from "../TrustPrimitives";

export default function ATIWidget({ ati, compact = false, onOpenReport = null, className = "" }) {
  const [openKey, setOpenKey] = React.useState(null);
  if (!ati) return null;

  const color = BAND_COLOR[ati.band] || BAND_COLOR.moderate;
  const detail = openKey ? explainDimension(ati, openKey) : null;

  return (
    <div className={`rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5 ${className}`}>
      <div className="flex items-start gap-4 p-4 md:p-5">
        <ScoreDonut
          score={ati.score}
          max={ati.max}
          color={color}
          size={compact ? 92 : 112}
          label={compact ? null : ati.band_label?.split(" ")[0]}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-black uppercase tracking-[0.1em] text-[#1A1814] dark:text-white">
              ATI
            </h3>
            <span className="text-xs text-[#6B6560] dark:text-white/50">Aircraft Transparency Index</span>
          </div>
          <p className="mt-0.5 text-sm font-bold" style={{ color }}>{ati.band_label}</p>

          <div className="mt-3 space-y-1.5">
            {(ati.dimensions || []).slice(0, compact ? 4 : 8).map((d) => (
              <ScoreBar
                key={d.key}
                label={d.label}
                score={d.score}
                max={d.max}
                onClick={() => setOpenKey(d.key)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-black/5 px-4 py-3 dark:border-white/10 md:px-5">
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-[#6B6560] dark:text-white/50">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          {ati.meaning}
        </p>
        {onOpenReport ? (
          <button
            type="button"
            onClick={onOpenReport}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#8b6a20] underline-offset-2 hover:underline dark:text-[#D4A017]"
          >
            View full ATI report <ArrowUpRight className="h-3 w-3" />
          </button>
        ) : null}
      </div>

      {detail ? (
        <DimensionExplainer detail={detail} onClose={() => setOpenKey(null)} />
      ) : null}
    </div>
  );
}

/** "Why this score? Evidence / Sources / Missing information / How to improve" */
function DimensionExplainer({ detail, onClose }) {
  return (
    <div className="border-t border-black/10 bg-[#F7F4EF] p-4 dark:border-white/10 dark:bg-white/5 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#AAA49C]">Why this score?</p>
          <h4 className="mt-0.5 text-sm font-black text-[#1A1814] dark:text-white">
            {detail.label} — <span className="tabular-nums">{detail.score}</span>
            <span className="text-[#AAA49C]">/{detail.max}</span>
          </h4>
        </div>
        <button
          type="button" onClick={onClose}
          className="rounded-lg p-1 text-[#AAA49C] hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-2 text-sm text-[#6B6560] dark:text-white/70">{detail.why}</p>

      {detail.evidence?.length ? (
        <section className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#AAA49C]">Evidence</p>
          <ul className="mt-1.5 space-y-1.5">
            {detail.evidence.map((e) => (
              <li key={e.key} className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-[#1A1814] dark:text-white/85">
                  <span className="font-semibold">{e.label}:</span> {e.display}
                </span>
                <StatusPill status={e.status} withIcon={false} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {detail.sources?.length ? (
        <section className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#AAA49C]">Sources</p>
          <p className="mt-1 text-sm text-[#6B6560] dark:text-white/60">{detail.sources.join(", ")}</p>
        </section>
      ) : null}

      {detail.missing?.length ? (
        <section className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#AAA49C]">Missing information</p>
          <ul className="mt-1.5 space-y-1">
            {detail.missing.map((m) => (
              <li key={m.key} className="text-sm text-[#6B6560] dark:text-white/60">{m.label}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {detail.how_to_improve?.length ? (
        <section className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#AAA49C]">How to improve</p>
          <ul className="mt-1.5 space-y-1.5">
            {detail.how_to_improve.map((h, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm font-medium text-[#1A1814] dark:text-white/85">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#D4A017]" />
                {h}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/** Compact inline ATI chip for listing cards and table rows. */
export function ATIChip({ ati, className = "" }) {
  if (!ati) return null;
  const color = BAND_COLOR[ati.band] || BAND_COLOR.moderate;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold ${className}`}
      style={{ borderColor: `${color}40`, backgroundColor: `${color}12`, color }}
      title={ati.meaning}
    >
      ATI <span className="tabular-nums">{ati.score}</span>
      <span className="opacity-60">/{ati.max}</span>
    </span>
  );
}
