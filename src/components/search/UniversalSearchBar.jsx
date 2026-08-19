import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import SmartAircraftSearch from "@/components/search/SmartAircraftSearch";

export default function UniversalSearchBar({ compact = false }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Open smart aircraft search" className={`abos-retro-control flex min-h-11 items-center justify-center gap-2 text-muted-foreground ${compact ? "w-11" : "px-4"}`}>
        <Search className="h-4 w-4" />
        {!compact && <span className="text-sm">Search ABOS…</span>}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div className="abos-retro-menu h-fit w-full max-w-2xl border border-primary/30 bg-background p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div><p className="text-sm font-bold text-foreground">ABOS Smart Search</p><p className="text-xs text-muted-foreground">One search for aircraft identity, intelligence and costs.</p></div>
              <button onClick={() => setOpen(false)} aria-label="Close search" className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <SmartAircraftSearch variant="compact" onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}