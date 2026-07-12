import { Activity, Calculator, FileBarChart, Gauge, SearchCheck, Shield, Store, UserSearch, Wrench } from "lucide-react";

const ICONS = [Shield, FileBarChart, SearchCheck, Gauge, UserSearch, Activity, Store, Wrench, Calculator];

export default function SmartSearchActions({ actions, detectedLabel, onSelect }) {
  return (
    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-2xl">
      <p className="px-1 pb-2 text-xs text-muted-foreground">Smart detection: <strong className="text-primary">{detectedLabel}</strong></p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {actions.map((action, index) => {
          const Icon = ICONS[index];
          return <button key={action.label} type="button" onClick={() => onSelect(action.path)} className="flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-left text-xs font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Icon className="h-4 w-4 shrink-0 text-primary" />{action.label}</button>;
        })}
      </div>
    </div>
  );
}