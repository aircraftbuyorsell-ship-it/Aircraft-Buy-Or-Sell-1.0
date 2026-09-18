import { ShieldCheck, Radar, Plane, BadgeCheck, Globe2, LockKeyhole, FileCheck2, Search } from "lucide-react";

const PRINCIPLES = [
  { icon: ShieldCheck, title: "Verify, don't assume", text: "Every identity claim is checked against primary registries before it reaches you. No listing copy is trusted at face value." },
  { icon: Radar, title: "Federated intelligence", text: "We fuse FAA, EASA, ADS-B traffic, NTSB, marketplace listings and maintenance records into one picture — then flag where sources disagree." },
  { icon: LockKeyhole, title: "Your data, your control", text: "Private evidence you upload stays private. We never resell your documents or search history." },
  { icon: BadgeCheck, title: "Transparent provenance", text: "Every fact in a report names its source and timestamp, so you can audit how a conclusion was reached." },
];

const REGISTRIES = [
  "FAA (United States)", "EASA (European Union)", "CAA (United Kingdom)", "Ireland IAA",
  "Germany LBA", "Czech CAA", "Transport Canada", "Australia CASA",
  "Netherlands ILT", "France DGAC", "Switzerland FOCA", "New Zealand CAA",
];

export default function About() {
  return (
    <div className="output-shell">
      <div className="mx-auto max-w-5xl px-5 py-14 md:px-8 md:py-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,160,23,0.20)] bg-[rgba(212,160,23,0.06)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[1.6px] text-[var(--brand-primary)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)]" /> About ABOS
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">We verify aircraft before the deal is trusted.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[rgba(243,244,246,0.72)]">
          ABOS — Aircraft Buy Or Sell — is an aviation intelligence platform built on a simple belief:
          buyers, sellers, brokers and lenders deserve the same objective evidence about an aircraft that
          a registry inspector sees. We gather it, cross-check it, and turn it into a decision-ready report.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="output-panel p-6">
              <p.icon className="h-7 w-7 text-[var(--brand-primary)]" />
              <h3 className="mt-4 text-lg font-bold">{p.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--brand-muted-foreground)]">{p.text}</p>
            </div>
          ))}
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-bold md:text-3xl">What we actually do</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { icon: Search, title: "Identity lookup", text: "Enter a registration. We resolve it against the correct national registry and return make, model, serial, owner-type and airworthiness status." },
              { icon: FileCheck2, title: "ATI report", text: "Our Aircraft Trust Index scores 8 dimensions of risk — documentation, technical, transparency, market readiness and more — on a 0–120 scale." },
              { icon: Plane, title: "Market intelligence", text: "Live comparables, deal scoring and valuation ranges so you know whether the asking price reflects reality." },
            ].map((c) => (
              <div key={c.title} className="output-panel p-6">
                <c.icon className="h-7 w-7 text-[var(--brand-primary)]" />
                <h3 className="mt-4 text-base font-bold">{c.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--brand-muted-foreground)]">{c.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <div className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-[var(--brand-primary)]" />
            <h2 className="text-2xl font-bold md:text-3xl">Registries we federate</h2>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-[var(--brand-muted-foreground)]">
            One registration unlocks evidence from 100+ civil aviation authorities and supplementary data sources.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {REGISTRIES.map((r) => (
              <span key={r} className="rounded-md border border-[var(--brand-border)] bg-[var(--brand-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-text)]">{r}</span>
            ))}
          </div>
        </section>

        <section className="mt-16 output-panel p-8">
          <h2 className="text-2xl font-bold md:text-3xl">Our position</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--brand-muted-foreground)]">
            ABOS is not a marketplace. We do not broker aircraft, hold escrow, or take a cut of your sale.
            We are an intelligence layer that sits beside the transaction, giving every party the same
            verified facts — so trust is earned, not assumed. When a listing is wrong, we say so.
            When a registry is silent, we tell you. When the evidence is thin, the report says
            <span className="text-[var(--brand-primary)]"> INSUFFICIENT_DATA</span> rather than guessing.
          </p>
        </section>
      </div>
    </div>
  );
}