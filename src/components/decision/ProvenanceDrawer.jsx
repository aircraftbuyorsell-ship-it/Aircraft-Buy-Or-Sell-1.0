/**
 * ProvenanceDrawer — the "Why do you say this?" panel (master spec §8).
 *
 * This is the single biggest ABOS differentiator: any number on the platform
 * can be opened up to show value, source, source date, ABOS status, what it
 * was cross-checked against, whether anything conflicts, and confidence.
 */

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { explain } from "@/intelligence";
import { StatusPill, SourceBadge, ConfidenceBadge, DataClassChip, formatDate } from "./TrustPrimitives";

function Row({ label, children }) {
  return (
    <div className="border-b border-black/5 py-3 last:border-0 dark:border-white/10">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#AAA49C] dark:text-white/40">{label}</p>
      <div className="mt-1 text-sm text-[#1A1814] dark:text-white/90">{children}</div>
    </div>
  );
}

export default function ProvenanceDrawer({ open, onOpenChange, point, fieldLabel }) {
  const detail = explain(point, { fieldLabel });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-left text-base font-black uppercase tracking-wide">
            {detail.field || "Data point"}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          <div className="rounded-xl border border-black/10 bg-[#F7F4EF] p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#AAA49C]">Value</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-[#1A1814] dark:text-white">{detail.display}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {point ? <StatusPill status={point.status} /> : null}
              {point ? <DataClassChip dataClass={point.dataClass} /> : null}
            </div>
          </div>

          <div className="mt-2">
            <Row label="Source">
              {detail.sources?.length ? (
                <div className="space-y-2">
                  {detail.sources.map((s, i) => (
                    <div key={`${s.providerId}-${i}`} className="flex items-center justify-between gap-3">
                      <SourceBadge source={s} />
                      <span className="text-xs text-[#6B6560] dark:text-white/50">
                        {s.sourceDate ? `as of ${formatDate(s.sourceDate)}` : `retrieved ${formatDate(s.retrievedAt)}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[#6B6560] dark:text-white/50">No source returned this value.</span>
              )}
            </Row>

            <Row label="Source date">
              {detail.sourceDate ? formatDate(detail.sourceDate) : "Not stated by the source"}
            </Row>

            <Row label="ABOS status">{detail.abosStatus}</Row>

            <Row label="Cross-checked">
              {detail.crossChecked || "Not cross-checked against a second source."}
            </Row>

            <Row label="Conflict">
              {detail.conflict ? (
                <div className="space-y-2">
                  <p className="font-semibold text-red-700 dark:text-red-300">Conflict detected</p>
                  <ul className="space-y-1">
                    {detail.conflict.values.map((v, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-[#6B6560] dark:text-white/60">{v.provider}</span>
                        <span className="font-bold tabular-nums">{String(v.value)}</span>
                      </li>
                    ))}
                  </ul>
                  {detail.conflict.difference_display ? (
                    <p className="text-xs text-[#6B6560] dark:text-white/50">
                      Difference: {detail.conflict.difference_display}
                    </p>
                  ) : null}
                  <p className="text-xs text-[#6B6560] dark:text-white/60">
                    <span className="font-semibold">Likely reason: </span>{detail.conflict.likely_reason}
                  </p>
                  <p className="text-xs text-[#6B6560] dark:text-white/60">
                    <span className="font-semibold">Required action: </span>{detail.conflict.required_action}
                  </p>
                </div>
              ) : (
                "None"
              )}
            </Row>

            <Row label="Confidence">
              {point ? <ConfidenceBadge confidence={point.confidence} band={point.confidenceBand} showBar /> : detail.confidence}
            </Row>

            {detail.calculation ? (
              <Row label="Calculation">
                <span className="text-[#6B6560] dark:text-white/70">{detail.calculation}</span>
              </Row>
            ) : null}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-[#AAA49C] dark:text-white/40">
            ABOS shows where every figure came from. Where a value is missing, that means no
            source consulted supplied it — it is not a statement about the aircraft.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Convenience hook: wires a DataField's onExplain to this drawer. */
export function useProvenance() {
  const [state, setState] = React.useState({ open: false, point: null, label: null });
  const openFor = React.useCallback((point, label) => setState({ open: true, point, label }), []);
  const onOpenChange = React.useCallback((open) => setState((s) => ({ ...s, open })), []);
  return {
    openFor,
    drawerProps: { open: state.open, onOpenChange, point: state.point, fieldLabel: state.label },
  };
}
