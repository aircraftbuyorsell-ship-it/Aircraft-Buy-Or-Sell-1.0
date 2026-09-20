/**
 * ASSESS — posouzení hodnoty a ceny (master spec §2, §23).
 *
 * Shows every valuation opinion separately, the ABOS synthesized range, where
 * the asking price sits against it, and — critically — which condition factors
 * the model could NOT account for.
 *
 * This is not a certified appraisal and is never described as a znalecký posudek.
 */

import React, { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { assess, sectionFields, SECTION_LABEL } from "@/intelligence";
import DecisionShell, { EmptyPrompt } from "@/components/decision/DecisionShell";
import useAircraftIntelligence from "@/components/decision/useAircraftIntelligence";
import ValuationBand, { ValuationLadder, AdjustmentTable, AssessConfidence } from "@/components/decision/ValuationBand";
import { DataConflictList } from "@/components/decision/DataConflict";
import { DataField, GapNotice } from "@/components/decision/TrustPrimitives";
import ProvenanceDrawer, { useProvenance } from "@/components/decision/ProvenanceDrawer";

const SPEC_SECTIONS = ["airframe", "engine", "avionics", "configuration"];

export default function AssessPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const registration = searchParams.get("registration") || "";

  const { aircraft, loading, error, progress } = useAircraftIntelligence(registration, { policy: "assess" });
  const { openFor, drawerProps } = useProvenance();

  const result = useMemo(() => (aircraft ? assess(aircraft) : null), [aircraft]);

  const onSearch = (value) => {
    const next = new URLSearchParams(searchParams);
    next.set("registration", value);
    setSearchParams(next);
  };

  return (
    <DecisionShell
      stage="assess"
      registration={registration}
      onSearch={onSearch}
      loading={loading}
      progress={progress}
    >
      {!registration ? (
        <EmptyPrompt
          title="Assess a specific aircraft"
          body="Enter a registration. Assess combines market comparables, configuration, age, hours, engine status and valuation sources into a transparent price assessment — and shows which inputs are missing."
        />
      ) : null}

      {registration && loading && !result ? (
        <EmptyPrompt title="Building the assessment" body="Consulting registry, market and valuation sources." />
      ) : null}

      {error && !result ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-base font-bold text-[#1A1814] dark:text-white">Could not complete the assessment</h2>
          <p className="mt-2 text-sm text-[#6B6560] dark:text-white/60">{error}</p>
        </div>
      ) : null}

      {result ? (
        <div className="space-y-6">
          <header className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <h2 className="text-lg font-black text-[#1A1814] dark:text-white">{result.subject}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6B6560] dark:text-white/70">{result.conclusion}</p>
            {result.caveats?.length ? (
              <ul className="mt-3 space-y-1">
                {result.caveats.map((c, i) => (
                  <li key={i} className="text-xs text-[#6B6560] dark:text-white/50">— {c}</li>
                ))}
              </ul>
            ) : null}
          </header>

          <ValuationBand assessment={result} />

          <section>
            <h3 className="mb-3 text-sm font-black uppercase tracking-[0.12em] text-[#1A1814] dark:text-white">
              Every figure, and where it came from
            </h3>
            <ValuationLadder assessment={result} />
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <AdjustmentTable assessment={result} />
            <div className="space-y-4">
              <AssessConfidence assessment={result} />
              {aircraft?.conflicts?.length ? (
                <DataConflictList conflicts={aircraft.conflicts} />
              ) : null}
            </div>
          </div>

          <section className="grid gap-4 md:grid-cols-2">
            {SPEC_SECTIONS.map((section) => {
              const fields = sectionFields(aircraft, section).filter((f) => f.point);
              if (!fields.length) return null;
              return (
                <div key={section} className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6560] dark:text-white/50">
                    {SECTION_LABEL[section]}
                  </h3>
                  <div className="mt-1 divide-y divide-black/5 dark:divide-white/10">
                    {fields.map((f) => (
                      <DataField key={f.key} point={f.point} label={f.label} size="sm" onExplain={openFor} />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>

          <GapNotice gaps={aircraft?.gaps || []} />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <div>
              <p className="text-sm font-bold text-[#1A1814] dark:text-white">Know what you are committing to</p>
              <p className="mt-0.5 text-sm text-[#6B6560] dark:text-white/60">
                Commit models CAPEX, operating cost, reserves and a 36-month maintenance calendar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/commit?registration=${encodeURIComponent(registration)}`)}
              className="shrink-0 rounded-xl bg-[#1A1814] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black"
            >
              Run Commit
            </button>
          </div>

          <p className="text-xs leading-relaxed text-[#AAA49C] dark:text-white/40">{result.disclaimer}</p>
        </div>
      ) : null}

      <ProvenanceDrawer {...drawerProps} />
    </DecisionShell>
  );
}
