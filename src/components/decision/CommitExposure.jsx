/**
 * Commit UI (master spec §26, §27).
 *
 * Deliberately reads differently from Assess: Assess answers "is the price
 * defensible?", Commit answers "what am I exposed to after I own it?".
 *
 * Every figure is labelled Modelled / Indicative / Assumption / Sourced, and
 * the unknowns get their own panel rather than being quietly excluded.
 */

import React from "react";
import { CalendarClock, Wrench, Info } from "lucide-react";
import { CONFIDENCE_KIND } from "@/intelligence";

function money(n, currency = "EUR") {
  if (!Number.isFinite(n)) return "—";
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : "";
  return `${symbol}${Math.round(n).toLocaleString("en-US")}`;
}

const KIND_LABEL = {
  [CONFIDENCE_KIND.MODELLED]: "Modelled",
  [CONFIDENCE_KIND.INDICATIVE]: "Indicative",
  [CONFIDENCE_KIND.ASSUMPTION]: "Assumption",
  [CONFIDENCE_KIND.SOURCED]: "From source",
};

function KindChip({ kind }) {
  if (!kind) return null;
  const tone = kind === CONFIDENCE_KIND.SOURCED
    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
    : kind === CONFIDENCE_KIND.ASSUMPTION
      ? "border-black/10 bg-white text-[#AAA49C] dark:border-white/10 dark:bg-white/5 dark:text-white/40"
      : "border-[#D4A017]/30 bg-[#D4A017]/10 text-[#8b6a20] dark:border-[#D4A017]/30 dark:text-[#E8C46A]";
  return (
    <span className={`inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}>
      {KIND_LABEL[kind] || kind}
    </span>
  );
}

/* ------------------------------------------------------------- headline */

export function ExposureHeadline({ result, className = "" }) {
  if (!result) return null;
  const c = result.currency;
  const rows = [
    ["Purchase", result.purchase],
    ["Known CAPEX", result.capex?.known_total],
    [`${result.assumptions?.hold_years || 3}-year projected maintenance`, result.projected_36m_maintenance],
    ["Annual operating estimate", result.opex?.annual_total],
    ["Reserve requirement", result.reserves?.per_hour, "/h"],
  ];

  return (
    <div className={`overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5 ${className}`}>
      <div className="border-b border-black/5 bg-[#1A1814] px-5 py-4 text-white dark:border-white/10">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">Your exposure after acquisition</p>
        <p className="mt-1 text-3xl font-black tabular-nums">{money(result.total_modelled_exposure, c)}</p>
        <p className="mt-1 text-xs text-white/50">
          Purchase + known CAPEX + {result.assumptions?.hold_years || 3} year(s) of operating cost, modelled.
        </p>
      </div>

      <dl className="divide-y divide-black/5 dark:divide-white/10">
        {rows.map(([label, v, suffix]) => (
          <div key={label} className="flex items-center justify-between gap-3 px-5 py-3">
            <dt className="text-sm text-[#6B6560] dark:text-white/60">{label}</dt>
            <dd className="text-sm font-bold tabular-nums text-[#1A1814] dark:text-white">
              {money(v, c)}{suffix || ""}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------- CAPEX/OPEX */

export function ExposureList({ title, items = [], currency = "EUR", emptyLabel = "Nothing modelled.", className = "" }) {
  if (!items.length) return <p className={`text-sm text-[#6B6560] ${className}`}>{emptyLabel}</p>;
  return (
    <div className={`rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5 ${className}`}>
      <div className="border-b border-black/5 px-4 py-3 dark:border-white/10">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6560]">{title}</p>
      </div>
      <ul className="divide-y divide-black/5 dark:divide-white/10">
        {items.map((item) => (
          <li key={item.key} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1A1814] dark:text-white">
                  {item.label}
                  {item.optional ? <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-[#AAA49C]">optional</span> : null}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-[#6B6560] dark:text-white/55">{item.detail || item.basis}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold tabular-nums text-[#1A1814] dark:text-white">
                  {Number.isFinite(item.amount) ? money(item.amount, currency)
                    : Number.isFinite(item.full_cost) ? `up to ${money(item.full_cost, currency)}`
                      : "Not modelled"}
                </p>
                <div className="mt-1"><KindChip kind={item.kind} /></div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------------------------------- MRO calendar */

const WINDOWS = ["0–12 months", "12–24 months", "24–36 months"];

export function MaintenanceCalendar({ calendar = [], currency = "EUR", className = "" }) {
  const byWindow = WINDOWS.map((w) => ({
    window: w,
    events: calendar.filter((e) => e.window === w),
    total: calendar.filter((e) => e.window === w).reduce((s, e) => s + (e.estimated_cost || 0), 0),
  }));
  const max = Math.max(...byWindow.map((w) => w.total), 1);

  return (
    <div className={`rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5 ${className}`}>
      <div className="flex items-center gap-2 border-b border-black/5 px-4 py-3 dark:border-white/10">
        <CalendarClock className="h-4 w-4 text-[#8b6a20]" />
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6560]">Upcoming events</p>
      </div>

      <div className="space-y-4 p-4">
        {byWindow.map((w) => (
          <div key={w.window}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#1A1814] dark:text-white/80">{w.window}</p>
              <p className="text-sm font-bold tabular-nums text-[#1A1814] dark:text-white">
                {w.total ? money(w.total, currency) : "—"}
              </p>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#F0EBE3] dark:bg-white/10">
              <div className="h-full rounded-full bg-[#D4A017]" style={{ width: `${(w.total / max) * 100}%` }} />
            </div>
            {w.events.length ? (
              <ul className="mt-2 space-y-1.5">
                {w.events.map((e, i) => (
                  <li key={`${e.label}-${i}`} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm text-[#1A1814] dark:text-white/85">
                        <Wrench className="h-3 w-3 shrink-0 text-[#AAA49C]" />
                        {e.label}
                      </p>
                      {e.note ? <p className="mt-0.5 text-xs text-[#6B6560] dark:text-white/50">{e.note}</p> : null}
                    </div>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-[#6B6560] dark:text-white/60">
                      {Number.isFinite(e.estimated_cost) ? money(e.estimated_cost, currency) : "cost unknown"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-[#AAA49C]">No event modelled in this window.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------- ScenarioSelector */

export function ScenarioSelector({ scenarios = [], currency = "EUR", value, onChange, className = "" }) {
  const [internal, setInternal] = React.useState(scenarios[0]?.key || null);
  const active = value ?? internal;
  const select = (key) => { setInternal(key); if (onChange) onChange(key); };
  const selected = scenarios.find((s) => s.key === active) || scenarios[0];

  if (!scenarios.length) return null;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {scenarios.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => select(s.key)}
            className={`rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${
              s.key === active
                ? "border-[#1A1814] bg-[#1A1814] text-white"
                : "border-black/10 bg-white text-[#6B6560] hover:border-black/25 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {selected ? (
        <div className="mt-4 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <p className="text-sm text-[#6B6560] dark:text-white/60">{selected.description}</p>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            {[
              ["Capital in", selected.capital_in],
              ["Operating", selected.operating],
              ["Modelled exit", selected.modelled_exit],
              ["Net modelled", selected.net_modelled],
            ].map(([label, v]) => (
              <div key={label}>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-[#AAA49C]">{label}</dt>
                <dd className={`mt-0.5 text-base font-black tabular-nums ${
                  label === "Net modelled" && Number.isFinite(v)
                    ? (v >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300")
                    : "text-[#1A1814] dark:text-white"
                }`}>
                  {Number.isFinite(v) ? money(v, currency) : "—"}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 flex items-start gap-1.5 border-t border-black/5 pt-3 text-xs text-[#6B6560] dark:border-white/10 dark:text-white/50">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            {selected.note}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------- exposure meter */

export function ExposureMeter({ meter, className = "" }) {
  if (!meter) return null;
  return (
    <div className={`rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6560]">Maintenance exposure</p>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: meter.color }}>{meter.label}</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#F0EBE3] dark:bg-white/10">
        <div className="h-full rounded-full transition-all" style={{ width: `${meter.score}%`, backgroundColor: meter.color }} />
      </div>
      <p className="mt-2 text-xs text-[#6B6560] dark:text-white/55">
        Modelled from time remaining to overhaul, inspection status and projected events. Not a condition assessment.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- unknowns */

export function UnknownsPanel({ unknowns = [], className = "" }) {
  if (!unknowns.length) return null;
  return (
    <div className={`rounded-xl border border-black/10 bg-[#F7F4EF] p-4 dark:border-white/10 dark:bg-white/5 ${className}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6560] dark:text-white/50">
        What is not in this model
      </p>
      <ul className="mt-2 space-y-2">
        {unknowns.map((u) => (
          <li key={u.key} className="text-sm">
            <span className="font-semibold text-[#1A1814] dark:text-white">{u.label}</span>
            <span className="text-[#6B6560] dark:text-white/60"> — {u.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
