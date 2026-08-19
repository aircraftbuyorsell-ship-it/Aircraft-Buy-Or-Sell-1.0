import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Plane, Radar, Scale, GitBranch, Handshake, X, ChevronLeft,
  ChevronRight, Play, RotateCcw, Sparkles,
} from "lucide-react";
import { useTheme } from "@/lib/useTheme";

const TOUR_STEPS = [
  {
    n: 0,
    title: "The Marketplace",
    kicker: "Marketspace · Listings",
    route: "/listings",
    icon: Plane,
    accent: "#D4A017",
    body: "Every aircraft on ABOS carries an ATI transparency score — a trust signal forged from registry data, maintenance history, and market intelligence. This isn't a classifieds page. It's a living market, scored, ranked, and ready for your next move.",
    cta: "Hunt the deal",
  },
  {
    n: 1,
    title: "Hunt the Deal",
    kicker: "Marketspace · Deal Radar",
    route: "/deal-radar",
    icon: Radar,
    accent: "#14B8A6",
    body: "Deal Radar scans every active listing against our Off-Market Value Model. When an aircraft lands 8% or more below its true market value, it lights up here. These deals move fast — the radar gives you the edge to move first.",
    cta: "Compare the options",
  },
  {
    n: 2,
    title: "Side by Side",
    kicker: "Marketspace · Compare",
    route: "/compare",
    icon: Scale,
    accent: "#3B82F6",
    body: "Line up to three aircraft and watch the truth emerge — specs, pricing, ATI scores, and ownership costs laid bare in a single view. No spreadsheets, no guesswork. Just clarity, the moment you need it most.",
    cta: "Run the pipeline",
  },
  {
    n: 3,
    title: "The Deal Chain",
    kicker: "Marketspace · Sales Pipeline",
    route: "/sales-pipeline",
    icon: GitBranch,
    accent: "#8B5CF6",
    body: "From first contact to final handover, the Sales Pipeline orchestrates every milestone — verification, valuation, inspection, documents, and closing. AI-driven steps execute in one click, so your deal never stalls.",
    cta: "Seal the deal",
  },
  {
    n: 4,
    title: "Seal the Deal",
    kicker: "Marketspace · Escrow",
    route: "/escrow",
    icon: Handshake,
    accent: "#22C55E",
    body: "When the deal is won, ABOS Escrow holds the funds securely until every condition is met — automated commission splits, finder's fees, and payout tracking built in. Both sides protected. Every transaction, transparent to the cent.",
    cta: "Finish the tour",
  },
];

const ACTIVE_KEY = "abos_marketspace_tour_active";
const STEP_KEY = "abos_marketspace_tour_step";
const DONE_KEY = "abos_marketspace_tour_completed";
const AUTO_MS = 13000;

export function openMarketspaceTour() {
  sessionStorage.setItem(ACTIVE_KEY, "1");
  sessionStorage.setItem(STEP_KEY, "0");
  window.dispatchEvent(new Event("abos-marketspace-tour-open"));
}

export function isMarketspaceTourDone() {
  return localStorage.getItem(DONE_KEY) === "1";
}

export default function MarketspaceTour() {
  const isDark = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(0);

  const open = useCallback(() => {
    const s = parseInt(sessionStorage.getItem(STEP_KEY) || "0", 10);
    setStep(s);
    setActive(true);
    setPaused(false);
  }, []);

  // listen for open event
  useEffect(() => {
    if (sessionStorage.getItem(ACTIVE_KEY) === "1") open();
    const handler = () => open();
    window.addEventListener("abos-marketspace-tour-open", handler);
    return () => window.removeEventListener("abos-marketspace-tour-open", handler);
  }, [open]);

  // navigate to the current step's route
  useEffect(() => {
    if (!active) return;
    const target = TOUR_STEPS[step];
    if (target && pathname !== target.route) navigate(target.route);
  }, [active, step, pathname, navigate]);

  // auto-advance progress bar
  useEffect(() => {
    if (!active || paused) return;
    setProgress(0);
    startRef.current = performance.now();
    let mounted = true;
    const tick = (now) => {
      if (!mounted || paused) return;
      const elapsed = now - startRef.current;
      const pct = Math.min(100, (elapsed / AUTO_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        next();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { mounted = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step, paused]);

  const close = useCallback(() => {
    localStorage.setItem(DONE_KEY, "1");
    sessionStorage.removeItem(ACTIVE_KEY);
    setActive(false);
  }, []);

  const next = useCallback(() => {
    setStep((s) => {
      if (s >= TOUR_STEPS.length - 1) { close(); return s; }
      const ns = s + 1;
      sessionStorage.setItem(STEP_KEY, String(ns));
      return ns;
    });
  }, [close]);

  const prev = useCallback(() => {
    setStep((s) => {
      if (s <= 0) return s;
      const ns = s - 1;
      sessionStorage.setItem(STEP_KEY, String(ns));
      return ns;
    });
  }, []);

  const replay = useCallback(() => {
    localStorage.removeItem(DONE_KEY);
    sessionStorage.setItem(STEP_KEY, "0");
    setStep(0);
    setActive(true);
    setPaused(false);
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close, next, prev]);

  if (!active) return null;

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ background: isDark ? "rgba(4,6,10,0.82)" : "rgba(11,18,32,0.62)", backdropFilter: "blur(3px)" }}>

      {/* Spotlight glow behind card */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[420px] w-[420px] rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${current.accent}33 0%, transparent 70%)` }} />
      </div>

      {/* Cinematic card */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border bg-white shadow-2xl dark:bg-card"
        style={{ borderColor: `${current.accent}55`, boxShadow: `0 30px 80px rgba(0,0,0,0.40), 0 0 0 1px ${current.accent}22` }}>

        {/* Accent top bar with progress */}
        <div className="h-1.5 w-full" style={{ background: `${current.accent}1a` }}>
          <div className="h-full transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%`, background: current.accent }} />
        </div>

        <button onClick={close} aria-label="Skip tour"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground transition hover:text-foreground">
          <X className="h-4 w-4" />
        </button>

        <div className="p-7 sm:p-9">
          {/* Step indicator */}
          <div className="mb-5 flex items-center gap-2">
            {TOUR_STEPS.map((s, i) => (
              <button key={s.n} onClick={() => { setStep(i); sessionStorage.setItem(STEP_KEY, String(i)); }}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === step ? 28 : 10,
                  background: i === step ? current.accent : (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"),
                }}
                aria-label={`Go to step ${i + 1}`} />
            ))}
            <span className="ml-auto text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              {step + 1} / {TOUR_STEPS.length}
            </span>
          </div>

          {/* Icon + kicker */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: `${current.accent}1a`, border: `1px solid ${current.accent}33` }}>
              <Icon className="h-6 w-6" style={{ color: current.accent }} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: current.accent }}>
              {current.kicker}
            </span>
          </div>

          {/* Title */}
          <h2 className="mb-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {current.title}
          </h2>

          {/* Body */}
          <p className="mb-7 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {current.body}
          </p>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button onClick={prev} disabled={step === 0}
              className="inline-flex h-10 items-center gap-1 rounded-xl border border-border px-3 text-xs font-bold text-foreground transition hover:bg-muted/60 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>

            {isLast ? (
              <button onClick={close}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black uppercase tracking-wider text-white shadow-lg transition hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${current.accent}, ${current.accent}cc)` }}>
                <Sparkles className="h-4 w-4" /> Complete Tour
              </button>
            ) : (
              <button onClick={next}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black uppercase tracking-wider text-white shadow-lg transition hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${current.accent}, ${current.accent}cc)` }}>
                {current.cta} <ChevronRight className="h-4 w-4" />
              </button>
            )}

            <button onClick={replay} aria-label="Replay from start"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:text-foreground">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-4 text-center text-[10px] text-muted-foreground">
            Use ← → arrows to navigate · Esc to skip · auto-advances every {AUTO_MS / 1000}s
          </p>
        </div>
      </div>
    </div>
  );
}