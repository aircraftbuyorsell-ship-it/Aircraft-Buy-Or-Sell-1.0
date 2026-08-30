import GuidedToolCard from "@/components/layout/GuidedToolCard";
import { NAV_DESCRIPTIONS, sortByGuidance } from "@/components/layout/navGuidance";

export default function GuidedDropdown({ section, usage, onNavigate }) {
  const items = section.categories.flatMap((category) => category.items);
  const sorted = sortByGuidance(items, section.label, usage);
  const recommended = sorted.slice(0, Math.min(3, sorted.length));
  const remaining = sorted.slice(recommended.length);

  return (
    <div className="w-[min(760px,calc(100vw-32px))] space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-[#D4A017]/20 bg-[#D4A017]/[0.04] px-3 py-2.5">
        <div>
          <p className="text-[11px] font-bold text-foreground">{section.label} Workspace</p>
          <p className="text-[9px] text-muted-foreground">Open the full workspace or jump directly to a workflow.</p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate(section.path)}
          className="shrink-0 rounded-lg bg-[#D4A017] px-3 py-2 text-[10px] font-bold text-white transition-opacity hover:opacity-90"
        >
          Open {section.label}
        </button>
      </div>
      <div>
        <div className="mb-2 flex items-end justify-between gap-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-gold/80">Recommended for you</p>
          <p className="text-[8px] text-white/30">Adapts to the tools you use most</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {recommended.map((item) => <GuidedToolCard key={item.path} item={item} description={NAV_DESCRIPTIONS[item.path]} featured onClick={() => onNavigate(item.path)} />)}
        </div>
      </div>
      {remaining.length > 0 && <div>
        <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">All {section.label} tools</p>
        <div className="grid grid-cols-3 gap-2">
          {remaining.map((item) => <GuidedToolCard key={item.path} item={item} description={NAV_DESCRIPTIONS[item.path]} onClick={() => onNavigate(item.path)} />)}
        </div>
      </div>}
    </div>
  );
}