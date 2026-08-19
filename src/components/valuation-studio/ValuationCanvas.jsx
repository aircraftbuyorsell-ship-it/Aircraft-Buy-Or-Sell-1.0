import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { lookupAircraft } from "@/lib/aircraftLookup";
import {
  Plane, Search, Loader2, BadgeCheck, X, SlidersHorizontal, Zap, FileText,
  Calculator, HandCoins, ShieldCheck, Radar, Paintbrush, Armchair,
  Sparkles, GitCompare, Users, FileSignature, Globe,
} from "lucide-react";

const TOOLS = [
  { key: "omvm", label: "OMVM Valuation", icon: SlidersHorizontal, action: "inline", accent: "#D4A017" },
  { key: "ati_quick", label: "ATI Quick Score", icon: Zap, action: "route", route: "/ati-quick-score", accent: "#00d4ff" },
  { key: "ati_full", label: "ATI Full Report", icon: FileText, action: "route", route: "/ati-full-report", accent: "#00d4ff" },
  { key: "opex", label: "Operating Costs", icon: Calculator, action: "route", route: "/opex-calculator", accent: "#22c55e" },
  { key: "leasing", label: "Leasing", icon: HandCoins, action: "route", route: "/leasing-calculator", accent: "#22c55e" },
  { key: "insurance", label: "Insurance", icon: ShieldCheck, action: "route", route: "/insurance-calculator", accent: "#22c55e" },
  { key: "avionics", label: "Avionics Upgrade", icon: Radar, action: "route", route: "/avionics-upgrade-calculator", accent: "#a855f7" },
  { key: "exterior", label: "Exterior Refurb", icon: Paintbrush, action: "route", route: "/exterior-refurbishment-calculator", accent: "#a855f7" },
  { key: "interior", label: "Interior Refurb", icon: Armchair, action: "route", route: "/interior-refurbishment-calculator", accent: "#a855f7" },
  { key: "detailing", label: "Detailing", icon: Sparkles, action: "route", route: "/aircraft-detailing-calculator", accent: "#a855f7" },
  { key: "compare", label: "Upgrade Compare", icon: GitCompare, action: "route", route: "/upgrade-comparison", accent: "#a855f7" },
  { key: "fractional", label: "Fractional", icon: Users, action: "route", route: "/fractional-calculators", accent: "#f97316" },
  { key: "billofsale", label: "Bill of Sale", icon: FileSignature, action: "route", route: "/bill-of-sale", accent: "#f97316" },
  { key: "registry", label: "Registry Compare", icon: Globe, action: "route", route: "/registry-comparator", accent: "#f97316" },
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

  // ── No anchor: search / verify prompt ──
  if (!anchor) {
    return (
      <div className="flex min-h-[58vh] flex-col items-center justify-center text-center">
        <div className="relative mb-8">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-[#D4A017]/30 bg-[#D4A017]/[0.06]">
            <Plane className="h-11 w-11 text-[#D4A017]" />
          </div>
          <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">Anchor your deal to an aircraft</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Enter a tail number. We verify it against the registry, then every tool on the board connects to that aircraft.
        </p>
        <form onSubmit={verify} className="mt-6 flex w-full max-w-sm gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. N123AB"
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm uppercase tracking-wide outline-none focus:border-[#D4A017]/50"
          />
          <button type="submit" disabled={verifying}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#D4A017,#A67C00)" }}>
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
            Verify
          </button>
        </form>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  // ── Anchor present: radial board ──
  const n = TOOLS.length;
  const R = 38; // % radius
  const cx = 50, cy = 46;

  return (
    <div className="relative">
      <style>{`@keyframes vs-flow{to{stroke-dashoffset:-16}}.vs-line{animation:vs-flow 1.2s linear infinite}`}</style>

      {/* Verified aircraft strip */}
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600">
            <BadgeCheck className="h-3 w-3" /> Verified
          </span>
          <div>
            <p className="font-mono text-lg font-black tracking-wide text-foreground">{anchor.registration}</p>
            <p className="text-xs text-muted-foreground">
              {[anchor.year, anchor.make, anchor.model].filter(Boolean).join(" ") || anchor.source}
            </p>
          </div>
        </div>
        <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" /> Change aircraft
        </button>
      </div>

      {/* Radial canvas (desktop / tablet) */}
      <div className="relative mx-auto hidden aspect-square max-h-[72vh] w-full max-w-3xl sm:block">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {TOOLS.map((t, i) => {
            const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
            const x = cx + R * Math.cos(ang);
            const y = cy + R * Math.sin(ang);
            return (
              <line key={t.key} x1={x} y1={y} x2={cx} y2={cy}
                stroke={t.accent} strokeWidth={1.2} strokeOpacity={0.5}
                strokeDasharray="3 5" className="vs-line" vectorEffect="non-scaling-stroke" />
            );
          })}
        </svg>

        {/* Center anchor */}
        <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${cx}%`, top: `${cy}%` }}>
          <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-[#D4A017]/40 bg-card md:h-24 md:w-24"
            style={{ boxShadow: "0 0 0 6px rgba(212,160,23,0.08), 0 12px 32px rgba(0,0,0,0.18)" }}>
            <Plane className="h-7 w-7 text-[#D4A017] md:h-9 md:w-9" />
            <span className="mt-0.5 max-w-[5rem] truncate text-[8px] font-black uppercase tracking-wider text-muted-foreground">
              {anchor.registration}
            </span>
          </div>
        </div>

        {/* Tool nodes */}
        {TOOLS.map((t, i) => {
          const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
          const x = cx + R * Math.cos(ang);
          const y = cy + R * Math.sin(ang);
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => handleTool(t)}
              className="group absolute -translate-x-1/2 -translate-y-1/2">
              <div className="flex w-16 flex-col items-center gap-1 md:w-20">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-card transition group-hover:scale-110 group-hover:shadow-lg md:h-14 md:w-14"
                  style={{ borderColor: `${t.accent}55`, boxShadow: `0 4px 14px ${t.accent}22` }}>
                  <Icon className="h-5 w-5 md:h-6 md:w-6" style={{ color: t.accent }} />
                </div>
                <span className="max-w-[4.5rem] text-center text-[9px] font-bold leading-tight text-muted-foreground group-hover:text-foreground md:text-[10px]">
                  {t.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mobile grid fallback */}
      <div className="mt-4 grid grid-cols-3 gap-3 sm:hidden">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => handleTool(t)}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3">
              <Icon className="h-5 w-5" style={{ color: t.accent }} />
              <span className="text-[9px] font-bold text-muted-foreground">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}