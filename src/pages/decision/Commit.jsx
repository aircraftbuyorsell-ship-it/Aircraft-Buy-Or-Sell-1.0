/**
 * COMMIT — rozvaha před závazkem (master spec §3, §26, §27).
 *
 * Commit is not another valuation. It answers what this specific aircraft will
 * expose you to financially after you buy it, with every figure labelled
 * Modelled / Indicative / Assumption / Sourced, alongside the verification
 * checklist that has to close before a transaction is sensible.
 */

import React, { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  assess, commit, computeATI, knowledgeState, commitChecklist, STEP_STATE,
} from "@/intelligence";
import DecisionShell, { EmptyPrompt } from "@/components/decision/DecisionShell";
import useAircraftIntelligence from "@/components/decision/useAircraftIntelligence";
import {
  ExposureHeadline, ExposureList, MaintenanceCalendar,
  ScenarioSelector, ExposureMeter, UnknownsPanel,
} from "@/components/decision/CommitExposure";
import ProvenanceDrawer, { useProvenance } from "@/components/decision/ProvenanceDrawer";
import {
  AircraftHero, ATIWidget, VerificationChecklist, ResultBanner,
  RiskSignals, buildRiskSignals, DataIntegrityShield, QuickActions, KnowledgeColumns,
} from "@/components/decision/kit";

const QUICK_ACTIONS = [
  { key: "faa", label: "Run FAA / registry check", price: "$9.99" },
  { key: "ntsb", label: "Check NTSB / incident history", price: "$14.99" },
  { key: "logbooks", label: "Verify logbooks (AI + human)", price: "$29.99" },
  { key: "ati", label: "Order full ATI report", price: "$39.00" },
];

export default function CommitPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const registration = searchParams.get("registration") || "";

  const { aircraft, loading, error, progress } = useAircraftIntelligence(registration, { policy: "commit" });
  const { drawerProps } = useProvenance();

  const [annualHours, setAnnualHours] = useState(120);
  const [holdYears, setHoldYears] = useState(3);
  const [doneTasks, setDoneTasks] = useState([]);

  const assessment = useMemo(() => (aircraft ? assess(aircraft) : null), [aircraft]);
  const ati = useMemo(() => (aircraft ? computeATI(aircraft) : null), [aircraft]);
  const knowledge = useMemo(() => (aircraft ? knowledgeState(aircraft, ati) : null), [aircraft, ati]);
  const steps = useMemo(() => (aircraft ? commitChecklist(aircraft) : []), [aircraft]);
  const signals = useMemo(
    () => (aircraft ? buildRiskSignals(aircraft, { assessment }) : []),
    [aircraft, assessment],
  );
  const result = useMemo(
    () => (aircraft && assessment ? commit(aircraft, assessment, { annualHours, holdYears }) : null),
    [aircraft, assessment, annualHours, holdYears],
  );

  const onSearch = (value) => {
    const next = new URLSearchParams(searchParams);
    next.set("registration", value);
    setSearchParams(next);
  };

  const toggleTask = (action) => {
    setDoneTasks((prev) => (prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]));
  };

  const verified = steps.filter((s) => [STEP_STATE.VERIFIED, STEP_STATE.COMPLETED].includes(s.state)).length;
  const allVerified = steps.length > 0 && verified === steps.length;

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
        <div className="space-y-5">
          <AircraftHero aircraft={aircraft} ati={ati} stage="Commit" />

          <ResultBanner
            tone={allVerified ? "positive" : "attention"}
            eyebrow="Commit result"
            title={allVerified ? "Verification complete" : `${verified} of ${steps.length} checks complete`}
            body={
              allVerified
                ? "Every check ABOS can run from the sources available has closed. A pre-purchase inspection still establishes condition."
                : "The aircraft looks workable, but the checks below still need to close before capital moves."
            }
          />

          <p className="text-sm font-semibold text-[#1A1814] dark:text-white/85">{result.statement}</p>

          <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-5">
              <ExposureHeadline result={result} />

              {/* Assumptions the user controls — stated, never hidden */}
              <section className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/5">
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
              </section>

              <VerificationChecklist
                title="Commit"
                subtitle="Verify aircraft details, ownership and documentation. Reduce risk."
                steps={steps}
                numbered
              />

              <div className="grid gap-4 md:grid-cols-2">
                <ExposureList title="CAPEX — acquisition and known work" items={result.capex.items} currency={result.currency} />
                <ExposureList title="OPEX — annual operating" items={result.opex.items} currency={result.currency} />
              </div>

              <MaintenanceCalendar calendar={result.calendar} currency={result.currency} />

              <section>
                <h3 className="mb-3 text-sm font-black uppercase tracking-[0.08em] text-[#1A1814] dark:text-white">
                  Scenarios
                </h3>
                <ScenarioSelector scenarios={result.scenarios} currency={result.currency} />
              </section>
            </div>

            <aside className="space-y-5">
              <ATIWidget ati={ati} />
              <ExposureMeter meter={result.exposure_meter} />

              <section className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
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
              </section>

              <RiskSignals signals={signals} />
              <DataIntegrityShield aircraft={aircraft} />
              <QuickActions title="Quick commit actions" actions={QUICK_ACTIONS} />

              <button
                type="button"
                onClick={() => navigate(`/report?registration=${encodeURIComponent(registration)}`)}
                className="w-full rounded-2xl bg-[#1A1814] px-4 py-3 text-sm font-bold text-white transition hover:bg-black"
              >
                Open full due diligence report
              </button>
            </aside>
          </div>

          <UnknownsPanel unknowns={result.unknowns} />

          <KnowledgeColumns knowledge={knowledge} onToggleTask={toggleTask} completed={doneTasks} />

          <p className="text-xs leading-relaxed text-[#AAA49C] dark:text-white/40">{result.disclaimer}</p>
        </div>
      ) : null}

      <ProvenanceDrawer {...drawerProps} />
    </DecisionShell>
  );
}
