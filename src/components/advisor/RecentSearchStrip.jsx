import { Clock3 } from "lucide-react";

export default function RecentSearchStrip({ items, onSelect }) {
  if (!items.length) return null;
  return (
    <section className="border-b border-border bg-card" aria-label="Recent aircraft searches">
      <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-5 py-4 md:px-8">
        <span className="flex shrink-0 items-center gap-2 text-xs font-bold text-muted-foreground"><Clock3 className="h-4 w-4 text-primary" /> Recent searches</span>
        {items.map((item) => <button key={item} onClick={() => onSelect(item)} className="shrink-0 rounded-full border border-border bg-background px-4 py-2 font-mono text-xs font-bold text-foreground transition hover:border-primary hover:text-primary">{item}</button>)}
      </div>
    </section>
  );
}