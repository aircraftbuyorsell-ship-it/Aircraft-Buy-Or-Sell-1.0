/**
 * Aircraft Due Diligence Report (master spec §49).
 *
 * An interactive web report first; PDF export is secondary and renders this
 * same model, so the printed document can never say something the screen does
 * not. Eight sections, each one printable as a page.
 *
 * Every score on this report states what it measures. None of them is a grade
 * for the aircraft — they measure the evidence ABOS was able to gather.
 */

import React, { useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Printer, ShieldCheck, TrendingUp, FileText, AlertTriangle, ClipboardCheck,
  Plane, ArrowRight, CircleCheck, Minus,
} from "lucide-react";
import { buildReport } from "@/intelligence";
import useAircraftIntelligence from "@/components/decision/useAircraftIntelligence";
import { ProgressStrip, EmptyPrompt } from "@/components/decision/DecisionShell";
import {
  ScoreDonut, ScoreBar, RangeBar, VerificationChecklist, ResultBanner,
  KnowledgeColumns, RESULT_COLOR, BAND_COLOR,
} from "@/components/decision/kit";

const SECTIONS = [
  { key: "cover", label: "Cover", icon: Plane },
  { key: "screening", label: "Screening", icon: ClipboardCheck },
  { key: "assess", label: "Assess", icon: ShieldCheck },
  { key: "commit", label: "Commit", icon: CircleCheck },
  { key: "market", label: "Market & Valuation", icon: TrendingUp },
  { key: "documents", label: "Documents & Data", icon: FileText },
  { key: "risk", label: "Risk & Compliance", icon: AlertTriangle },
  { key: "summary", label: "Executive Summary", icon: ArrowRight },
];

function money(n, currency = "EUR") {
  if (!Number.isFinite(Number(n))) return "—";
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : "";
  return `${symbol}${Math.round(Number(n)).toLocaleString("en-US")}`;
}

function toneColor(tone) {
  return tone === "positive" ? RESULT_COLOR.positive
    : tone === "attention" ? RESULT_COLOR.attention
      : RESULT_COLOR.neutral;
}

export default function ReportPage() {
  const [searchParams] = useSearchParams();
  const registration = searchParams.get("registration") || "";
  const refs = useRef({});

  const { aircraft, loading, error, progress } = useAircraftIntelligence(registration, { policy: "commit" });
  const report = useMemo(() => (aircraft ? buildReport(aircraft) : null), [aircraft]);

  const scrollTo = (key) => {
    refs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const setRef = (key) => (el) => { refs.current[key] = el; };

  if (!registration) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
        <EmptyPrompt
          title="No aircraft selected"
          body="Open this report with a registration, for example /due-diligence?registration=N7692J."
        />
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-[#F7F4EF] dark:bg-[#0B0C10]">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-8">

        {loading && !report ? (
          <div className="space-y-4">
            <EmptyPrompt
              title={`Compiling the report for ${registration}`}
              body="Consulting every source this policy allows, then building the eight sections."
            />
            {progress.length ? <ProgressStrip progress={progress} /> : null}
          </div>
        ) : null}

        {error && !report ? (
          <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/5">
            <h2 className="text-base font-bold text-[#1A1814] dark:text-white">Could not compile the report</h2>
            <p className="mt-2 text-sm text-[#6B6560] dark:text-white/60">{error}</p>
          </div>
        ) : null}

        {report && !report.error ? (
          <>
            <nav className="sticky top-0 z-10 -mx-4 mb-5 overflow-x-auto bg-[#F7F4EF]/95 px-4 py-2 backdrop-blur print:hidden md:mx-0 md:px-0 dark:bg-[#0B0C10]/95">
              <div className="flex min-w-max items-center gap-1">
                {SECTIONS.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => scrollTo(s.key)}
                      className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#6B6560] transition hover:bg-white hover:text-[#1A1814] dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {i}. {s.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="ml-2 flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#1A1814] px-3 py-1.5 text-xs font-bold text-white"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / PDF
                </button>
              </div>
            </nav>

            <div className="space-y-5">
              <Cover innerRef={setRef("cover")} report={report} />
              <ScreeningSection innerRef={setRef("screening")} report={report} />
              <AssessSection innerRef={setRef("assess")} report={report} />
              <CommitSection innerRef={setRef("commit")} report={report} />
              <MarketSection innerRef={setRef("market")} report={report} />
              <DocumentsSection innerRef={setRef("documents")} report={report} />
              <RiskSection innerRef={setRef("risk")} report={report} />
              <SummarySection innerRef={setRef("summary")} report={report} />

              <KnowledgeColumns knowledge={report.knowledge} />

              <p className="pb-6 text-center text-xs text-[#AAA49C]">
                {report.executive_summary.conclusion_caveat}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- shell */

function Page({ innerRef, number, title, subtitle, children, className = "" }) {
  return (
    <section
      ref={innerRef}
      className={`overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-3 dark:border-white/10">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b6a20]">
          ABOS · Aviation Intelligence Platform
        </span>
        <span className="text-[10px] font-semibold text-[#AAA49C]">{number} / 8</span>
      </div>
      <div className="p-5 md:p-6">
        <h2 className="text-xl font-black tracking-tight text-[#1A1814] dark:text-white md:text-2xl">
          <span className="text-[#AAA49C]">{number}.</span> {title}
        </h2>
        {subtitle ? <p className="mt-1 text-sm text-[#6B6560] dark:text-white/60">{subtitle}</p> : null}
        <div className="mt-5">{children}</div>
      </div>
    </section>
  );
}

function Block({ title, children, className = "" }) {
  return (
    <div className={`rounded-xl border border-black/10 p-4 dark:border-white/10 ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#AAA49C]">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/* --------------------------------------------------------------- cover */

function Cover({ innerRef, report }) {
  const { meta, scores, ati } = report;
  return (
    <section
      ref={innerRef}
      className="overflow-hidden rounded-2xl border border-black/10 bg-[#1A1814] text-white dark:border-white/10"
    >
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#E8C46A]">
          ABOS · Aviation Intelligence Platform
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
          {meta.confidentiality}
        </span>
      </div>

      <div className="p-6 md:p-8">
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">{meta.title}</h1>
        <p className="mt-3 text-xl font-bold text-[#E8C46A] md:text-2xl">
          {[meta.manufacturer, meta.model].filter(Boolean).join(" ") || "Unidentified aircraft"}
        </p>
        {meta.registration ? (
          <p className="mt-1 text-2xl font-black tabular-nums md:text-3xl">{meta.registration}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-6">
          <ScoreDonut score={scores.overall.value} max={100} color={BAND_COLOR.good} size={96} label="Overall" />
          <ScoreDonut score={ati.score} max={ati.max} color={BAND_COLOR[ati.band]} size={96} label="ATI" />
          <div className="min-w-0 flex-1 text-sm text-white/60">
            <p>{scores.overall.measures}</p>
            <p className="mt-2">{ati.meaning}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
          {[
            { label: "Screening", body: "Quick data check", q: "Is it worth further review?" },
            { label: "Assess", body: "Detailed analysis", q: "What are the risks?" },
            { label: "Commit", body: "Verified evidence", q: "Ready for transaction?" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#E8C46A]">{s.label}</p>
              <p className="mt-1 text-sm font-semibold">{s.body}</p>
              <p className="mt-0.5 text-xs text-white/50">{s.q}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3 text-[10px] text-white/40">
        <span>Where aviation data meets the marketspace</span>
        <span className="tabular-nums">{String(meta.generated_at).slice(0, 10)}</span>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- screening */

function ScreeningSection({ innerRef, report }) {
  const { screening, scores } = report;
  return (
    <Page innerRef={innerRef} number={1} title="Screening Report" subtitle="Quick data check — key indicators and risk signals">
      <div className="grid gap-4 md:grid-cols-[1.5fr_auto] md:items-start">
        <ResultBanner
          tone={screening.tone}
          eyebrow="Overall screening result"
          title={screening.headline}
          body={screening.meaning}
        />
        <div className="flex justify-center rounded-xl border border-black/10 p-4 dark:border-white/10">
          <ScoreDonut
            score={scores.screening.value}
            max={100}
            color={toneColor(screening.tone)}
            size={96}
            label="Screening score"
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-[#AAA49C]">{scores.screening.measures}</p>

      <div className="mt-5">
        <VerificationChecklist
          title="Key screening checks"
          subtitle="Each check names the source that produced it."
          steps={screening.checks}
          showProgress={false}
        />
      </div>

      <Block title="Recommendation" className="mt-5 bg-[#F7F4EF] dark:bg-white/5">
        <p className="text-sm font-semibold text-[#1A1814] dark:text-white">{screening.recommendation}</p>
        <ul className="mt-2 space-y-1">
          {screening.reasons.map((r, i) => (
            <li key={i} className="text-xs text-[#6B6560] dark:text-white/60">— {r}</li>
          ))}
        </ul>
      </Block>

      <p className="mt-4 text-[11px] leading-relaxed text-[#AAA49C]">{screening.disclaimer}</p>
    </Page>
  );
}

/* -------------------------------------------------------------- assess */

function AssessSection({ innerRef, report }) {
  const { assessment, scores } = report;
  return (
    <Page innerRef={innerRef} number={2} title="Assess Report" subtitle="In-depth analysis — risk, value and condition">
      <div className="grid gap-4 md:grid-cols-[1.5fr_auto] md:items-start">
        <ResultBanner
          tone={assessment.tone}
          eyebrow="Assessment result"
          title={assessment.position.label}
          body={assessment.conclusion}
        />
        <div className="flex justify-center rounded-xl border border-black/10 p-4 dark:border-white/10">
          <ScoreDonut
            score={scores.assessment.value}
            max={100}
            color={toneColor(assessment.tone)}
            size={96}
            label="Assessment score"
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-[#AAA49C]">{scores.assessment.measures}</p>

      <div className="mt-5">
        <VerificationChecklist title="Detailed findings" steps={assessment.findings} showProgress={false} />
      </div>

      {assessment.noted_items?.length ? (
        <Block title="Noted items" className="mt-5 border-[#D4A017]/30 bg-[#D4A017]/10">
          <ul className="space-y-1.5">
            {assessment.noted_items.map((item, i) => (
              <li key={i} className="text-sm text-[#1A1814] dark:text-white/85">• {item}</li>
            ))}
          </ul>
        </Block>
      ) : null}

      <p className="mt-4 text-[11px] leading-relaxed text-[#AAA49C]">{assessment.disclaimer}</p>
    </Page>
  );
}

/* -------------------------------------------------------------- commit */

function CommitSection({ innerRef, report }) {
  const { verification, scores, exposure } = report;
  const allDone = verification.completed === verification.total;

  return (
    <Page innerRef={innerRef} number={3} title="Commit Report" subtitle="Verified data, documentation and final recommendation">
      <div className="grid gap-4 md:grid-cols-[1.5fr_auto] md:items-start">
        <ResultBanner
          tone={allDone ? "positive" : "attention"}
          eyebrow="Commit result"
          title={allDone ? "Verification complete" : `${verification.completed} of ${verification.total} checks complete`}
          body={verification.recommendation}
        />
        <div className="flex justify-center rounded-xl border border-black/10 p-4 dark:border-white/10">
          <ScoreDonut
            score={scores.verification.value}
            max={100}
            color={allDone ? RESULT_COLOR.positive : RESULT_COLOR.attention}
            size={96}
            label="Verification"
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-[#AAA49C]">{scores.verification.measures}</p>

      <div className="mt-5">
        <VerificationChecklist title="Documentation & verification" steps={verification.steps} numbered />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Block title="Total modelled exposure">
          <p className="text-2xl font-black tabular-nums text-[#1A1814] dark:text-white">
            {money(exposure.total_modelled_exposure, exposure.currency)}
          </p>
          <p className="mt-1 text-xs text-[#6B6560] dark:text-white/55">
            Purchase + known CAPEX + {exposure.assumptions.hold_years} year(s) operating, modelled.
          </p>
        </Block>
        <Block title="Maintenance exposure">
          <p className="text-2xl font-black tabular-nums" style={{ color: exposure.exposure_meter.color }}>
            {exposure.exposure_meter.label}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F0EBE3] dark:bg-white/10">
            <div
              className="h-full rounded-full"
              style={{ width: `${exposure.exposure_meter.score}%`, backgroundColor: exposure.exposure_meter.color }}
            />
          </div>
        </Block>
      </div>

      <Block title="Final recommendation" className="mt-5 bg-[#F7F4EF] dark:bg-white/5">
        <p className="text-sm font-semibold text-[#1A1814] dark:text-white">{verification.recommendation}</p>
      </Block>

      <p className="mt-4 text-[11px] leading-relaxed text-[#AAA49C]">{exposure.disclaimer}</p>
    </Page>
  );
}

/* -------------------------------------------------------------- market */

function MarketSection({ innerRef, report }) {
  const m = report.market;
  return (
    <Page innerRef={innerRef} number={4} title="Market & Valuation" subtitle="Current market data, pricing and trends">
      <div className="grid gap-4 md:grid-cols-2">
        <Block title={`Market value (${m.currency})`}>
          {m.range_low && m.range_high ? (
            <>
              <p className="text-2xl font-black tabular-nums text-[#1A1814] dark:text-white">
                {money(m.range_low, m.currency)} – {money(m.range_high, m.currency)}
              </p>
              <p className="mt-1 text-xs text-[#6B6560] dark:text-white/55">
                Confidence: <span className="font-bold tabular-nums">{m.confidence_pct}%</span>
              </p>
              <RangeBar
                className="mt-4"
                low={m.range_low}
                high={m.range_high}
                marker={m.asking}
                lowLabel={money(m.range_low, m.currency)}
                highLabel={money(m.range_high, m.currency)}
                markerLabel={m.asking ? `Asking ${money(m.asking, m.currency)}` : null}
              />
            </>
          ) : (
            <p className="text-sm text-[#6B6560] dark:text-white/60">{m.method}</p>
          )}
        </Block>

        <Block title="Price comparison">
          <dl className="space-y-2">
            {[
              ["Asking price", m.asking],
              ["Market median", m.market_median],
              ["ABOS midpoint", m.midpoint],
            ].map(([label, v]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <dt className="text-sm text-[#6B6560] dark:text-white/60">{label}</dt>
                <dd className="text-sm font-bold tabular-nums text-[#1A1814] dark:text-white">{money(v, m.currency)}</dd>
              </div>
            ))}
          </dl>
          {Number.isFinite(m.comparable_count) ? (
            <p className="mt-3 text-xs text-[#AAA49C]">Based on {m.comparable_count} comparable aircraft.</p>
          ) : null}
        </Block>
      </div>

      {m.valuations?.length ? (
        <Block title="Valuation sources" className="mt-4">
          <ul className="space-y-2">
            {m.valuations.map((v, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <span className="text-sm text-[#1A1814] dark:text-white/85">{v.label}</span>
                <span className="text-sm font-bold tabular-nums text-[#1A1814] dark:text-white">{money(v.value, m.currency)}</span>
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      <Block title="Key value drivers" className="mt-4">
        <ul className="space-y-1.5">
          {m.value_drivers.map((d) => (
            <li key={d.key} className="flex items-center justify-between gap-3">
              <span className="text-sm text-[#6B6560] dark:text-white/60">{d.label}</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${d.known ? "text-emerald-700 dark:text-emerald-300" : "text-[#AAA49C]"}`}>
                {d.known ? "Accounted" : "Not established"}
              </span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Summary" className="mt-4 bg-[#F7F4EF] dark:bg-white/5">
        <p className="text-sm text-[#1A1814] dark:text-white/85">{m.summary}</p>
        {m.method ? <p className="mt-2 text-xs text-[#6B6560] dark:text-white/55">{m.method}</p> : null}
      </Block>

      <p className="mt-4 text-[11px] leading-relaxed text-[#AAA49C]">{m.disclaimer}</p>
    </Page>
  );
}

/* ----------------------------------------------------------- documents */

const DOC_TONE = {
  verified: "text-emerald-700 dark:text-emerald-300",
  no_record: "text-[#6B6560] dark:text-white/50",
  unavailable: "text-[#AAA49C]",
};

function DocumentsSection({ innerRef, report }) {
  return (
    <Page innerRef={innerRef} number={5} title="Documents & Data" subtitle="Verified documents and data sources">
      {report.documents.length ? (
        <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
          <table className="w-full text-left">
            <thead className="border-b border-black/5 bg-[#F7F4EF] dark:border-white/10 dark:bg-white/5">
              <tr>
                <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#AAA49C]">Document / data source</th>
                <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#AAA49C]">Status</th>
                <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-[#AAA49C]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10">
              {report.documents.map((row) => (
                <tr key={row.key}>
                  <td className="px-4 py-2.5 text-sm text-[#1A1814] dark:text-white/85">{row.label}</td>
                  <td className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider ${DOC_TONE[row.status]}`}>
                    {row.statusLabel}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums text-[#AAA49C]">{row.date || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-[#6B6560] dark:text-white/60">No source responses were recorded for this aircraft.</p>
      )}

      <Block title="What this table means" className="mt-4 bg-[#F7F4EF] dark:bg-white/5">
        <p className="text-xs text-[#6B6560] dark:text-white/60">
          &ldquo;No record&rdquo; means the source held nothing for this aircraft. &ldquo;Unavailable&rdquo; means
          the source could not be reached. Neither says anything about the aircraft itself.
        </p>
      </Block>
    </Page>
  );
}

/* ---------------------------------------------------------------- risk */

const COMPLIANCE_TONE = {
  compliant: "text-emerald-700 dark:text-emerald-300",
  attention: "text-[#8b6a20] dark:text-[#E8C46A]",
  not_applicable: "text-[#AAA49C]",
  not_assessed: "text-[#AAA49C]",
};

function RiskSection({ innerRef, report }) {
  const { risk, compliance } = report;
  return (
    <Page innerRef={innerRef} number={6} title="Risk & Compliance" subtitle="Potential risks, limitations and compliance status">
      <ResultBanner
        tone={risk.level === "low" ? "positive" : "attention"}
        eyebrow="Risk overview"
        title={risk.label}
        body={risk.summary}
      />

      <Block title="Risk categories" className="mt-4">
        <ul className="space-y-2">
          {risk.categories.map((c) => (
            <li key={c.key} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-sm text-[#1A1814] dark:text-white/85">{c.label}</span>
                {c.note ? <p className="mt-0.5 text-xs text-[#AAA49C]">{c.note}</p> : null}
              </div>
              <span className={`shrink-0 text-sm font-black tabular-nums ${
                c.count === 0 ? "text-[#AAA49C]"
                  : c.informational ? "text-[#6B6560] dark:text-white/60"
                    : "text-[#8b6a20] dark:text-[#E8C46A]"
              }`}>
                {c.count}
                {c.informational ? <span className="ml-1 text-[10px] font-semibold uppercase">info</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Compliance status" className="mt-4">
        <ul className="space-y-2">
          {compliance.rows.map((row) => (
            <li key={row.key} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-sm text-[#1A1814] dark:text-white/85">{row.label}</span>
                <p className="mt-0.5 text-xs text-[#AAA49C]">{row.note}</p>
              </div>
              <span className={`shrink-0 text-xs font-bold uppercase tracking-wider ${COMPLIANCE_TONE[row.state]}`}>
                {row.stateLabel}
              </span>
            </li>
          ))}
        </ul>
      </Block>

      <div className="mt-4 space-y-2">
        <p className="text-[11px] leading-relaxed text-[#AAA49C]">{risk.caveat}</p>
        <p className="text-[11px] leading-relaxed text-[#AAA49C]">{compliance.caveat}</p>
      </div>
    </Page>
  );
}

/* ------------------------------------------------------------- summary */

function SummarySection({ innerRef, report }) {
  const s = report.executive_summary;
  const { ati } = report;

  return (
    <Page innerRef={innerRef} number={7} title="Executive Summary" subtitle="Key findings and next steps">
      <div className="grid gap-4 md:grid-cols-[1.4fr_auto] md:items-start">
        <ResultBanner tone={s.tone} eyebrow="Overall result" title={s.outcome} body={s.statement} />
        <div className="flex flex-col items-center gap-3 rounded-xl border border-black/10 p-4 dark:border-white/10">
          <ScoreDonut score={s.overall.value} max={100} color={toneColor(s.tone)} size={96} label="Overall" />
          <div className="w-full space-y-1.5">
            {s.scores.map((score) => (
              <ScoreBar key={score.label} label={score.label} score={score.value} max={score.max} />
            ))}
            <ScoreBar label="ATI" score={ati.score} max={ati.max} color={BAND_COLOR[ati.band]} />
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-[#AAA49C]">{s.overall.measures}</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Block title="Key highlights">
          {s.key_highlights.length ? (
            <ul className="space-y-1.5">
              {s.key_highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-1.5 text-sm text-[#1A1814] dark:text-white/85">
                  <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {h}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#AAA49C]">Nothing has been established for this aircraft yet.</p>
          )}
        </Block>

        <Block title="Recommended next steps">
          {s.recommended_next_steps.length ? (
            <ol className="space-y-1.5">
              {s.recommended_next_steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#1A1814] dark:text-white/85">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#1A1814] text-[10px] font-bold text-white dark:bg-white dark:text-[#1A1814]">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-[#AAA49C]">No further remote checks are queued.</p>
          )}
        </Block>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Block title="Established">
          <p className="text-xl font-black tabular-nums text-[#1A1814] dark:text-white">{s.known_count}</p>
          <p className="text-xs text-[#AAA49C]">data points</p>
        </Block>
        <Block title="Not established">
          <p className="text-xl font-black tabular-nums text-[#6B6560] dark:text-white/60">{s.missing_count}</p>
          <p className="text-xs text-[#AAA49C]">gaps, not findings</p>
        </Block>
        <Block title="Price position">
          <p className="text-sm text-[#1A1814] dark:text-white/85">{s.price_summary}</p>
        </Block>
      </div>

      {report.gaps?.length ? (
        <Block title="Data gaps" className="mt-4 bg-[#F7F4EF] dark:bg-white/5">
          <ul className="space-y-1.5">
            {report.gaps.map((g, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm">
                <Minus className="mt-1 h-3 w-3 shrink-0 text-[#AAA49C]" />
                <span>
                  <span className="font-semibold text-[#1A1814] dark:text-white">{g.label}</span>
                  <span className="text-[#6B6560] dark:text-white/60"> — {g.how_to_close}</span>
                </span>
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      <p className="mt-4 text-[11px] leading-relaxed text-[#AAA49C]">{s.conclusion_caveat}</p>
    </Page>
  );
}
