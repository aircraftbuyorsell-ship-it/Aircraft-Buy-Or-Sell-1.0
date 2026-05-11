import { useState, useEffect } from "react";
import {
  ShieldCheck, Plane, Radar, BarChart3, Calculator,
  Handshake, Users, Zap, ChevronRight, ChevronLeft, X
} from "lucide-react";

const TOUR_STEPS = [
  {
    n: 1,
    title: "ATI Score Card",
    desc: "Get key insights and transparency scores for any aircraft.",
    icon: ShieldCheck,
    speech: "Hi! I'm Max, your ABOS guide! Let's start with the ATI Score Card — your aircraft's trust passport! 🛫",
  },
  {
    n: 2,
    title: "Listings",
    desc: "View all your active aircraft listings in one place.",
    icon: Plane,
    speech: "Here you'll find all aircraft on the market — swipe like Tinder or browse the list view! ✈️",
  },
  {
    n: 3,
    title: "Deal Radar",
    desc: "Discover hot deals — aircraft priced below market value.",
    icon: Radar,
    speech: "Deal Radar catches aircraft priced 8%+ below market with ATI 93+. These go fast! 🎯",
  },
  {
    n: 4,
    title: "Analytics",
    desc: "Get insights into market trends and price movements.",
    icon: BarChart3,
    speech: "Analytics shows real price trends, time-on-market data, and AI market forecasts. 📊",
  },
  {
    n: 5,
    title: "OPEX Calculator",
    desc: "Calculate real ownership costs before you buy.",
    icon: Calculator,
    speech: "Don't just think about purchase price — know your true annual ownership cost before signing! 🔢",
  },
  {
    n: 6,
    title: "Escrow",
    desc: "Secure aircraft transactions with protected escrow services.",
    icon: Handshake,
    speech: "Our escrow system protects both buyer and seller — funds are secured before the aircraft moves! 🤝",
  },
  {
    n: 7,
    title: "Leads CRM",
    desc: "Manage your buyer leads and track your sales pipeline.",
    icon: Users,
    speech: "Capture buyer leads directly from listings and track them through your sales pipeline! 👥",
  },
  {
    n: 8,
    title: "Credits & Plans",
    desc: "Credits & plans to power your ABOS experience.",
    icon: Zap,
    speech: "Credits never expire! Verify your account to get your starter pack. You're all set — happy flying! 🚀",
  },
];

const TOUR_KEY = "abos_tour_completed_v3";

const PILOT_AVATAR = "https://media.base44.com/images/public/69f665b6d05c695ac1e7b353/b544f2587_generated_image.png";

export default function ABOSTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [speechVisible, setSpeechVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
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

  if (!visible) return null;

  const isLast = step === TOUR_STEPS.length - 1;
  const currentStep = TOUR_STEPS[step];

  // Show 8 cards in a 2-column grid overview, highlight active one
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[600px] overflow-hidden">

        {/* ── Header ── */}
        <div className="relative bg-[#4A90D9] px-6 pt-5 pb-4 pr-[230px]">
          {/* Logo + title row */}
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
              <Plane className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white/90 text-xs font-bold uppercase tracking-wider">ABOS</span>
          </div>
          <h2 className="text-white text-2xl font-black">ABOS Tour</h2>

          {/* Close button */}
          <button
            onClick={close}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Pilot avatar + speech bubble */}
          <div className="absolute top-1 right-4 flex items-end gap-2">
            {/* Speech bubble */}
            <div
              className={`relative max-w-[200px] bg-white rounded-2xl rounded-br-none px-3 py-2 shadow-md transition-all duration-300 ${
                speechVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
              style={{ transformOrigin: "bottom right" }}
            >
              <p className="text-[11px] text-[#1A1814] leading-snug font-medium">{currentStep.speech}</p>
              {/* Tail pointing right-down */}
              <div className="absolute -right-2 bottom-0 w-0 h-0 border-t-[8px] border-t-transparent border-l-[10px] border-l-white border-b-0" />
            </div>
            {/* Avatar with multiply blend to remove white bg */}
            <img
              src={PILOT_AVATAR}
              alt="ABOS Guide Pilot"
              className="h-[100px] w-auto object-contain shrink-0"
              style={{ mixBlendMode: "multiply" }}
            />
          </div>
        </div>

        {/* ── Feature Grid ── */}
        <div className="px-5 pt-6 pb-4 grid grid-cols-2 gap-3">
          {TOUR_STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = s.n === currentStep.n;
            return (
              <button
                key={s.n}
                onClick={() => setStep(s.n - 1)}
                className={`relative text-left rounded-xl border p-4 transition-all ${
                  isActive
                    ? "border-[#4A90D9] bg-[#EBF4FF] shadow-sm"
                    : "border-black/[0.08] bg-white hover:border-[#4A90D9]/40 hover:bg-[#F7FAFF]"
                }`}
              >
                {/* Step number */}
                <span className={`absolute top-2.5 left-3 text-[10px] font-black ${isActive ? "text-[#4A90D9]" : "text-[#AAA49C]"}`}>
                  {s.n}
                </span>

                <div className="flex items-start gap-3 mt-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-[#4A90D9]" : "bg-[#EBF4FF]"}`}>
                    <Icon className={`w-4.5 h-4.5 ${isActive ? "text-white" : "text-[#4A90D9]"} w-[18px] h-[18px]`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[13px] font-black leading-tight ${isActive ? "text-[#1A1814]" : "text-[#1A1814]"}`}>
                      {s.title}
                    </p>
                    <p className="text-[11px] text-[#6B6560] mt-0.5 leading-tight">{s.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Dot indicators ── */}
        <div className="flex items-center justify-center gap-1.5 py-2">
          {TOUR_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`rounded-full transition-all duration-300 ${
                i === step ? "w-4 h-2 bg-[#4A90D9]" : "w-2 h-2 bg-[#D9D3CA]"
              }`}
            />
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-black/[0.06]">
          <button
            onClick={prev}
            disabled={step === 0}
            className="px-5 py-2 rounded-xl border border-black/[0.12] text-[#6B6560] text-sm font-bold disabled:opacity-30 hover:border-[#4A90D9] transition-colors"
          >
            Previous
          </button>

          <span className="text-[12px] text-[#AAA49C] font-semibold">
            Step {step + 1} of {TOUR_STEPS.length}
          </span>

          <button
            onClick={next}
            className="px-5 py-2 rounded-xl bg-[#4A90D9] hover:bg-[#3A7EC5] text-white text-sm font-black transition-colors"
          >
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}