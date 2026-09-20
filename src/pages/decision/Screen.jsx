/**
 * SCREEN — rychlá prověrka (master spec §1).
 *
 * Free and cached sources only. Answers GO / INVESTIGATE / STOP and shows the
 * aircraft overview, the screening checks with their sources, and the ATI.
 * Everything deeper is behind Assess.
 */

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useCanonicalRegistration from "@/components/decision/useCanonicalRegistration";
import {
  screen, computeATI, knowledgeState, screeningChecklist, VERDICT,
} from "@/intelligence";
import DecisionShell, { EmptyPrompt } from "@/components/decision/DecisionShell";
import useAircraftIntelligence from "@/components/decision/useAircraftIntelligence";
import ScreenVerdict, { SourcesConsulted } from "@/components/decision/ScreenVerdict";
import { DataConflictList } from "@/components/decision/DataConflict";
import ProvenanceDrawer, { useProvenance } from "@/components/decision/ProvenanceDrawer";
import {
  AircraftHero, SpecGrid, overviewItems, ATIWidget, VerificationChecklist,
  RiskSignals, buildRiskSignals, DataIntegrityShield, UpsellCard, KnowledgeColumns,
} from "@/components/decision/kit";

export default function ScreenPage() {
  const navigate = useNavigate();
  const { registration, setRegistration } = useCanonicalRegistration();

  const { aircraft, loading, error, progress } = useAircraftIntelligence(registration, { policy: "screen" });
  const { drawerProps } = useProvenance();

  const result = useMemo(() => (aircraft ? screen(aircraft) : null), [aircraft]);
  const ati = useMemo(() => (aircraft ? computeATI(aircraft) : null), [aircraft]);
  const knowledge = useMemo(() => (aircraft ? knowledgeState(aircraft, ati) : null), [aircraft, ati]);
  const checks = useMemo(() => (aircraft ? screeningChecklist(aircraft) : []), [aircraft]);
  const signals = useMemo(() => (aircraft ? buildRiskSignals(aircraft) : []), [aircraft]);

  const goAssess = () => navigate(`/assess?registration=${encodeURIComponent(registration)}`);

  return (
    <DecisionShell
      stage="screen"
      registration={registration}
      onSearch={setRegistration}
      loading={loading}
      progress={progress}
    >
      {!registration ? (
        <EmptyPrompt
          title="Start with an aircraft"
          body="Enter a registration, serial number or listing reference. Screen checks identity, registration status, source consistency, history availability and market position — using free and cached sources only."
        />
      ) : null}

      {registration && loading && !result ? (
        <EmptyPrompt title="Resolving aircraft" body="Consulting the registry, listing and operational sources available for this registration." />
      ) : null}

      {error && !result ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-base font-bold text-[#1A1814] dark:text-white">Could not complete the screen</h2>
          <p className="mt-2 text-sm text-[#6B6560] dark:text-white/60">{error}</p>
          <p className="mt-2 text-xs text-[#AAA49C]">
            This reflects the sources ABOS could reach, not the aircraft itself.
          </p>
        </div>
      ) : null}

      {result ? (
        <div className="space-y-5">
          <AircraftHero aircraft={aircraft} ati={ati} stage="Screening" />

          <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-5">
              <ScreenVerdict result={result} onContinue={goAssess} />

              <section className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                <h2 className="text-sm font-black uppercase tracking-[0.08em] text-[#1A1814] dark:text-white">
                  Aircraft overview
                </h2>
                <SpecGrid items={overviewItems(aircraft)} className="mt-4" />
              </section>

              <VerificationChecklist
                title="Data screening results"
                subtitle="Each check names the source that produced it."
                steps={checks}
              />

              {result.conflicts?.length ? (
                <section>
                  <h2 className="mb-3 text-sm font-black uppercase tracking-[0.08em] text-[#1A1814] dark:text-white">
                    Data conflicts
                  </h2>
                  <DataConflictList conflicts={result.conflicts} />
                </section>
              ) : null}
            </div>

            <aside className="space-y-5">
              <ATIWidget ati={ati} />
              <RiskSignals signals={signals} />
              <DataIntegrityShield aircraft={aircraft} />
              <SourcesConsulted sources={result.sources_consulted} />
              {result.verdict !== VERDICT.STOP ? (
                <UpsellCard
                  title="Ready for deeper analysis?"
                  body="Assess tests whether the price is defensible against comparables and configuration."
                  cta="Run Assess"
                  onClick={goAssess}
                />
              ) : null}
            </aside>
          </div>

          <KnowledgeColumns knowledge={knowledge} />
        </div>
      ) : null}

      <ProvenanceDrawer {...drawerProps} />
    </DecisionShell>
  );
}
