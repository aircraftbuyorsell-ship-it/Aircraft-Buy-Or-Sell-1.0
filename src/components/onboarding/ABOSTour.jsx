import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck, Plane, Radar, BarChart3, Calculator,
  Handshake, Users, Zap, ChevronRight, ChevronLeft, X,
  LayoutDashboard, MessageCircle, TrendingUp, CreditCard,
  ArrowRight, MapPin, Play
} from "lucide-react";
import { useTheme } from "@/lib/useTheme";

const TOUR_STEPS = [
  {
    n: 1,
    title: "Dashboard Overview",
    desc: "Your command center — see active listings, ATI scores, deal radar alerts, and market pulse at a glance.",
    icon: LayoutDashboard,
    route: "/",
    speech: "Welcome to ABOS MarketSpace! This is your Dashboard — the central hub for monitoring aircraft listings, ATI scores, and live market intelligence.",
  },
  {
    n: 2,
    title: "Aircraft Listings",
    desc: "Browse all active aircraft with ATI transparency scores. Swipe to compare, tap for full passport reports.",
    icon: Plane,
    route: "/listings",
    speech: "The Listings page is your aircraft marketplace — every listing has an ATI score showing its transaction readiness. Tap any aircraft for the full report!",
  },
  {
    n: 3,
    title: "Live Traffic Radar",
    desc: "Real-time ADS-B aircraft tracking worldwide. Search by N-number, see ABOS-matched listings on the map.",
    icon: Radar,
    route: "/traffic",
    speech: "This is our Live Traffic map — see real aircraft in the air right now! Search any N-number and instantly create an ATI card from the popup.",
  },
  {
    n: 4,
    title: "Deal Radar",
    desc: "Spot aircraft priced 8%+ below market value. High ATI scores + below-market pricing = hot deals.",
    icon: Radar,
    route: "/deal-radar",
    speech: "Deal Radar finds the best opportunities — aircraft priced well below their estimated market value. These deals move fast!",
  },
  {
    n: 5,
    title: "Compare Aircraft",
    desc: "Compare up to 3 aircraft side-by-side on specs, pricing, ATI scores, and ownership costs.",
    icon: ShieldCheck,
    route: "/compare",
    speech: "Use the Compare tool to evaluate up to 3 aircraft at once — see ATI scores, pricing, and operating costs side by side for smarter decisions.",
  },
  {
    n: 6,
    title: "ATI Passport Report",
    desc: "Full 8-dimension transparency report: documentation, engine, avionics, airframe, and transaction readiness.",
    icon: ShieldCheck,
    route: "/listings",
    speech: "The ATI Passport is your aircraft's trust document — 8 dimensions of scoring covering documentation, maintenance history, avionics, and more.",
  },
  {
    n: 7,
    title: "Market Analytics",
    desc: "Price trends, time-on-market data, category breakdowns, and AI-generated market forecasts.",
    icon: BarChart3,
    route: "/analytics",
    speech: "Analytics gives you real market data — see price trends, how long aircraft sit on the market, and what's selling fastest.",
  },
  {
    n: 8,
    title: "Market Reports",
    desc: "AI-generated aviation market intelligence with macro-economic signals, regional analysis, and predictions.",
    icon: TrendingUp,
    route: "/market-reports",
    speech: "Our AI generates comprehensive market reports analyzing macro trends, regional demand, and forward-looking predictions for aviation.",
  },
  {
    n: 9,
    title: "OPEX Calculator",
    desc: "Calculate true annual ownership costs — fuel, maintenance, insurance, hangar, reserves — before you buy.",
    icon: Calculator,
    route: "/opex-calculator",
    speech: "Don't just look at the purchase price! The OPEX Calculator shows you the real annual cost of owning any aircraft.",
  },
  {
    n: 10,
    title: "Valuation Engine",
    desc: "Expert aircraft valuation using Off-Market Value Model with market comparables and depreciation curves.",
    icon: TrendingUp,
    route: "/valuation",
    speech: "Get an expert valuation for any aircraft using our OMVM engine — it factors in market comparables, age, condition, and equipment.",
  },
  {
    n: 11,
    title: "Secure Escrow",
    desc: "Protected buyer-seller transactions with automated commission splits, finder's fees, and payout tracking.",
    icon: Handshake,
    route: "/escrow",
    speech: "Our escrow system protects both buyer and seller — funds are held securely until all conditions are met. Full transparency on commissions!",
  },
  {
    n: 12,
    title: "Leads CRM",
    desc: "Manage buyer leads through your sales pipeline. Score lead quality, track engagement, and close more deals.",
    icon: Users,
    route: "/leads",
    speech: "Every lead from your listings flows into the CRM — track their status, score their quality, and manage follow-ups all in one place.",
  },
  {
    n: 13,
    title: "Ask Max (AI Assistant)",
    desc: "AI aviation expert for pre-buy inspections, valuations, market advice, and aircraft research.",
    icon: MessageCircle,
    route: "/max-chat",
    speech: "Max is your AI aviation assistant — ask about aircraft specs, market values, pre-buy inspections, or get help navigating the platform!",
  },
  {
    n: 14,
    title: "IntraZone Sales Suite",
    desc: "Professional sales intelligence: lead scoring, deal pipeline management, matching engine, and negotiation briefs.",
    icon: Zap,
    route: "/intrazone",
    speech: "IntraZone is your professional sales cockpit — match buyers to aircraft, score leads, and get AI-powered negotiation briefs.",
  },
  {
    n: 15,
    title: "Credits & Subscription",
    desc: "Purchase token packs, manage your credit balance, and choose the plan that fits your aviation business.",
    icon: CreditCard,
    route: "/pricing",
    speech: "Credits never expire! Choose a plan that fits your needs — from free Explorer tier to professional-grade plans with full platform access.",
  },
];

const TOUR_KEY = "abos_tour_completed_v3";

const PILOT_AVATAR = "https://media.base44.com/images/public/69f665b6d05c695ac1e7b353/b544f2587_generated_image.png";

export default function ABOSTour() {
  const isDark = useTheme();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [speechVisible, setSpeechVisible] = useState(false);

  // Auto-open on first visit
  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for manual re-open via custom event
  useEffect(() => {
    const handler = () => {
      localStorage.removeItem(TOUR_KEY);
      setStep(0);
      setVisible(true);
    };
    window.addEventListener("abos-tour-open", handler);
    return () => window.removeEventListener("abos-tour-open", handler);
  }, []);

  // Re-trigger speech bubble animation on step change
  useEffect(() => {
    setSpeechVisible(false);
    const t = setTimeout(() => setSpeechVisible(true), 120);
    return () => clearTimeout(t);
  }, [step]);

  const close = () => {
    localStorage.setItem(TOUR_KEY, "1");
    setVisible(false);
  };

  const next = () => {
    if (step < TOUR_STEPS.length - 1) setStep(s => s + 1);
    else close();
  };

  const prev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const goToFeature = () => {
    const currentStep = TOUR_STEPS[step];
    if (currentStep.route) {
      close();
      navigate(currentStep.route);
    }
  };

  if (!visible) return null;

  const isLast = step === TOUR_STEPS.length - 1;
  const currentStep = TOUR_STEPS[step];
  const bgColor = isDark ? "#0B1220" : "#fff";
  const textColor = isDark ? "#fff" : "#1A1814";
  const mutedColor = isDark ? "rgba(255,255,255,0.5)" : "#6B6560";
  const subColor = isDark ? "rgba(255,255,255,0.3)" : "#AAA49C";
  const accentBlue = isDark ? "#E8A83A" : "#C98A1E";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const activeBg = isDark ? "rgba(232,168,58,0.1)" : "#FBF3E3";
  const activeBorder = isDark ? "rgba(232,168,58,0.35)" : "#C98A1E";
  const headerBg = isDark ? "linear-gradient(135deg, #13203A, #0B1220)" : "#0B2D5B";
  const footerBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const progressPct = ((step + 1) / TOUR_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="rounded-2xl shadow-2xl w-full max-w-[460px] overflow-hidden flex flex-col" style={{ background: bgColor, border: isDark ? "1px solid rgba(232,168,58,0.15)" : "none" }}>

        {/* ── Progress bar ── */}
        <div className="h-1 w-full" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "#EBF4FF" }}>
          <div className="h-full transition-all duration-500 ease-out" style={{ width: `${progressPct}%`, background: accentBlue }} />
        </div>

        {/* ── Header ── */}
        <div className="relative px-6 pt-5 pb-5" style={{ background: headerBg }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
              <Plane className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white/90 text-xs font-bold uppercase tracking-wider">ABOS MarketSpace</span>
          </div>
          <h2 className="text-white text-lg font-black">Platform Tour</h2>
          <p className="text-white/60 text-[11px] mt-0.5">Step {currentStep.n} of {TOUR_STEPS.length}</p>

          <button
            onClick={close}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Single focused step ── */}
        <div key={step} className="px-6 pt-7 pb-5 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Big icon */}
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: isDark ? "rgba(232,168,58,0.12)" : "#FBF3E3", border: `1px solid ${activeBorder}` }}>
              <currentStep.icon className="w-9 h-9" style={{ color: accentBlue }} />
            </div>
          </div>

          <h3 className="text-center font-black text-xl mb-2" style={{ color: textColor }}>{currentStep.title}</h3>
          <p className="text-center text-[13px] leading-relaxed px-2 mb-4" style={{ color: mutedColor }}>{currentStep.desc}</p>

          {/* Pilot speech bubble */}
          <div className={`flex items-end gap-2 justify-center transition-all duration-300 ${speechVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
            <img src={PILOT_AVATAR} alt="ABOS Guide" className="h-[64px] w-auto object-contain shrink-0" style={{ mixBlendMode: isDark ? "normal" : "multiply" }} />
            <div className="relative max-w-[280px] rounded-2xl rounded-bl-none px-3.5 py-2.5 shadow-lg mb-2" style={{ background: isDark ? "#13203A" : "#EBF4FF", border: isDark ? "1px solid rgba(232,168,58,0.15)" : "none" }}>
              <p className="text-[11px] leading-snug font-medium" style={{ color: textColor }}>{currentStep.speech}</p>
              <div className="absolute -left-2 bottom-0 w-0 h-0 border-t-[8px] border-t-transparent border-r-[10px]" style={{ borderRightColor: isDark ? "#13203A" : "#EBF4FF" }} />
            </div>
          </div>

          {currentStep.route && (
            <button
              onClick={goToFeature}
              className="w-full inline-flex items-center justify-center gap-1.5 mt-5 px-4 py-2.5 rounded-xl text-[12px] font-black transition-all active:scale-95"
              style={{ background: isDark ? "rgba(232,168,58,0.12)" : "#FBF3E3", color: accentBlue, border: `1px solid ${activeBorder}` }}
            >
              <Play className="w-3.5 h-3.5" /> Open {currentStep.title} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── Dot indicators ── */}
        <div className="flex items-center justify-center flex-wrap gap-1 pb-3 px-5">
          {TOUR_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? 14 : 6,
                height: 6,
                background: i === step ? accentBlue : (isDark ? "rgba(255,255,255,0.15)" : "#D9D3CA"),
              }}
            />
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: `1px solid ${footerBorder}` }}>
          <button
            onClick={prev}
            disabled={step === 0}
            className="px-4 py-2 rounded-xl border text-sm font-bold disabled:opacity-30 transition-colors"
            style={{ borderColor: cardBorder, color: mutedColor }}
          >
            <ChevronLeft className="w-4 h-4 inline -ml-1" /> Back
          </button>

          <button
            onClick={close}
            className="text-[11px] font-semibold underline transition-opacity hover:opacity-70"
            style={{ color: subColor }}
          >
            Skip tour
          </button>

          <button
            onClick={next}
            className="px-5 py-2 rounded-xl text-sm font-black transition-all active:scale-95 flex items-center gap-1"
            style={{ background: accentBlue, color: isDark ? "#0B1220" : "#fff" }}
          >
            {isLast ? "Finish" : "Next"} {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}