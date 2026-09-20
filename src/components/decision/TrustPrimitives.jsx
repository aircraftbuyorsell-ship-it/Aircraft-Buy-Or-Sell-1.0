/**
 * ABOS trust-model UI primitives (master spec §8, §9, §50, §56, §57).
 *
 * These are the components that make ABOS feel like an intelligence platform
 * rather than a listing portal. Every one of them can render all seven states:
 * loading, available, verified, unverified, conflicting, unavailable, error.
 *
 * Non-negotiable: an empty state is never drawn as a zero, and "unavailable"
 * is never coloured as risk. Red is reserved for an actual conflict or a
 * real finding.
 */

import React from "react";
import {
  ShieldCheck, CircleCheck, CircleHelp, TriangleAlert, Minus, Info, Loader2,
} from "lucide-react";
import {
  DATA_STATUS, STATUS_LABEL, CONFIDENCE_LABEL, DATA_CLASS, DATA_CLASS_LABEL,
  hasValue, formatValue,
} from "@/intelligence";
import { getProvider } from "@/intelligence";

/* ------------------------------------------------------------------ tokens */

const STATUS_STYLE = {
  [DATA_STATUS.VERIFIED]: {
    icon: ShieldCheck,
    chip: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
    dot: "bg-emerald-600",
  },
  [DATA_STATUS.SUPPORTED]: {
    icon: CircleCheck,
    chip: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
    dot: "bg-slate-500",
  },
  [DATA_STATUS.UNVERIFIED]: {
    icon: CircleHelp,
    chip: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
    dot: "bg-amber-500",
  },
  [DATA_STATUS.CONFLICTING]: {
    icon: TriangleAlert,
    chip: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
    dot: "bg-red-600",
  },
  [DATA_STATUS.UNAVAILABLE]: {
    // Deliberately neutral. No data is not bad news.
    icon: Minus,
    chip: "bg-white text-[#6B6560] border-black/10 dark:bg-white/5 dark:text-white/50 dark:border-white/10",
    dot: "bg-[#AAA49C]",
  },
  [DATA_STATUS.NOT_APPLICABLE]: {
    icon: Minus,
    chip: "bg-white text-[#AAA49C] border-black/5 dark:bg-white/5 dark:text-white/35 dark:border-white/10",
    dot: "bg-[#D9D4CC]",
  },
};

function styleFor(status) {
  return STATUS_STYLE[status] || STATUS_STYLE[DATA_STATUS.UNAVAILABLE];
}

/* ------------------------------------------------------------ StatusPill */

export function StatusPill({ status, className = "", withIcon = true, label = null }) {
  const s = styleFor(status);
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${s.chip} ${className}`}>
      {withIcon ? <Icon className="w-3 h-3" strokeWidth={2.5} /> : null}
      {label || STATUS_LABEL[status] || status}
    </span>
  );
}

/* ------------------------------------------------------------ SourceBadge */

/** One provider attribution. Shows the public label only — never a price. */
export function SourceBadge({ source: src, className = "" }) {
  if (!src) return null;
  const provider = getProvider(src.providerId);
  const label = provider?.public_label || src.providerName || src.providerId;
  return (
    <span
      title={src.sourceDate ? `${label} · as of ${formatDate(src.sourceDate)}` : label}
      className={`inline-flex items-center gap-1 rounded border border-black/10 bg-[#F7F4EF] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#6B6560] dark:border-white/10 dark:bg-white/5 dark:text-white/60 ${className}`}
    >
      {label}
    </span>
  );
}

export function SourceBadgeRow({ sources = [], max = 3, className = "" }) {
  if (!sources.length) return null;
  const shown = sources.slice(0, max);
  const rest = sources.length - shown.length;
  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      {shown.map((s, i) => <SourceBadge key={`${s.providerId}-${i}`} source={s} />)}
      {rest > 0 ? (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#AAA49C]">+{rest}</span>
      ) : null}
    </span>
  );
}

/* -------------------------------------------------------- ConfidenceBadge */

export function ConfidenceBadge({ confidence, band = null, showBar = false, className = "" }) {
  const pct = Math.round((Number(confidence) || 0) * 100);
  const resolvedBand = band || (pct >= 80 ? "high" : pct >= 55 ? "medium" : pct > 0 ? "low" : "none");
  const tone = resolvedBand === "high" ? "text-emerald-700 dark:text-emerald-300"
    : resolvedBand === "medium" ? "text-amber-700 dark:text-amber-300"
      : resolvedBand === "low" ? "text-[#6B6560] dark:text-white/60"
        : "text-[#AAA49C] dark:text-white/40";
  const bar = resolvedBand === "high" ? "bg-emerald-600"
    : resolvedBand === "medium" ? "bg-amber-500"
      : resolvedBand === "low" ? "bg-[#AAA49C]"
        : "bg-[#D9D4CC]";

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`text-[11px] font-bold uppercase tracking-wider ${tone}`}>
        {CONFIDENCE_LABEL[resolvedBand] || resolvedBand}
        {pct > 0 ? ` · ${pct}%` : ""}
      </span>
      {showBar ? (
        <span className="h-1 w-16 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <span className={`block h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
        </span>
      ) : null}
    </span>
  );
}

/* -------------------------------------------------------------- DataField */

/**
 * The workhorse. Renders one canonical data point with its value, status,
 * sources and a "Why do you say this?" affordance.
 *
 * Props: point (canonical data point), label, loading, error, size, className,
 * and onExplain — called with (point, label) to open the ProvenanceDrawer.
 */
export function DataField({
  point, label, loading = false, error = false, onExplain = null,
  size = "md", className = "",
}) {
  const heading = label || point?.label || "—";

  if (loading) {
    return (
      <div className={`py-2 ${className}`}>
        <FieldLabel>{heading}</FieldLabel>
        <div className="mt-1 flex items-center gap-2 text-[#AAA49C]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="text-sm">Checking sources…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`py-2 ${className}`}>
        <FieldLabel>{heading}</FieldLabel>
        <div className="mt-1 text-sm text-[#6B6560] dark:text-white/60">
          Source could not be reached. Nothing is implied about the aircraft.
        </div>
      </div>
    );
  }

  const status = point?.status || DATA_STATUS.UNAVAILABLE;
  const present = hasValue(point);
  const valueSize = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";

  return (
    <div className={`py-2 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <FieldLabel>{heading}</FieldLabel>
        <StatusPill status={status} withIcon={false} className="shrink-0" />
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        {present ? (
          <span className={`${valueSize} font-bold tabular-nums text-[#1A1814] dark:text-white`}>
            {formatValue(point)}
          </span>
        ) : (
          <span className="text-sm text-[#AAA49C] dark:text-white/40">
            {status === DATA_STATUS.NOT_APPLICABLE ? "Not applicable to this aircraft" : "No data available"}
          </span>
        )}

        {point?.sources?.length ? <SourceBadgeRow sources={point.sources} /> : null}

        {onExplain ? (
          <button
            type="button"
            onClick={() => onExplain(point, heading)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#8b6a20] underline-offset-2 hover:underline dark:text-[#D4A017]"
          >
            <Info className="w-3 h-3" />
            Why do you say this?
          </button>
        ) : null}
      </div>

      {!present && point?.calculation ? (
        <p className="mt-1 text-xs text-[#6B6560] dark:text-white/50">{point.calculation}</p>
      ) : null}

      {point?.conflict ? (
        <p className="mt-1 text-xs font-medium text-red-700 dark:text-red-300">
          Sources disagree — {point.conflict.likely_reason}
        </p>
      ) : null}
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6560] dark:text-white/50">
      {children}
    </span>
  );
}

/* ---------------------------------------------------------- DataClassChip */

/** Observed vs derived vs third-party vs ABOS calculation (§8). */
export function DataClassChip({ dataClass, className = "" }) {
  if (!dataClass || dataClass === DATA_CLASS.MISSING) return null;
  const tone = dataClass === DATA_CLASS.OBSERVED
    ? "border-black/10 bg-white text-[#1A1814] dark:border-white/10 dark:bg-white/5 dark:text-white/80"
    : dataClass === DATA_CLASS.THIRD_PARTY_VALUATION
      ? "border-[#0A3C75]/20 bg-[#0A3C75]/5 text-[#0A3C75] dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300"
      : "border-[#D4A017]/30 bg-[#D4A017]/10 text-[#8b6a20] dark:border-[#D4A017]/40 dark:bg-[#D4A017]/10 dark:text-[#E8C46A]";
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone} ${className}`}>
      {DATA_CLASS_LABEL[dataClass]}
    </span>
  );
}

/* ------------------------------------------------------------- helpers */

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 10);
}

export function GapNotice({ gaps = [], className = "" }) {
  if (!gaps.length) return null;
  return (
    <div className={`rounded-xl border border-black/10 bg-[#F7F4EF] p-4 dark:border-white/10 dark:bg-white/5 ${className}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6560] dark:text-white/50">
        What ABOS could not establish
      </p>
      <p className="mt-1 text-xs text-[#6B6560] dark:text-white/60">
        These are gaps in the data available, not findings against the aircraft.
      </p>
      <ul className="mt-3 space-y-2">
        {gaps.map((gap) => (
          <li key={gap.field || gap.key} className="text-sm">
            <span className="font-semibold text-[#1A1814] dark:text-white">{gap.label}</span>
            {gap.how_to_close ? (
              <span className="text-[#6B6560] dark:text-white/60"> — {gap.how_to_close}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
