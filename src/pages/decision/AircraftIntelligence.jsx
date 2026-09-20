/**
 * Aircraft Intelligence page — the central ABOS object (master spec §21, §62).
 *
 * "Do not design ABOS around screens. Design it around the aircraft as the
 * primary intelligence object." Everything attaches here: identity, market,
 * value, history, verification, documents, maintenance, operations, costs,
 * and the sources that produced all of it.
 *
 * Deep-linkable per tab, so a broker can send a colleague straight to the
 * History tab of a specific airframe.
 */

import React, { useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  LayoutGrid, ShieldCheck, TrendingUp, History, Wrench, Radio, FileText, Database,
} from "lucide-react";
import {
  assess, computeATI, knowledgeState, commitChecklist, documentsTable, documentsSummary,
  sectionFields, SECTION_LABEL, value, displayName,
} from "@/intelligence";
import useAircraftIntelligence from "@/components/decision/useAircraftIntelligence";
import { ProgressStrip, EmptyPrompt } from "@/components/decision/DecisionShell";
import { DataField, GapNotice } from "@/components/decision/TrustPrimitives";
import { DataConflictList } from "@/components/decision/DataConflict";
import ValuationBand, { ValuationLadder, AdjustmentTable } from "@/components/decision/ValuationBand";
import ProvenanceDrawer, { useProvenance } from "@/components/decision/ProvenanceDrawer";
import {
  AircraftHero, SpecGrid, overviewItems, ATIWidget, VerificationChecklist,
  RiskSignals, buildRiskSignals, DataIntegrityShield, UpsellCard, KnowledgeColumns,
} from "@/components/decision/kit";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "verification", label: "Verification", icon: ShieldCheck },
  { key: "market", label: "Market & Valuation", icon: TrendingUp },
  { key: "history", label: "History", icon: History },
  { key: "maintenance", label: "Maintenance", icon: Wrench },
  { key: "operations", label: "Operations", icon: Radio },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "sources", label: "Sources", icon: Database },
];

export default function AircraftIntelligencePage() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const registration = params.registration || searchParams.get("registration") || "";
  const activeTab = searchParams.get("tab") || "overview";

  const { aircraft, loading, error, progress } = useAircraftIntelligence(registration, { policy: "assess" });
  const { openFor, drawerProps } = useProvenance();

  const ati = useMemo(() => (aircraft ? computeATI(aircraft) : null), [aircraft]);
  const assessment = useMemo(() => (aircraft ? assess(aircraft) : null), [aircraft]);
  const knowledge = useMemo(() => (aircraft ? knowledgeState(aircraft, ati) : null), [aircraft, ati]);
  const steps = useMemo(() => (aircraft ? commitChecklist(aircraft) : []), [aircraft]);
  const docs = useMemo(() => (aircraft ? documentsTable(aircraft) : []), [aircraft]);
  const signals = useMemo(
    () => (aircraft ? buildRiskSignals(aircraft, { assessment }) : []),
    [aircraft, assessment],
  );

  const setTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", key);
    if (registration) next.set("registration", registration);
    setSearchParams(next);
  };

  const tabCounts = {
    verification: steps.filter((s) => !["verified", "completed"].includes(s.state)).length || null,
    documents: docs.length || null,
  };

  if (!registration) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
        <EmptyPrompt
          title="No aircraft selected"
          body="Open this page with a registration, for example /aircraft/N7692J, or search from Screen."
        />
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-[#F7F4EF] dark:bg-[#0B0C10]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">

        {loading && !aircraft ? (
          <div className="space-y-4">
            <EmptyPrompt title={`Resolving ${registration}`} body="Consulting every source this policy allows." />
            {progress.length ? <ProgressStrip progress={progress} /> : null}
          </div>
        ) : null}

        {error && !aircraft ? (
          <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/5">
            <h2 className="text-base font-bold text-[#1A1814] dark:text-white">Could not resolve this aircraft</h2>
            <p className="mt-2 text-sm text-[#6B6560] dark:text-white/60">{error}</p>
          </div>
        ) : null}

        {aircraft ? (
          <div className="space-y-5">
            <AircraftHero
              aircraft={aircraft}
              ati={ati}
              actions={
                <>
                  <HeroButton onClick={() => navigate(`/screen?registration=${encodeURIComponent(registration)}`)}>Screen</HeroButton>
                  <HeroButton onClick={() => navigate(`/assess?registration=${encodeURIComponent(registration)}`)}>Assess</HeroButton>
                  <HeroButton onClick={() => navigate(`/commit?registration=${encodeURIComponent(registration)}`)}>Commit</HeroButton>
                  <HeroButton primary onClick={() => navigate(`/due-diligence?registration=${encodeURIComponent(registration)}`)}>
                    Full report
                  </HeroButton>
                </>
              }
            />

            {/* Tabs */}
            <nav className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
              <div className="flex min-w-max gap-1 border-b border-black/10 dark:border-white/10">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = tab.key === activeTab;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setTab(tab.key)}
                      className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-bold transition ${
                        active
                          ? "border-[#D4A017] text-[#1A1814] dark:text-white"
                          : "border-transparent text-[#6B6560] hover:text-[#1A1814] dark:text-white/50 dark:hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                      {tabCounts[tab.key] ? (
                        <span className="rounded-full bg-[#D4A017]/15 px-1.5 text-[11px] font-bold tabular-nums text-[#8b6a20]">
                          {tabCounts[tab.key]}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
              <div className="min-w-0 space-y-5">
                {activeTab === "overview" ? (
                  <>
                    <Panel title="Aircraft overview">
                      <SpecGrid items={overviewItems(aircraft)} />
                    </Panel>
                    <FieldPanel aircraft={aircraft} sections={["identity", "ownership"]} onExplain={openFor} />
                  </>
                ) : null}

                {activeTab === "verification" ? (
                  <>
                    <VerificationChecklist
                      title="Verification"
                      subtitle="Verify aircraft details, ownership and documentation."
                      steps={steps}
                      numbered
                    />
                    {aircraft.conflicts?.length ? (
                      <Panel title="Data conflicts">
                        <DataConflictList conflicts={aircraft.conflicts} />
                      </Panel>
                    ) : null}
                  </>
                ) : null}

                {activeTab === "market" ? (
                  <>
                    <ValuationBand assessment={assessment} />
                    <Panel title="Every figure, and where it came from">
                      <ValuationLadder assessment={assessment} />
                    </Panel>
                    <AdjustmentTable assessment={assessment} />
                    <FieldPanel aircraft={aircraft} sections={["market", "value"]} onExplain={openFor} />
                  </>
                ) : null}

                {activeTab === "history" ? (
                  <FieldPanel aircraft={aircraft} sections={["history", "ownership"]} onExplain={openFor} />
                ) : null}

                {activeTab === "maintenance" ? (
                  <FieldPanel aircraft={aircraft} sections={["airframe", "engine", "maintenance"]} onExplain={openFor} />
                ) : null}

                {activeTab === "operations" ? (
                  <FieldPanel aircraft={aircraft} sections={["operations"]} onExplain={openFor} />
                ) : null}

                {activeTab === "documents" ? (
                  <DocumentsPanel rows={docs} />
                ) : null}

                {activeTab === "sources" ? (
                  <SourcesPanel aircraft={aircraft} />
                ) : null}

                <GapNotice gaps={aircraft.gaps || []} />
              </div>

              <aside className="space-y-5">
                <ATIWidget ati={ati} />
                <RiskSignals signals={signals} />
                <DataIntegrityShield aircraft={aircraft} onViewDetails={() => setTab("verification")} />
                <UpsellCard
                  title="Ready for deeper analysis?"
                  body="Unlock full verification, valuation and deal analysis for this aircraft."
                  cta="Open full report"
                  onClick={() => navigate(`/due-diligence?registration=${encodeURIComponent(registration)}`)}
                />
              </aside>
            </div>

            <KnowledgeColumns knowledge={knowledge} />
          </div>
        ) : null}
      </div>

      <ProvenanceDrawer {...drawerProps} />
    </div>
  );
}

/* ------------------------------------------------------------ pieces */

function HeroButton({ children, onClick, primary = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition ${
        primary
          ? "bg-[#D4A017] text-[#1A1814] hover:bg-[#E8C46A]"
          : "bg-white/10 text-white hover:bg-white/20"
      }`}
    >
      {children}
    </button>
  );
}

function Panel({ title, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/5 ${className}`}>
      <h2 className="text-sm font-black uppercase tracking-[0.08em] text-[#1A1814] dark:text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FieldPanel({ aircraft, sections, onExplain }) {
  const blocks = sections
    .map((section) => ({ section, fields: sectionFields(aircraft, section).filter((f) => f.point) }))
    .filter((b) => b.fields.length);

  if (!blocks.length) {
    return (
      <Panel title="Nothing on record">
        <p className="text-sm text-[#6B6560] dark:text-white/60">
          No source consulted returned data for this section. That is a coverage gap, not a finding about the aircraft.
        </p>
      </Panel>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {blocks.map(({ section, fields }) => (
        <section key={section} className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6B6560] dark:text-white/50">
            {SECTION_LABEL[section]}
          </h3>
          <div className="mt-1 divide-y divide-black/5 dark:divide-white/10">
            {fields.map((f) => (
              <DataField key={f.key} point={f.point} label={f.label} size="sm" onExplain={onExplain} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const DOC_STATUS_STYLE = {
  verified: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  no_record: "border-black/10 bg-white text-[#6B6560] dark:border-white/10 dark:bg-white/5 dark:text-white/50",
  unavailable: "border-black/10 bg-white text-[#AAA49C] dark:border-white/10 dark:bg-white/5 dark:text-white/40",
};

function DocumentsPanel({ rows }) {
  const [filter, setFilter] = React.useState("all");
  const summary = documentsSummary(rows);
  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  const filters = [
    { key: "all", label: "All", count: summary.all },
    { key: "verified", label: "Verified", count: summary.verified },
    { key: "no_record", label: "No record", count: summary.no_record },
    { key: "unavailable", label: "Unavailable", count: summary.unavailable },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5">
      <div className="border-b border-black/5 p-5 dark:border-white/10">
        <h2 className="text-sm font-black uppercase tracking-[0.08em] text-[#1A1814] dark:text-white">
          Documents & data
        </h2>
        <p className="mt-0.5 text-sm text-[#6B6560] dark:text-white/60">
          Every source ABOS consulted, including the ones that held nothing.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                filter === f.key
                  ? "bg-[#1A1814] text-white"
                  : "bg-[#F7F4EF] text-[#6B6560] hover:bg-black/5 dark:bg-white/5 dark:text-white/60"
              }`}
            >
              {f.label} <span className="tabular-nums opacity-60">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <ul className="divide-y divide-black/5 dark:divide-white/10">
          {filtered.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1A1814] dark:text-white">{row.label}</p>
                {row.note ? <p className="mt-0.5 text-xs text-[#AAA49C]">{row.note}</p> : null}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${DOC_STATUS_STYLE[row.status]}`}>
                  {row.statusLabel}
                </span>
                <span className="w-20 text-right text-xs tabular-nums text-[#AAA49C]">{row.date || "—"}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-6 text-sm text-[#6B6560] dark:text-white/60">Nothing in this category.</p>
      )}

      <p className="border-t border-black/5 bg-[#F7F4EF] px-5 py-3 text-[11px] text-[#6B6560] dark:border-white/10 dark:bg-white/5 dark:text-white/50">
        &ldquo;No record&rdquo; means the source held nothing for this aircraft. It does not mean the aircraft has no such record.
      </p>
    </section>
  );
}

function SourcesPanel({ aircraft }) {
  const calls = aircraft.provider_calls || [];
  const summary = aircraft.call_summary || {};

  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5">
      <div className="border-b border-black/5 p-5 dark:border-white/10">
        <h2 className="text-sm font-black uppercase tracking-[0.08em] text-[#1A1814] dark:text-white">
          Sources
        </h2>
        <p className="mt-0.5 text-sm text-[#6B6560] dark:text-white/60">
          {summary.calls || 0} source(s) consulted · {summary.matched || 0} returned a record
          {summary.failed ? ` · ${summary.failed} unavailable` : ""}
        </p>
      </div>

      <ul className="divide-y divide-black/5 dark:divide-white/10">
        {calls.map((call, i) => (
          <li key={`${call.provider_id}-${i}`} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#1A1814] dark:text-white">{call.provider_name}</p>
              <p className="mt-0.5 text-xs text-[#AAA49C]">
                {call.category}
                {call.latency_ms ? ` · ${call.latency_ms} ms` : ""}
                {call.error ? ` · ${call.error}` : ""}
              </p>
            </div>
            <span className={`shrink-0 text-[11px] font-bold uppercase tracking-wider ${
              !call.success ? "text-[#AAA49C]"
                : call.matched ? "text-emerald-700 dark:text-emerald-300"
                  : "text-[#6B6560] dark:text-white/50"
            }`}>
              {!call.success ? "Unavailable" : call.matched ? "Matched" : "No record"}
            </span>
          </li>
        ))}
      </ul>

      <p className="border-t border-black/5 bg-[#F7F4EF] px-5 py-3 text-[11px] text-[#6B6560] dark:border-white/10 dark:bg-white/5 dark:text-white/50">
        Identity confidence {Math.round((aircraft.identity_confidence || 0) * 100)}% for {displayName(aircraft)}
        {value(aircraft, "registry") ? ` · registry ${value(aircraft, "registry")}` : ""}.
      </p>
    </section>
  );
}
