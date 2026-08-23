import { AlertTriangle, CheckCircle2, Sparkles, Target } from "lucide-react";

const sections = [
  ["Executive Summary", Sparkles, "text-gold"], ["Financial Snapshot", Target, "text-accent"],
  ["Strengths", CheckCircle2, "text-emerald-600 dark:text-emerald-400"], ["Risks", AlertTriangle, "text-destructive"], ["Recommendation", Target, "text-gold"]
];

function extract(content, title) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(new RegExp(`##\\s*${escaped}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "i"));
  return match?.[1]?.trim();
}

export function hasInvestmentBrief(content = "") { return /##\s*(Executive Summary|Financial Snapshot)/i.test(content); }

export default function InvestmentBriefCard({ content }) {
  const present = sections.map(([title, Icon, tone]) => ({ title, Icon, tone, body: extract(content, title) })).filter(section => section.body);
  if (!present.length) return null;
  return <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <header className="border-b border-border bg-muted/40 px-4 py-3"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gold">Aviation Investment Brief</p></header>
    <div className="grid gap-px bg-border sm:grid-cols-2">{present.map(({ title, Icon, tone, body }) => <article key={title} className={`bg-card p-4 ${title === "Executive Summary" || title === "Recommendation" ? "sm:col-span-2" : ""}`}><h3 className={`mb-2 flex items-center gap-2 text-xs font-black ${tone}`}><Icon className="h-3.5 w-3.5" />{title}</h3><div className="whitespace-pre-wrap text-sm leading-6 text-foreground/80">{body.replace(/^[-*]\s/gm, "• ")}</div></article>)}</div>
  </section>;
}