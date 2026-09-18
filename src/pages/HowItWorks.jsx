import { Search, Radar, FileCheck2, ShieldCheck, Plane, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const STEPS = [
  { n: "01", icon: Search, title: "Enter a registration", text: "Type any valid tail number — US N-number or international marking. We detect the country and route to the correct registry automatically." },
  { n: "02", icon: Radar, title: "Federated lookup", text: "We query the primary registry, ADS-B traffic feeds, NTSB damage records, marketplace listings and maintenance sources in parallel — then cross-check identity fields." },
  { n: "03", icon: FileCheck2, title: "ATI scoring", text: "The Aircraft Trust Index evaluates 8 dimensions of risk on a 0–120 scale: documentation, technical, transparency, transaction readiness, usage, storage, config clarity and market readiness." },
  { n: "04", icon: ShieldCheck, title: "Data Integrity Shield", text: "Where two sources disagree, the report flags the conflict and downgrades confidence. We never paper over a mismatch." },
  { n: "05", icon: Plane, title: "Decision-ready report", text: "You receive identity, compliance, history, market comparables, valuation range and a clear recommendation — with every fact sourced and timestamped." },
];

export default function HowItWorks() {
  return (
    <div className="output-shell">
      <div className="mx-auto max-w-5xl px-5 py-14 md:px-8 md:py-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,160,23,0.20)] bg-[rgba(212,160,23,0.06)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[1.6px] text-[var(--brand-primary)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)]" /> How it works
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">From tail number to trusted report.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[rgba(243,244,246,0.72)]">
          Five steps, typically under two minutes. Every step is auditable, every fact is sourced.
        </p>

        <ol className="mt-12 space-y-4">
          {STEPS.map((s) => (
            <li key={s.n} className="output-panel flex flex-col gap-4 p-6 md:flex-row md:items-start md:gap-6">
              <div className="flex items-center gap-4 md:flex-col md:items-start">
                <span className="font-mono text-2xl font-bold text-[var(--brand-primary)]">{s.n}</span>
                <s.icon className="h-7 w-7 text-[var(--brand-primary)]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--brand-muted-foreground)]">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-16 output-panel p-8">
          <h2 className="text-2xl font-bold md:text-3xl">What you can attach</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--brand-muted-foreground)]">
            For a stronger report, you can privately upload listing text, logbook excerpts, photos or
            inspection notes. These stay in your draft, are never shared, and are combined with
            registry evidence to refine the ATI score — especially useful for off-market or
            international aircraft where public sources are thin.
          </p>
        </section>

        <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Link to="/finance-advisor" className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-6 py-3 text-sm font-bold text-[var(--brand-text)] transition hover:bg-[#C9A22F]">
            Try it with a registration <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/faq" className="text-sm font-bold text-[var(--brand-muted-foreground)] transition hover:text-[var(--brand-primary)]">
            Read the FAQ
          </Link>
        </div>
      </div>
    </div>
  );
}