import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { History, Loader2, Search, TrendingDown, TrendingUp, Minus } from "lucide-react";

const TREND_META = {
  up: { icon: TrendingUp, color: "#16a34a", label: "Rising" },
  down: { icon: TrendingDown, color: "#dc2626", label: "Falling" },
  flat: { icon: Minus, color: "#64748b", label: "Flat" },
};

const fmtUsd = (n) =>
  n == null || !Number.isFinite(n)
    ? "—"
    : "$" + Math.round(n).toLocaleString("en-US");

export default function HistoricalPriceCheck({ make, model, year }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const aircraftLabel = [year, make, model].filter(Boolean).join(" ").trim();
  const canRun = (make || "").trim() && (model || "").trim();

  const runHistory = async () => {
    if (!canRun) {
      setError("Enter at least a make and model to search historical prices.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const prompt = `You are an aircraft market historian. Search the web for historical asking and sold prices of a ${aircraftLabel} aircraft over the past 5 years.

Use sources like Controller.com sold/archived listings, Trade-A-Plane history, Vref, Aircraft Bluebook historical values, AOPA valuation reports, JetNet, AMSTAT, general aviation market reports and aviation trade publications.

Return historical average asking/sold price points in USD at roughly: ~5 years ago, ~3 years ago, ~1 year ago, and current. Note the number of comparable listings found for each period and one short commentary line per period. Include the trend direction over the full period and a one-sentence summary.

Aircraft: ${aircraftLabel}

Return strict JSON only.`;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string", description: "One-sentence summary of the price history" },
            trend: { type: "string", enum: ["up", "flat", "down"], description: "Overall 5-year price trend" },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
            price_points: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  period: { type: "string", description: "e.g. '2021', '3 years ago'" },
                  avg_price: { type: "number", description: "Average asking/sold price in USD" },
                  min_price: { type: "number" },
                  max_price: { type: "number" },
                  sample: { type: "number", description: "Comparable listings found for this period" },
                  note: { type: "string" },
                },
              },
            },
            sources: { type: "array", items: { type: "string" } },
          },
        },
      });
      setData(res?.data ?? res);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Historical price search failed.");
    } finally {
      setLoading(false);
    }
  };

  const trend = data?.trend ? TREND_META[data.trend] : null;

  return (
    <div className="rounded-2xl p-5 md:p-6 bg-card border border-border">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4A017]">Web-search history</p>
          <h3 className="mt-1 text-base font-black tracking-tight text-foreground">Historical price check</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Pulls past asking &amp; sold prices from the web (Controller, Trade-A-Plane, Vref, Bluebook) to show how this aircraft's market value moved over ~5 years.
          </p>
        </div>
        <span className="hidden shrink-0 items-center justify-center h-10 w-10 rounded-xl bg-[#D4A017]/10 border border-[#D4A017]/30 sm:flex">
          <History className="h-5 w-5 text-[#A67C00]" />
        </span>
      </div>

      <button
        onClick={runHistory}
        disabled={loading || !canRun}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-white transition disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #D4A017, #f48120)" }}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        {loading ? "Searching the web…" : "Search historical prices"}
      </button>
      {!canRun && !loading && (
        <p className="mt-2 text-[11px] text-muted-foreground">Fill make &amp; model above (or run a valuation) to enable the history search.</p>
      )}

      {error && (
        <div className="mt-4 rounded-xl px-3 py-2 text-xs border border-destructive/30 bg-destructive/10 text-destructive">{error}</div>
      )}

      {data && !error && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {trend && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black"
                style={{ background: `${trend.color}14`, color: trend.color, border: `1px solid ${trend.color}33` }}
              >
                <trend.icon className="h-3 w-3" /> {trend.label} trend
              </span>
            )}
            {data.confidence && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black bg-muted text-muted-foreground border border-border">
                Confidence: {data.confidence}
              </span>
            )}
          </div>

          {data.summary && (
            <p className="text-xs leading-5 text-muted-foreground">{data.summary}</p>
          )}

          {Array.isArray(data.price_points) && data.price_points.length > 0 && (
            <ol className="relative space-y-3 pl-4 border-l border-border">
              {data.price_points.map((pt, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[1.18rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[#D4A017] ring-2 ring-background" />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="text-xs font-black uppercase tracking-wide text-foreground">{pt.period || "—"}</span>
                    <span className="text-sm font-black text-[#D4A017] tabular-nums">{fmtUsd(pt.avg_price)}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground tabular-nums">
                    {pt.min_price != null && <span>low {fmtUsd(pt.min_price)}</span>}
                    {pt.max_price != null && <span>high {fmtUsd(pt.max_price)}</span>}
                    {pt.sample != null && <span>n={pt.sample}</span>}
                  </div>
                  {pt.note && <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{pt.note}</p>}
                </li>
              ))}
            </ol>
          )}

          {Array.isArray(data.sources) && data.sources.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Sources</p>
              <ul className="mt-1.5 space-y-1">
                {data.sources.slice(0, 6).map((s, i) => (
                  <li key={i} className="text-[11px] leading-5 text-muted-foreground truncate">• {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}