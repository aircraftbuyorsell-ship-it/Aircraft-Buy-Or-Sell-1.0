import { Link } from "react-router-dom";
import { Activity, ShieldCheck, Network, ArrowRight } from "lucide-react";

const pillars = [
  { icon: Activity, status: "Available Now", title: "ATI Scoring", copy: "One decision-ready score across 8 evidence-based aircraft dimensions, protected by deterministic scoring controls." },
  { icon: ShieldCheck, status: "Phased Roadmap", title: "APL Protocol", copy: "The provenance and trust layer designed to explain why aircraft data, ownership records, and maintenance evidence can be trusted." },
  { icon: Network, status: "Available Now", title: "Core API Gateway", copy: "Scoped API access to search, valuation, structured listings, and aviation intelligence for partner workflows." },
];

export default function AutomationAdvantage() {
  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 py-12 md:px-8">
      <div className="rounded-3xl border border-border bg-card p-6 text-card-foreground md:p-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">The Automation Advantage</p>
        <h2 className="max-w-3xl text-balance text-3xl font-bold tracking-tight md:text-4xl">From raw aircraft data to decision-ready trust.</h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">ABOS is an automated quality-assurance layer—not just a database. ATI measures aircraft transparency, the APL roadmap establishes provenance, and the Core Gateway distributes the result.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {pillars.map(({ icon: Icon, status, title, copy }) => (
            <article key={title} className="rounded-2xl border border-border bg-background p-5">
              <div className="mb-4 flex items-center justify-between gap-3"><Icon className="h-5 w-5 text-primary" /><span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">{status}</span></div>
              <h3 className="text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
            </article>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap gap-3"><Link to="/developers/core-api" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Explore Core API <ArrowRight className="h-4 w-4" /></Link><Link to="/escrow" className="inline-flex min-h-11 items-center rounded-xl border border-border px-5 py-3 text-sm font-bold">View Settlement Roadmap</Link></div>
      </div>
    </section>
  );
}