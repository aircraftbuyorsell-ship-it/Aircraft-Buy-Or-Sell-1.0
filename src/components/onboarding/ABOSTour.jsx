import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Plane, Radar, BarChart3, Calculator, Handshake, Users, Zap, ShieldCheck } from "lucide-react";

const TOUR_STEPS = [
  {
    icon: Plane,
    title: "Vítejte v ABOS",
    subtitle: "Aviation Buy/Sell Intelligence Platform",
    description: "ABOS je profesionální platforma pro nákup, prodej a analýzu letadel. Poskytuje nezávislé hodnocení, tržní valuace a inteligenci pro brokery, dealery a kupující po celé Evropě.",
    color: "#E8A83A",
    bg: "rgba(232,168,58,0.08)",
    border: "rgba(232,168,58,0.25)",
  },
  {
    icon: ShieldCheck,
    title: "ATI Score Card",
    subtitle: "Aircraft Transparency Index",
    description: "Každé letadlo dostane skóre 0–120 bodů napříč 8 dimenzemi — dokumentace, motor, avionika, technická historia, konfigurace a připravenost k prodeji. Výsledek je nezávislý, auditovatelný a sdílitelný.",
    color: "#0B2D5B",
    bg: "rgba(11,45,91,0.06)",
    border: "rgba(11,45,91,0.2)",
    tip: "Otevřete libovolné letadlo v Listings a klikněte na 'Issue ATI Score Card'",
  },
  {
    icon: Plane,
    title: "Listings",
    subtitle: "Inventář letadel s AI scoringem",
    description: "Procházejte letadla s ATI skóre, OMVM tržní valuací a deal ratingem. Swipujte jako na Tinderu — vpravo = shortlist, vlevo = přeskočit. Filtrujte podle výrobce, ATI skóre a ceny.",
    color: "#185FA5",
    bg: "rgba(24,95,165,0.06)",
    border: "rgba(24,95,165,0.2)",
    tip: "Tlačítko 'Add Aircraft' slouží k přidání nového letadla přes průvodce",
  },
  {
    icon: Radar,
    title: "Deal Radar",
    subtitle: "Hot deals v reálném čase",
    description: "Deal Radar automaticky identifikuje letadla, jejichž cena je alespoň 8 % pod tržní hodnotou a mají ATI skóre 93+. Jsou to nejlepší příležitosti na trhu — první to ví jen ABOS uživatelé.",
    color: "#0F7A56",
    bg: "rgba(15,122,86,0.06)",
    border: "rgba(15,122,86,0.2)",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    subtitle: "Tržní data a trendy",
    description: "Přehled průměrných cen, dob prodeje, ATI distribuce a nejpopulárnějších modelů. Data jsou obohacena o AI-generovaný Market Forecast každý týden z aktuálních tržních zpráv.",
    color: "#D4A017",
    bg: "rgba(212,160,23,0.06)",
    border: "rgba(212,160,23,0.2)",
  },
  {
    icon: Calculator,
    title: "OPEX Kalkulačka",
    subtitle: "Skutečné náklady vlastnictví",
    description: "Spočítejte roční provozní náklady včetně paliva, hangáru, pojištění, pravidelné údržby a rezerv na generální opravu. Regionální korekce pro Evropu i USA. Ideální nástroj pro kupující před rozhodnutím.",
    color: "#CD7F32",
    bg: "rgba(205,127,50,0.06)",
    border: "rgba(205,127,50,0.2)",
    tip: "Výsledkem je přehledná zpráva, kterou můžete sdílet s financující bankou",
  },
  {
    icon: Handshake,
    title: "Escrow",
    subtitle: "Bezpečné transakce",
    description: "Integrovaný escrow systém chrání kupujícího i prodávajícího. Spravujte celý průběh transakce — od podpisu smlouvy přes převod financí až po uzavření. Podpora pro finder's fee a brokerský waterfall.",
    color: "#A67C00",
    bg: "rgba(166,124,0,0.06)",
    border: "rgba(166,124,0,0.2)",
  },
  {
    icon: Users,
    title: "Leads CRM",
    subtitle: "Správa buyer leadů",
    description: "Zachytávejte zájemce přímo z listingů, sledujte je skrze sales pipeline a exportujte kvalifikované leady. Každý lead je propojen s konkrétním letadlem a jeho ATI skóre.",
    color: "#6B6560",
    bg: "rgba(107,101,96,0.06)",
    border: "rgba(107,101,96,0.2)",
  },
  {
    icon: Zap,
    title: "Credits & Plány",
    subtitle: "Jak fungují kredity",
    description: "Základní funkce jsou zdarma. Pokročilé funkce jako plný ATI Score Card, bulk import nebo Deal Radar spotřebovávají kredity. Kredity se nikdy nevypršají a jsou dostupné v sekci 'Credits & Plans'.",
    color: "#E8A83A",
    bg: "rgba(232,168,58,0.08)",
    border: "rgba(232,168,58,0.25)",
    tip: "Ověřením účtu získáte startovací balíček kreditů",
  },
];

const TOUR_KEY = "abos_tour_completed_v1";

export default function ABOSTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

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

  const s = TOUR_STEPS[step];
  const Icon = s.icon;
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden border-2"
        style={{ borderColor: s.border }}
      >
        {/* Gradient top bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#0B2D5B] via-[#E8A83A] to-[#0B2D5B]" />

        {/* Close */}
        <button
          onClick={close}
          className="absolute top-4 right-4 text-[#AAA49C] hover:text-[#1A1814] transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step counter */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? "16px" : "5px",
                height: "5px",
                backgroundColor: i === step ? s.color : "#D9D3CA",
              }}
            />
          ))}
        </div>

        <div className="px-7 pt-10 pb-7">
          {/* Icon */}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 mx-auto"
            style={{ backgroundColor: s.bg, border: `1.5px solid ${s.border}` }}
          >
            <Icon className="w-7 h-7" style={{ color: s.color }} />
          </div>

          {/* Text */}
          <div className="text-center mb-4">
            <p className="text-[9px] uppercase tracking-[0.2em] font-black mb-1" style={{ color: s.color }}>
              {s.subtitle}
            </p>
            <h2 className="text-xl font-black text-[#1A1814] mb-3">{s.title}</h2>
            <p className="text-sm text-[#4A4845] leading-relaxed">{s.description}</p>
          </div>

          {/* Tip */}
          {s.tip && (
            <div
              className="rounded-lg px-4 py-2.5 text-[11px] leading-relaxed mb-4"
              style={{ backgroundColor: s.bg, borderColor: s.border, borderWidth: 1, borderStyle: "solid", color: s.color }}
            >
              💡 {s.tip}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={prev}
              disabled={step === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-black/10 text-[#6B6560] text-sm font-bold disabled:opacity-30 hover:border-[#D4A017] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Zpět
            </button>

            <button
              onClick={next}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-black transition-colors"
              style={{ backgroundColor: s.color }}
            >
              {isLast ? "Začít používat ABOS" : "Dále"}
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={close}
            className="w-full mt-2 text-[11px] text-[#AAA49C] hover:text-[#6B6560] transition-colors py-1.5"
          >
            Přeskočit průvodce
          </button>
        </div>
      </div>
    </div>
  );
}