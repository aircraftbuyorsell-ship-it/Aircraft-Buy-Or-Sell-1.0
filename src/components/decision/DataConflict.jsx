/**
 * DataConflict — the conflict card (master spec §33).
 *
 * ABOS does not silently choose a winner. It shows both values, the gap, the
 * likely reason and what would settle it.
 */

import React from "react";
import { TriangleAlert, ArrowRight } from "lucide-react";
import { conflictSeverity } from "@/intelligence";
import { SourceBadge } from "./TrustPrimitives";

const SEVERITY_STYLE = {
  high: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30",
  medium: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
  low: "border-black/10 bg-[#F7F4EF] dark:border-white/10 dark:bg-white/5",
};

const SEVERITY_LABEL = {
  high: "Material",
  medium: "Worth resolving",
  low: "Minor",
};

export function DataConflictCard({ conflict, className = "" }) {
  if (!conflict) return null;
  const severity = conflict.severity || conflictSeverity(conflict);

  return (
    <div className={`rounded-xl border p-4 ${SEVERITY_STYLE[severity] || SEVERITY_STYLE.low} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <TriangleAlert className={`h-4 w-4 ${severity === "high" ? "text-red-600" : severity === "medium" ? "text-amber-600" : "text-[#6B6560]"}`} strokeWidth={2.5} />
          <span className="text-sm font-black uppercase tracking-wide text-[#1A1814] dark:text-white">
            Conflict detected
          </span>
        </div>
        <span className="rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6B6560] dark:border-white/10 dark:bg-white/10 dark:text-white/60">
          {SEVERITY_LABEL[severity] || severity}
        </span>
      </div>

      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6560] dark:text-white/50">
        {conflict.label}
      </p>

      <div className="mt-3 space-y-2">
        {conflict.values.map((v, i) => (
          <div key={`${v.provider_id}-${i}`} className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2 dark:bg-white/5">
            <SourceBadge source={{ providerId: v.provider_id, providerName: v.provider, sourceDate: v.source_date }} />
            <span className="text-sm font-bold tabular-nums text-[#1A1814] dark:text-white">
              {formatConflictValue(v.value, conflict.unit)}
            </span>
          </div>
        ))}
      </div>

      {conflict.difference_display ? (
        <p className="mt-3 text-xs font-semibold text-[#1A1814] dark:text-white/80">
          Difference: <span className="tabular-nums">{conflict.difference_display}</span>
        </p>
      ) : null}

      <dl className="mt-3 space-y-2 text-xs">
        <div>
          <dt className="font-bold uppercase tracking-wider text-[#AAA49C]">Likely reason</dt>
          <dd className="text-[#6B6560] dark:text-white/70">{conflict.likely_reason}</dd>
        </div>
        <div>
          <dt className="font-bold uppercase tracking-wider text-[#AAA49C]">Required action</dt>
          <dd className="flex items-start gap-1.5 font-semibold text-[#1A1814] dark:text-white/90">
            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0" />
            {conflict.required_action}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function DataConflictList({ conflicts = [], emptyMessage = "No disagreements between the sources consulted.", className = "" }) {
  if (!conflicts.length) {
    return (
      <p className={`text-sm text-[#6B6560] dark:text-white/60 ${className}`}>{emptyMessage}</p>
    );
  }
  return (
    <div className={`space-y-3 ${className}`}>
      {conflicts.map((c, i) => <DataConflictCard key={`${c.field}-${i}`} conflict={c} />)}
    </div>
  );
}

function formatConflictValue(value, unit) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}${unit ? ` ${unit}` : ""}`;
  }
  return String(value);
}

export default DataConflictCard;
