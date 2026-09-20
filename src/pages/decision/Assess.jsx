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
import { useNavigate } from "react-router-dom";
import useCanonicalRegistration from "@/components/decision/useCanonicalRegistration";
import {
  assess, computeATI, knowledgeState, assessChecklist, sectionFields, SECTION_LABEL,
} from "@/intelligence";
import DecisionShell, { EmptyPrompt } from "@/components/decision/DecisionShell";
import useAircraftIntelligence from "@/components/decision/useAircraftIntelligence";
import ValuationBand, { ValuationLadder, AdjustmentTable, AssessConfidence } from "@/components/decision/ValuationBand";
import { DataConflictList } from "@/components/decision/DataConflict";
import { DataField } from "@/components/decision/TrustPrimitives";
import ProvenanceDrawer, { useProvenance } from "@/components/decision/ProvenanceDrawer";
import {
  AircraftHero, ATIWidget, VerificationChecklist, ResultBanner,
  RiskSignals, buildRiskSignals, DataIntegrityShield, UpsellCard, KnowledgeColumns,
} from "@/components/decision/kit";

const SPEC_SECTIONS = ["airframe", "engine", "avionics", "configuration"];

export default function AssessPage() {
  const navigate = useNavigate();
  const { registration, setRegistration } = useCanonicalRegistration();

  const { aircraft, loading, error, progress } = useAircraftIntelligence(registration, { policy: "assess" });
  const { openFor, drawerProps } = useProvenance();

  const result = useMemo(() => (aircraft ? assess(aircraft) : null), [aircraft]);
  const ati = useMemo(() => (aircraft ? computeATI(aircraft) : null), [aircraft]);
  const knowledge = useMemo(() => (aircraft ? knowledgeState(aircraft, ati) : null), [aircraft, ati]);
  const checks = useMemo(() => (aircraft ? assessChecklist(aircraft) : []), [aircraft]);
  const signals = useMemo(
    () => (aircraft ? buildRiskSignals(aircraft, { assessment: result }) : []),
    [aircraft, result],
  );

  const goCommit = () => navigate(`/commit?registration=${encodeURIComponent(registration)}`);

  const bannerTone = result?.position?.state === "within" ? "positive"
    : result?.position?.state === "unknown" ? "neutral"
      : "attention";

  return (
    <DecisionShell
      stage="assess"
      registration={registration}
      onSearch={setRegistration}
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
        <div className="space-y-5">
          <AircraftHero aircraft={aircraft} ati={ati} stage="Assess" />

          <ResultBanner
            tone={bannerTone}
            eyebrow="Assessment result"
            title={result.position.label}
            body={result.conclusion}
            score={Math.round((result.confidence || 0) * 100)}
            scoreMax={100}
            scoreLabel="Assessment confidence"
          />

          <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-5">
              <ValuationBand assessment={result} />

              <section>
                <h3 className="mb-3 text-sm font-black uppercase tracking-[0.08em] text-[#1A1814] dark:text-white">
                  Every figure, and where it came from
                </h3>
                <ValuationLadder assessment={result} />
              </section>

              <VerificationChecklist
                title="Detailed findings"
                subtitle="Verify the evidence. Reduce risk. Build confidence."
                steps={checks}
              />

              <AdjustmentTable assessment={result} />

              {aircraft?.conflicts?.length ? (
                <section>
                  <h3 className="mb-3 text-sm font-black uppercase tracking-[0.08em] text-[#1A1814] dark:text-white">
                    Data conflicts
                  </h3>
                  <DataConflictList conflicts={aircraft.conflicts} />
                </section>
              ) : null}

              <section className="grid gap-4 md:grid-cols-2">
                {SPEC_SECTIONS.map((section) => {
                  const fields = sectionFields(aircraft, section).filter((f) => f.point);
                  if (!fields.length) return null;
                  return (
                    <div key={section} className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
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
            </div>

            <aside className="space-y-5">
              <ATIWidget ati={ati} />
              <AssessConfidence assessment={result} />
              <RiskSignals signals={signals} />
              <DataIntegrityShield aircraft={aircraft} />

              {result.caveats?.length ? (
                <section className="rounded-2xl border border-black/10 bg-[#F7F4EF] p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6560] dark:text-white/50">
                    Noted items
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {result.caveats.map((c, i) => (
                      <li key={i} className="text-xs text-[#6B6560] dark:text-white/60">— {c}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <UpsellCard
                title="Know what you are committing to"
                body="Commit models CAPEX, operating cost, reserves and a 36-month maintenance calendar."
                cta="Run Commit"
                onClick={goCommit}
              />
            </aside>
          </div>

          <KnowledgeColumns knowledge={knowledge} />

          <p className="text-xs leading-relaxed text-[#AAA49C] dark:text-white/40">{result.disclaimer}</p>
        </div>
      ) : null}

      <ProvenanceDrawer {...drawerProps} />
    </DecisionShell>
  );
}
