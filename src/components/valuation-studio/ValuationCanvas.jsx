import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { lookupAircraft } from "@/lib/aircraftLookup";
import {
  Plane, Search, Loader2, BadgeCheck, X, SlidersHorizontal, Zap, FileText,
  Calculator, HandCoins, ShieldCheck, Radar, Paintbrush, Armchair,
  Sparkles, GitCompare, Users, FileSignature, Globe,
} from "lucide-react";

const TOOLS = [
  { key: "omvm", label: "OMVM Valuation", icon: SlidersHorizontal, action: "inline", route: "", accent: "#D4AF37" },
  { key: "ati_quick", label: "ATI Quick Score", icon: Zap, action: "route", route: "/ati-quick-score", accent: "#14B8A6" },
  { key: "ati_full", label: "ATI Full Report", icon: FileText, action: "route", route: "/ati-full-report", accent: "#3B82F6" },
  { key: "opex", label: "Operating Costs", icon: Calculator, action: "route", route: "/opex-calculator", accent: "#EF6C2A" },
  { key: "leasing", label: "Leasing", icon: HandCoins, action: "route", route: "/leasing-calculator", accent: "#22C55E" },
  { key: "insurance", label: "Insurance", icon: ShieldCheck, action: "route", route: "/insurance-calculator", accent: "#3B82F6" },
  { key: "avionics", label: "Avionics Upgrade", icon: Radar, action: "route", route: "/avionics-upgrade-calculator", accent: "#8B5CF6" },
  { key: "exterior", label: "Exterior Refurb", icon: Paintbrush, action: "route", route: "/exterior-refurbishment-calculator", accent: "#8B5CF6" },
  { key: "interior", label: "Interior Refurb", icon: Armchair, action: "route", route: "/interior-refurbishment-calculator", accent: "#8B5CF6" },
  { key: "detailing", label: "Detailing", icon: Sparkles, action: "route", route: "/aircraft-detailing-calculator", accent: "#8B5CF6" },
  { key: "compare", label: "Upgrade Compare", icon: GitCompare, action: "route", route: "/upgrade-comparison", accent: "#8B5CF6" },
  { key: "fractional", label: "Fractional", icon: Users, action: "route", route: "/fractional-calculators", accent: "#EF6C2A" },
  { key: "billofsale", label: "Bill of Sale", icon: FileSignature, action: "route", route: "/bill-of-sale", accent: "#22C55E" },
  { key: "registry", label: "Registry Compare", icon: Globe, action: "route", route: "/registry-comparator", accent: "#8B5CF6" },
];

const normalizeReg = (raw) => (raw || "").toUpperCase().replace(/\s+/g, "");

export default function ValuationCanvas({ anchor, onVerified, onRunOmvm }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);

  const verify = async (e) => {
    e?.preventDefault();
    const reg = normalizeReg(query);
    if (!reg) return;
    setVerifying(true); setError(null);
    try {
      const data = await lookupAircraft(reg);
      if (!data.found) { setError(data.error || `No record found for ${reg}.`); onVerified?.(null); return; }
      const a = data.aircraft || {};
      onVerified?.({
        registration: a.registration || reg,
        make: a.make || "",
        model: a.model || "",
        year: a.year || "",
        hex: a.mode_s_hex || "",
        source: data.origin_label || data.source || "Registry",
      });
    } catch (err) {
      setError(err?.message || "Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const reset = () => { onVerified?.(null); setQuery(""); setError(null); };

  const handleTool = (tool) => {
    if (tool.action === "inline") { onRunOmvm?.(); return; }
    const params = new URLSearchParams();
    if (anchor?.registration) params.set("registration", anchor.registration);
    if (anchor?.make) params.set("make", anchor.make);
    if (anchor?.model) params.set("model", anchor.model);
    if (anchor?.year) params.set("year", anchor.year);
    navigate(`${tool.route}?${params.toString()}`);
  };

  const n = TOOLS.length;
  const R = 38; // % radius
  const cx = 50, cy = 46;

  const CenterNode = (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${cx}%`, top: `${cy}%` }}>
      {anchor ? (
        <div className="relative flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-[#D4AF37]/50 bg-white shadow-md dark:bg-card md:h-24 md:w-24"
          style={{ boxShadow: "0 0 0 6px rgba(212,175,55,0.10), 0 10px 28px rgba(0,0,0,0.12)" }}>
          <Plane className="h-7 w-7 text-[#D4AF37] md:h-9 md:w-9" />
          <span className="mt-0.5 max-w-[5rem] truncate text-[8px] font-black uppercase tracking-wider text-muted-foreground">
            {anchor.registration}
          </span>
          <button onClick={reset} aria-label="Change aircraft"
            className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow">
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <form onSubmit={verify} className="w-64 rounded-2xl border border-[#D4AF37]/40 bg-white p-5 text-center shadow-lg dark:bg-card"
          style={{ boxShadow: "0 8px 28px rgba(0,0,0,0.10)" }}>
          <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.08]">
            <Plane className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <p className="mb-2.5 text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Aircraft tail number</p>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setError(null); }}
            placeholder="N123AB"
            className="w-full rounded-full border border-black/[0.06] bg-black/[0.03] px-4 py-2.5 text-center font-mono text-sm uppercase tracking-wide outline-none focus:border-[#D4AF37]/50 dark:border-white/10 dark:bg-white/[0.05]"
          />
          <button type="submit" disabled={verifying}
            className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#C9A22F] disabled:opacity-60">
            {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />}
            Verify
          </button>
          {error && <p className="mt-2 text-[10px] text-destructive">{error}</p>}
        </form>
      )}
    </div>
  );

  return (
    <div className="relative">
      <style>{`@keyframes vs-flow{to{stroke-dashoffset:-16}}.vs-line{animation:vs-flow 1.2s linear infinite}`}</style>

      {/* Radial canvas (desktop / tablet) — search field is the center, tools around it */}
      <div className="relative mx-auto hidden aspect-square max-h-[72vh] w-full max-w-3xl sm:block">
        <svg className="absolute inset-0 h-full w-full text-black/20 dark:text-white/15" viewBox="0 0 100 100" preserveAspectRatio="none">
          {TOOLS.map((t, i) => {
            const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
            const x = cx + R * Math.cos(ang);
            const y = cy + R * Math.sin(ang);
            return (
              <line key={t.key} x1={x} y1={y} x2={cx} y2={cy}
                stroke="currentColor" strokeWidth={1} strokeOpacity={0.45}
                strokeDasharray="2 5" className="vs-line" vectorEffect="non-scaling-stroke" />
            );
          })}
        </svg>

        {CenterNode}

        {TOOLS.map((t, i) => {
          const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
          const x = cx + R * Math.cos(ang);
          const y = cy + R * Math.sin(ang);
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => handleTool(t)}
              className="group absolute -translate-x-1/2 -translate-y-1/2">
              <div className="flex w-16 flex-col items-center gap-1 md:w-20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-black/[0.06] bg-white shadow-sm transition group-hover:scale-110 group-hover:shadow-md dark:border-white/10 dark:bg-white/[0.06] md:h-14 md:w-14">
                  <Icon className="h-5 w-5 md:h-6 md:w-6" style={{ color: t.accent }} />
                </div>
                <span className="max-w-[4.5rem] text-center text-[9px] font-bold leading-tight text-neutral-500 group-hover:text-foreground dark:text-neutral-400 md:text-[10px]">
                  {t.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mobile: central search + grid */}
      <div className="sm:hidden">
        {anchor ? (
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-600">
                <BadgeCheck className="h-3 w-3" />
              </span>
              <div>
                <p className="font-mono text-base font-black text-foreground">{anchor.registration}</p>
                <p className="text-[10px] text-muted-foreground">{[anchor.year, anchor.make, anchor.model].filter(Boolean).join(" ")}</p>
              </div>
            </div>
            <button onClick={reset} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-[10px] font-bold text-muted-foreground">
              <X className="h-3 w-3" /> Change
            </button>
          </div>
        ) : (
          <form onSubmit={verify} className="mx-auto mb-5 w-full max-w-sm rounded-2xl border border-[#D4AF37]/40 bg-white p-5 text-center shadow-md dark:bg-card">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.08]">
              <Plane className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Aircraft tail number</p>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setError(null); }}
                placeholder="N123AB"
                className="flex-1 rounded-full border border-black/[0.06] bg-black/[0.03] px-3 py-2 text-center font-mono text-sm uppercase tracking-wide outline-none focus:border-[#D4AF37]/50 dark:border-white/10 dark:bg-white/[0.05]"
              />
              <button type="submit" disabled={verifying}
                className="inline-flex items-center justify-center gap-1 rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#C9A22F] disabled:opacity-60">
                {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              </button>
            </div>
            {error && <p className="mt-2 text-[10px] text-destructive">{error}</p>}
          </form>
        )}
        <div className="grid grid-cols-3 gap-3">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => handleTool(t)}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-black/[0.06] bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
                <Icon className="h-5 w-5" style={{ color: t.accent }} />
                <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}