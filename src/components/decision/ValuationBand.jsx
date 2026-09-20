/**
 * ValuationBand — the price-position visual (master spec §11, §23).
 *
 * Shows the asking price against the ABOS synthesized range, and lists every
 * valuation opinion separately. The rule: never hide which number came from
 * which source.
 */

import React from "react";
import { getProvider } from "@/intelligence";
import { DataClassChip, ConfidenceBadge } from "./TrustPrimitives";
import { DATA_CLASS } from "@/intelligence";

function money(n, currency = "EUR") {
  if (!Number.isFinite(n)) return "—";
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : "";
  return `${symbol}${Math.round(n).toLocaleString("en-US")}`;
}

export function ValuationBand({ assessment, className = "" }) {
  const { synthesized, asking, currency = "EUR", position } = assessment || {};
  const low = synthesized?.low;
  const high = synthesized?.high;
  const mid = synthesized?.midpoint;

  if (!low || !high) {
    return (
      <div className={`rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/5 ${className}`}>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6560]">ABOS modelled range</p>
        <p className="mt-2 text-sm text-[#6B6560] dark:text-white/60">
          {synthesized?.method || "No valuation input was available for this aircraft."}
        </p>
      </div>
    );
  }

  // Plot window: the band plus headroom for an asking price outside it.
  const points = [low, high, asking].filter(Number.isFinite);
  const min = Math.min(...points) * 0.94;
  const max = Math.max(...points) * 1.06;
  const pos = (v) => `${((v - min) / (max - min)) * 100}%`;

  return (
    <div className={`rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6560]">ABOS synthesized range</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-[#1A1814] dark:text-white">
            {money(low, currency)} – {money(high, currency)}
          </p>
        </div>
        <DataClassChip dataClass={DATA_CLASS.ABOS_CALCULATION} />
      </div>

      {/* Band */}
      <div className="relative mt-8 mb-10 h-2 rounded-full bg-[#F0EBE3] dark:bg-white/10">
        <div
          className="absolute h-2 rounded-full bg-[#D4A017]/35"
          style={{ left: pos(low), width: `calc(${pos(high)} - ${pos(low)})` }}
        />
        {Number.isFinite(mid) ? (
          <div className="absolute -top-1 h-4 w-[2px] bg-[#8b6a20]" style={{ left: pos(mid) }} title="Modelled midpoint" />
        ) : null}

        {Number.isFinite(asking) ? (
          <div className="absolute -top-7" style={{ left: pos(asking), transform: "translateX(-50%)" }}>
            <div className="whitespace-nowrap rounded-md bg-[#1A1814] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Asking {money(asking, currency)}
            </div>
            <div className="mx-auto h-3 w-[2px] bg-[#1A1814]" />
          </div>
        ) : null}

        <span className="absolute -bottom-6 text-[10px] font-semibold tabular-nums text-[#AAA49C]" style={{ left: pos(low), transform: "translateX(-50%)" }}>
          {money(low, currency)}
        </span>
        <span className="absolute -bottom-6 text-[10px] font-semibold tabular-nums text-[#AAA49C]" style={{ left: pos(high), transform: "translateX(-50%)" }}>
          {money(high, currency)}
        </span>
      </div>

      {position ? (
        <div className="rounded-lg border border-black/5 bg-[#F7F4EF] px-3 py-2 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#1A1814] dark:text-white/80">{position.label}</p>
          <p className="mt-0.5 text-sm text-[#6B6560] dark:text-white/60">{position.detail}</p>
        </div>
      ) : null}

      {synthesized?.method ? (
        <details className="mt-3 group">
          <summary className="cursor-pointer list-none text-[11px] font-bold uppercase tracking-wider text-[#8b6a20] underline-offset-2 hover:underline dark:text-[#D4A017]">
            Show calculation
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-[#6B6560] dark:text-white/60">{synthesized.method}</p>
        </details>
      ) : null}
    </div>
  );
}

/** The ladder of opinions — ABOS model, third parties, market, side by side. */
export function ValuationLadder({ assessment, className = "" }) {
  const { valuations = [], market_median: median, asking, synthesized, currency = "EUR", comparable_count: comps } = assessment || {};

  const rows = [
    ...valuations.map((v) => ({
      label: v.label,
      value: v.value,
      kind: v.kind === "abos_model" ? DATA_CLASS.ABOS_CALCULATION : DATA_CLASS.THIRD_PARTY_VALUATION,
      note: v.as_of ? `as of ${String(v.as_of).slice(0, 10)}` : null,
      confidence: v.confidence,
    })),
    Number.isFinite(median) ? {
      label: "Market median",
      value: median,
      kind: DATA_CLASS.OBSERVED,
      note: Number.isFinite(comps) ? `${comps} comparables` : null,
    } : null,
    Number.isFinite(asking) ? {
      label: "Asking price",
      value: asking,
      kind: DATA_CLASS.OBSERVED,
      note: "as listed",
    } : null,
  ].filter(Boolean);

  if (!rows.length) {
    return <p className={`text-sm text-[#6B6560] ${className}`}>No valuation figures are available for this aircraft yet.</p>;
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-black/10 dark:border-white/10 ${className}`}>
      {rows.map((row, i) => (
        <div key={`${row.label}-${i}`} className="flex items-center justify-between gap-3 border-b border-black/5 bg-white px-4 py-3 last:border-0 dark:border-white/10 dark:bg-white/5">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#1A1814] dark:text-white">{row.label}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <DataClassChip dataClass={row.kind} />
              {row.note ? <span className="text-[10px] uppercase tracking-wider text-[#AAA49C]">{row.note}</span> : null}
            </div>
          </div>
          <span className="shrink-0 text-base font-black tabular-nums text-[#1A1814] dark:text-white">
            {money(row.value, currency)}
          </span>
        </div>
      ))}

      {synthesized?.low && synthesized?.high ? (
        <div className="flex items-center justify-between gap-3 bg-[#1A1814] px-4 py-3 text-white">
          <div>
            <p className="text-sm font-bold">ABOS synthesized range</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/50">derived from the rows above</p>
          </div>
          <span className="shrink-0 text-base font-black tabular-nums">
            {money(synthesized.low, currency)} – {money(synthesized.high, currency)}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/** Which condition factors the model could and could not account for. */
export function AdjustmentTable({ assessment, className = "" }) {
  const rows = assessment?.adjustments || [];
  if (!rows.length) return null;

  return (
    <div className={`rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5 ${className}`}>
      <div className="border-b border-black/5 px-4 py-3 dark:border-white/10">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6560]">What the model could account for</p>
      </div>
      <ul>
        {rows.map((row) => (
          <li key={row.key} className="flex items-start justify-between gap-3 border-b border-black/5 px-4 py-3 last:border-0 dark:border-white/10">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1A1814] dark:text-white">{row.label}</p>
              <p className="mt-0.5 text-xs text-[#6B6560] dark:text-white/55">{row.note}</p>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              row.known
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-black/10 bg-white text-[#AAA49C] dark:border-white/10 dark:bg-white/5 dark:text-white/40"
            }`}>
              {row.known ? "Accounted" : `±${row.max_swing_pct}% unknown`}
            </span>
          </li>
        ))}
      </ul>
      {assessment?.unexplained_swing_pct ? (
        <div className="border-t border-black/5 px-4 py-3 dark:border-white/10">
          <p className="text-xs text-[#6B6560] dark:text-white/60">
            Unknown factors could move this value by up to about{" "}
            <span className="font-bold text-[#1A1814] dark:text-white">±{assessment.unexplained_swing_pct}%</span>.
            Closing them narrows the range.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function AssessConfidence({ assessment, className = "" }) {
  const parts = assessment?.confidence_parts || {};
  return (
    <div className={`rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6560]">Assessment confidence</p>
        <ConfidenceBadge confidence={assessment?.confidence} showBar />
      </div>
      <ul className="mt-3 space-y-2">
        {[
          ["Valuation inputs", parts.valuation_inputs],
          ["Market data", parts.market_data],
          ["Aircraft specifics", parts.aircraft_specifics],
        ].map(([label, v]) => (
          <li key={label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-[#6B6560] dark:text-white/60">{label}</span>
            <ConfidenceBadge confidence={v} showBar />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ValuationBand;
export { getProvider };
