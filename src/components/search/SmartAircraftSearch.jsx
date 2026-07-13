import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Loader2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SmartSearchActions from "@/components/search/SmartSearchActions";
import { buildSearchActions } from "@/lib/smartSearch";

export default function SmartAircraftSearch({ variant = "hero", value, onChange, onSubmit, onNavigate, loading = false }) {
  const navigate = useNavigate();
  const [internalValue, setInternalValue] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const query = value ?? internalValue;
  const search = useMemo(() => buildSearchActions(query), [query]);
  const compact = variant === "compact";

  const update = (next) => value === undefined ? setInternalValue(next) : onChange?.(next);
  const go = (path) => {setOpen(false);onNavigate?.();navigate(path);};
  const submit = (event) => {
    event?.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    onSubmit ? onSubmit(query.trim()) : go(search.primary.path);
  };

  useEffect(() => {
    const close = (event) => {if (!rootRef.current?.contains(event.target)) setOpen(false);};
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (variant !== "hero") return;
    const focus = () => inputRef.current?.focus();
    window.addEventListener("abos:focus-hero-search", focus);
    return () => window.removeEventListener("abos:focus-hero-search", focus);
  }, [variant]);

  return (
    <div ref={rootRef} className={`relative w-full ${compact ? "max-w-md" : "max-w-xl"}`}>
      <form onSubmit={submit} className={`flex w-full items-stretch overflow-visible rounded-xl border border-primary/30 bg-background/100 shadow-xl ${compact ? "min-h-11" : "min-h-14"}`}>
        <div className="flex items-center pl-4 pr-2"><Search className="h-4 w-4 text-primary" /></div>
        <input ref={inputRef} value={query} onChange={(event) => update(event.target.value)} onFocus={() => setOpen(Boolean(query.trim()))} placeholder="N-number, S/N, owner, activity, dealer, engine, costs…" aria-label="Search ABOS aircraft intelligence" className="min-w-0 flex-1 border-0 bg-transparent px-1 text-base text-foreground outline-none focus-visible:ring-0 opacity-55" />
        <button type="button" onClick={() => setOpen((current) => !current)} aria-label="Show search tools" className="flex min-h-11 items-center border-l border-border px-2 text-muted-foreground hover:text-foreground"><ChevronDown className="h-4 w-4" /></button>
        <button type="submit" disabled={!query.trim() || loading} className="m-1 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-40 sm:px-4">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{loading ? "Checking…" : search.detected.label}</button>
      </form>
      {open && query.trim() && <SmartSearchActions actions={search.actions} detectedLabel={search.detected.label} onSelect={go} />}
    </div>);

}