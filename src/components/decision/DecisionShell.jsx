/**
 * DecisionShell — the frame shared by Screen, Assess and Commit.
 *
 * Master spec §4: the funnel is DISCOVER → SCREEN → ASSESS → COMMIT, but the
 * product must NOT force users through it. A professional enters wherever they
 * like — registration, serial, listing URL, or a deep link — so the stage
 * switcher here is navigation, never a gate.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, ArrowRight } from "lucide-react";

const STAGES = [
  { key: "screen", label: "Screen", path: "/screen", question: "Is this aircraft worth spending more time and money on?" },
  { key: "assess", label: "Assess", path: "/assess", question: "Is the price of this specific aircraft defensible?" },
  { key: "commit", label: "Commit", path: "/commit", question: "What will this aircraft expose me to after I buy it?" },
];

export default function DecisionShell({
  stage, registration, onSearch, loading = false, progress = [], children,
}) {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState(registration || "");
  const current = STAGES.find((s) => s.key === stage) || STAGES[0];

  React.useEffect(() => { setQuery(registration || ""); }, [registration]);

  const submit = (e) => {
    e.preventDefault();
    const value = query.trim();
    if (value && onSearch) onSearch(value);
  };

  const goStage = (next) => {
    const reg = (registration || query).trim();
    navigate(reg ? `${next.path}?registration=${encodeURIComponent(reg)}` : next.path);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] dark:bg-[#0B0C10]">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 md:py-12">

        <header>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8b6a20]">
            ABOS Intelligence
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1A1814] dark:text-white md:text-4xl">
            {current.label}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-[#6B6560] dark:text-white/60">
            {current.question}
          </p>
        </header>

        {/* Search — the persistent primary action (§18) */}
        <form onSubmit={submit} className="mt-6">
          <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-white/5">
            <Search className="ml-2 h-4 w-4 shrink-0 text-[#AAA49C]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Registration, serial number or listing reference"
              className="min-w-0 flex-1 bg-transparent py-2 text-base font-medium text-[#1A1814] outline-none placeholder:text-[#AAA49C] dark:text-white"
              aria-label="Aircraft search"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="shrink-0 rounded-xl bg-[#1A1814] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyze"}
            </button>
          </div>
        </form>

        {/* Stage switcher */}
        <nav className="mt-4 flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => goStage(s)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${
                s.key === stage
                  ? "border-[#1A1814] bg-[#1A1814] text-white"
                  : "border-black/10 bg-white text-[#6B6560] hover:border-black/25 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
              }`}
            >
              {s.label}
              {s.key === stage ? null : <ArrowRight className="h-3 w-3" />}
            </button>
          ))}
        </nav>

        {loading && progress.length ? <ProgressStrip progress={progress} className="mt-5" /> : null}

        <main className="mt-6">{children}</main>
      </div>
    </div>
  );
}

/** Live view of which sources are being consulted. Honest, not theatrical. */
export function ProgressStrip({ progress = [], className = "" }) {
  return (
    <div className={`rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/5 ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#AAA49C]">Consulting sources</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {progress.map((p) => (
          <span
            key={p.provider_id}
            className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] font-semibold ${
              !p.done
                ? "border-black/10 bg-[#F7F4EF] text-[#6B6560] dark:border-white/10 dark:bg-white/5 dark:text-white/50"
                : p.matched
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-black/10 bg-white text-[#AAA49C] dark:border-white/10 dark:bg-white/5 dark:text-white/40"
            }`}
          >
            {!p.done ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            {p.provider_id}
          </span>
        ))}
      </div>
    </div>
  );
}

export function EmptyPrompt({ title, body }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/15 bg-white/60 p-10 text-center dark:border-white/15 dark:bg-white/5">
      <h2 className="text-lg font-bold text-[#1A1814] dark:text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#6B6560] dark:text-white/60">{body}</p>
    </div>
  );
}

export { STAGES };
