/**
 * SCREEN — rychlá prověrka (master spec §1).
 *
 * Free / cached sources only. Answers GO / INVESTIGATE / STOP and nothing
 * more. Everything deeper is behind Assess.
 */

import React, { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { screen, SECTIONS, SECTION_LABEL, sectionFields } from "@/intelligence";
import DecisionShell, { EmptyPrompt } from "@/components/decision/DecisionShell";
import useAircraftIntelligence from "@/components/decision/useAircraftIntelligence";
import ScreenVerdict, { SourcesConsulted } from "@/components/decision/ScreenVerdict";
import { DataConflictList } from "@/components/decision/DataConflict";
import { DataField, GapNotice } from "@/components/decision/TrustPrimitives";
import ProvenanceDrawer, { useProvenance } from "@/components/decision/ProvenanceDrawer";

const IDENTITY_SECTIONS = ["identity", "ownership", "market"];

export default function ScreenPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const registration = searchParams.get("registration") || "";

  const { aircraft, loading, error, progress } = useAircraftIntelligence(registration, { policy: "screen" });
  const { openFor, drawerProps } = useProvenance();

  const result = useMemo(() => (aircraft ? screen(aircraft) : null), [aircraft]);

  const onSearch = (value) => {
    const next = new URLSearchParams(searchParams);
    next.set("registration", value);
    setSearchParams(next);
  };

  return (
    <DecisionShell
      stage="screen"
      registration={registration}
      onSearch={onSearch}
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
        <div className="space-y-6">
          <ScreenVerdict
            result={result}
            onContinue={() => navigate(`/assess?registration=${encodeURIComponent(registration)}`)}
          />

          {result.conflicts?.length ? (
            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-[0.12em] text-[#1A1814] dark:text-white">
                Data conflicts
              </h2>
              <DataConflictList conflicts={result.conflicts} />
            </section>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2">
            {IDENTITY_SECTIONS.map((section) => {
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

          <SourcesConsulted sources={result.sources_consulted} />
        </div>
      ) : null}

      <ProvenanceDrawer {...drawerProps} />
    </DecisionShell>
  );
}

export { SECTIONS };
