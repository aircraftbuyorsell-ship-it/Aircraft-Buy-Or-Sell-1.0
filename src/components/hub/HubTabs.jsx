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
    <div className="grid min-h-[60vh] gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav aria-label="Hub tools" className="sticky top-[124px] z-20 self-start overflow-x-auto rounded-xl border border-border bg-card p-2 lg:top-20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-1 lg:min-w-0 lg:flex-col">
          {tabs.map((tab, index) => {
            const active = tab.key === activeTab.key;
            return (
              <button
                key={tab.key}
                onClick={() => selectTab(tab.key)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center gap-3 rounded-full px-4 text-left text-sm font-bold transition-colors lg:w-full ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${active ? "border-primary-foreground/30" : "border-border"}`}>{String(index + 1).padStart(2, "0")}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-background">
        <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
          <activeTab.Component />
        </Suspense>
      </div>
    </div>
  );
}

/** Helper: wraps a static import as a lazy-loaded component for HubTabs. */
export function lazyPage(importFn) {
  return lazy(importFn);
}