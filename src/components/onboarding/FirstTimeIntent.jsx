import { BadgeDollarSign, LineChart, Search } from "lucide-react";

const OPTIONS = [
  { id: "buyer", label: "I'm buying", text: "Evaluate an aircraft before making contact.", icon: Search },
  { id: "seller", label: "I'm selling", text: "Understand value and improve buyer confidence.", icon: BadgeDollarSign },
  { id: "research", label: "I'm researching", text: "Explore values, scores and market signals.", icon: LineChart },
];

export default function FirstTimeIntent({ value, onChange }) {
  if (value) return null;
  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pb-8 sm:px-8" aria-labelledby="first-time-title">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-[10px] font-bold uppercase text-primary">Personalize your first visit</p>
        <h2 id="first-time-title" className="mt-2 text-xl font-bold text-foreground">What brings you to ABOS today?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {OPTIONS.map(({ id, label, text, icon: Icon }) => (
            <button key={id} type="button" onClick={() => onChange(id)} className="flex min-h-24 items-start gap-3 rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></span>
              <span><strong className="block text-sm text-foreground">{label}</strong><small className="mt-1 block text-xs text-muted-foreground">{text}</small></span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}