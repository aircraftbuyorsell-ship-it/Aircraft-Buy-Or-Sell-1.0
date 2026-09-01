import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * Reusable tab shell for mega-hub pages.
 * tabs: [{ key, label, icon, Component }]
 * Syncs active tab to ?tab= query param.
 * Lazy-loads tab components on first activation.
 */
export default function HubTabs({ tabs, defaultTab }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeKey = searchParams.get("tab") || defaultTab || tabs[0]?.key;
  const activeTab = tabs.find((t) => t.key === activeKey) || tabs[0];

  const selectTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", key);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="min-h-[60vh]">
      {/* Tab bar — sticky, scrollable, unified gold accent */}
      <div className="sticky top-0 z-30 -mx-4 mb-6 border-b border-border bg-background/95 px-4 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex gap-1 overflow-x-auto py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.key === activeTab.key;
            return (
              <button
                key={tab.key}
                onClick={() => selectTab(tab.key)}
                className={`group inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all md:text-[13px] ${
                  active
                    ? "bg-[#D4A017] text-white shadow-md shadow-[#D4A017]/20"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                {Icon && (
                  <Icon className={`h-4 w-4 transition-transform ${active ? "scale-110" : "group-hover:scale-105"}`} />
                )}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active tab content */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-[#D4A017]" />
          </div>
        }
      >
        <activeTab.Component />
      </Suspense>
    </div>
  );
}

/** Helper: wraps a static import as a lazy-loaded component for HubTabs. */
export function lazyPage(importFn) {
  return lazy(importFn);
}