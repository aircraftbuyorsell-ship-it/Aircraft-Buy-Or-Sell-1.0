/**
 * COMMIT — rozvaha před závazkem (master spec §3, §26, §27).
 *
 * Commit is not another valuation. It answers what this specific aircraft will
 * expose you to financially after you buy it, with every figure labelled
 * Modelled / Indicative / Assumption / Sourced.
 */

import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { assess, commit } from "@/intelligence";
import DecisionShell, { EmptyPrompt } from "@/components/decision/DecisionShell";
import useAircraftIntelligence from "@/components/decision/useAircraftIntelligence";
import {
  ExposureHeadline, ExposureList, MaintenanceCalendar,
  ScenarioSelector, ExposureMeter, UnknownsPanel,
} from "@/components/decision/CommitExposure";
import { GapNotice } from "@/components/decision/TrustPrimitives";
import ProvenanceDrawer, { useProvenance } from "@/components/decision/ProvenanceDrawer";

export default function CommitPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const registration = searchParams.get("registration") || "";

  const { aircraft, loading, error, progress } = useAircraftIntelligence(registration, { policy: "commit" });
  const { drawerProps } = useProvenance();

  const [annualHours, setAnnualHours] = useState(120);
  const [holdYears, setHoldYears] = useState(3);

  const assessment = useMemo(() => (aircraft ? assess(aircraft) : null), [aircraft]);
  const result = useMemo(
    () => (aircraft && assessment ? commit(aircraft, assessment, { annualHours, holdYears }) : null),
    [aircraft, assessment, annualHours, holdYears],
  );

  const onSearch = (value) => {
    const next = new URLSearchParams(searchParams);
    next.set("registration", value);
    setSearchParams(next);
  };

  return (
    <DecisionShell
      stage="commit"
      registration={registration}
      onSearch={onSearch}
      loading={loading}
      progress={progress}
    >
      {!registration ? (
        <EmptyPrompt
          title="Model your exposure"
          body="Enter a registration. Commit models CAPEX, operating cost, reserves and a 36-month maintenance calendar, then runs four scenarios: keep, refurbish, resell, walk away."
        />
      ) : null}

      {registration && loading && !result ? (
        <EmptyPrompt title="Building the exposure model" body="Resolving the aircraft and consulting the sources this policy allows." />
      ) : null}

      {error && !result ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-base font-bold text-[#1A1814] dark:text-white">Could not build the model</h2>
          <p className="mt-2 text-sm text-[#6B6560] dark:text-white/60">{error}</p>
        </div>
      ) : null}

      {result ? (
        <div className="space-y-6">
          <p className="text-sm font-semibold text-[#1A1814] dark:text-white/85">{result.statement}</p>

          {/* Assumptions the user controls — stated, never hidden */}
          <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6560]">Your assumptions</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold text-[#1A1814] dark:text-white/80">
                  Annual hours: <span className="tabular-nums">{annualHours}</span>
                </span>
                <input
                  type="range" min="25" max="600" step="5"
                  value={annualHours}
                  onChange={(e) => setAnnualHours(Number(e.target.value))}
                  className="mt-2 w-full accent-[#D4A017]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-[#1A1814] dark:text-white/80">
                  Hold period: <span className="tabular-nums">{holdYears}</span> year(s)
                </span>
                <input
                  type="range" min="1" max="10" step="1"
                  value={holdYears}
                  onChange={(e) => setHoldYears(Number(e.target.value))}
                  className="mt-2 w-full accent-[#D4A017]"
                />
              </label>
            </div>
            <p className="mt-4 text-xs text-[#6B6560] dark:text-white/50">
              Modelled as a {result.assumptions.preset} class aircraft. Purchase price taken from the{" "}
              {result.assumptions.purchase_price_source}.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <ExposureHeadline result={result} />
            <div className="space-y-4">
              <ExposureMeter meter={result.exposure_meter} />
              <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B6560]">Reserves</p>
                <p className="mt-1 text-2xl font-black tabular-nums text-[#1A1814] dark:text-white">
                  €{result.reserves.per_hour}<span className="text-sm font-bold text-[#6B6560]">/h</span>
                </p>
                <ul className="mt-3 space-y-1.5">
                  {result.reserves.components.map((c) => (
                    <li key={c.label} className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-[#6B6560] dark:text-white/60">{c.label}</span>
                      <span className="text-sm font-bold tabular-nums text-[#1A1814] dark:text-white">€{c.per_hour}/h</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-[#AAA49C]">
                  {result.reserves.components.map((c) => c.basis).join(" · ")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ExposureList title="CAPEX — acquisition and known work" items={result.capex.items} currency={result.currency} />
            <ExposureList title="OPEX — annual operating" items={result.opex.items} currency={result.currency} />
          </div>

          <MaintenanceCalendar calendar={result.calendar} currency={result.currency} />

          <section>
            <h3 className="mb-3 text-sm font-black uppercase tracking-[0.12em] text-[#1A1814] dark:text-white">
              Scenarios
            </h3>
            <ScenarioSelector scenarios={result.scenarios} currency={result.currency} />
          </section>

          <UnknownsPanel unknowns={result.unknowns} />
          <GapNotice gaps={aircraft?.gaps || []} />

          <p className="text-xs leading-relaxed text-[#AAA49C] dark:text-white/40">{result.disclaimer}</p>
        </div>
      ) : null}

      <ProvenanceDrawer {...drawerProps} />
    </DecisionShell>
  );
}
