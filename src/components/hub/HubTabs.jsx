import { useState, useEffect, lazy, Suspense } from "react";
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
      {/* Tab bar */}
      <div className="sticky top-0 z-30 -mx-4 mb-6 border-b border-border bg-background/95 px-4 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.key === activeTab.key;
            return (
              <button
                key={tab.key}
                onClick={() => selectTab(tab.key)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-colors md:text-[13px] ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
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
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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