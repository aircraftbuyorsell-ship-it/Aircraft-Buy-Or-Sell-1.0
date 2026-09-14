import { Clock3, FileText, Plane } from "lucide-react";

export default function RecentAnalysisStrip({ items, onSelect }) {
  if (!items.length) return null;
  return (
    <section className="mb-5 rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">
        <Clock3 className="h-3.5 w-3.5 text-primary" /> Recently analyzed
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const Icon = item.registration ? Plane : FileText;
          return (
            <button key={item.key} onClick={() => onSelect(item)} className="group flex min-w-[170px] items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/50">
              <Icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0"><span className="block truncate font-mono text-xs font-bold text-foreground">{item.label}</span><span className="block truncate text-[10px] text-muted-foreground">{item.kind}</span></span>
            </button>
          );
        })}
      </div>
    </section>
  );
}