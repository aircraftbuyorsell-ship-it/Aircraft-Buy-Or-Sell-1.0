import { BadgeCheck, Braces, Blocks } from "lucide-react";

const items = [
  { icon: BadgeCheck, label: "Available Now", title: "ATI Intelligence", text: "ATI scores and market intelligence are delivered in a consistent listing contract." },
  { icon: Braces, label: "Available Now", title: "Core Gateway", text: "Scoped API keys, rate limits, request auditing, OpenAPI, search, valuation, extraction, and listings." },
  { icon: Blocks, label: "Coming Soon", title: "APL + Partner SDK", text: "A public SDK and production provenance layer will simplify APL-verified aircraft workflows across partner apps." },
];

export default function TrustScoreApi() {
  return (
    <section className="mb-10 rounded-2xl border border-border bg-card p-6 text-card-foreground">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">The Trust-Score API</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">Aviation intelligence inside your workflow.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Automate aircraft discovery, valuation, and decision support through the operational ABOS Core Gateway. APL provenance and the partner SDK remain clearly separated as roadmap capabilities.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {items.map(({ icon: Icon, label, title, text }) => (
          <article key={title} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-2"><Icon className="h-5 w-5 text-primary" /><span className="rounded-full border border-border px-2 py-1 text-xs font-semibold text-muted-foreground">{label}</span></div>
            <h3 className="mt-4 text-base font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}