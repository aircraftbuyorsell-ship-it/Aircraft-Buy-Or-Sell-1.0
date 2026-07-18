import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, CircleCheck, DollarSign, User } from "lucide-react";
import { getAircraftStatusLabel } from "@/hooks/useHeroAircraft";

const HERO_PHOTO = "https://media.base44.com/images/public/69f665b6d05c695ac1e7b353/bbf0ad58a_generated_image.png";

const TRUST_ITEMS = [
  { icon: BarChart3, label: "170K+ Aircraft records" },
  { icon: CircleCheck, label: "Verified ownership signals" },
  { icon: ArrowRight, label: "One connected deal workflow" },
];

const PANEL_LINKS = [
  { icon: BarChart3, label: "ATI Report", to: "/ati-full-report" },
  { icon: User, label: "Owner", to: "/n-lookup" },
  { icon: DollarSign, label: "Costs", to: "/opex-calculator" },
];

export default function AircraftIntelligenceHero({ aircraft }) {
  const reg = aircraft?.registration;
  const typeLabel = aircraft ? [aircraft.manufacturer, aircraft.model].filter(Boolean).join(" ") : "";
  const atiLabel = aircraft?.atiScore != null ? `ATI ${Math.round(aircraft.atiScore)}` : "ATI pending";

  return (
    <section className="relative overflow-hidden" style={{ background: "#fbfaf7" }}>
      {/* Full-width aircraft photography */}
      <div className="relative min-h-[560px] sm:min-h-[640px]">
        <img src={HERO_PHOTO} alt="Business jet in front of a modern hangar" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/30 to-transparent" />

        <div className="relative mx-auto flex min-h-[560px] max-w-[1440px] flex-col justify-center px-5 py-16 sm:min-h-[640px] sm:px-10">
          <div className="max-w-lg">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#3a3a3a]">Aviation Intelligence Platform</p>
            <h2 className="mb-4 text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-[#111] sm:text-5xl">
              Know what you are buying before the deal begins.
            </h2>
            <p className="mb-6 max-w-sm text-sm leading-6 text-[#3f3f3f]">
              Connect aircraft identity, available records, ownership context, valuation, documents and market intelligence.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={reg ? `/twin/${reg}` : "/ati-center"} className="rounded-md bg-[#111] px-6 py-3 text-xs font-bold text-white hover:opacity-90">View Aircraft Intelligence</Link>
              <Link to="/ati-full-report" className="flex items-center gap-2 rounded-md border border-black/15 bg-white/70 px-6 py-3 text-xs font-semibold text-[#111] backdrop-blur hover:bg-white">Open ATI Report <ArrowRight size={13} /></Link>
            </div>
          </div>

          {/* Floating intelligence panel — bound to the shared session aircraft */}
          <div className="mt-8 w-full max-w-[280px] rounded-xl border border-black/10 bg-white/85 p-4 shadow-lg backdrop-blur-xl lg:absolute lg:right-10 lg:top-1/2 lg:mt-0 lg:-translate-y-1/2">
            <div className="mb-3">
              <p className="text-lg font-bold leading-tight text-[#111]">{reg || "Aircraft record"}</p>
              <p className="text-xs text-[#666]">{typeLabel || "Intelligence"}</p>
            </div>
            <div className="mb-3 flex items-center justify-between rounded-lg border border-black/8 bg-white px-3 py-2">
              <span className="text-[11px] font-semibold text-[#333]">{atiLabel}</span>
              <span className="h-4 w-4 rounded-full border-2 border-[#D4A017] border-t-transparent" />
            </div>
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-black/8 bg-white px-3 py-2 text-[11px] font-medium text-[#444]">
              <CircleCheck size={13} className="text-[#D4A017]" /> {aircraft ? getAircraftStatusLabel(aircraft) : "Record on file"}
            </div>
            <div className="mb-4 rounded-lg border border-black/8 bg-white px-3 py-2">
              <div className="flex justify-between text-[10px] text-[#555]"><span>Source</span><span className="font-bold">{aircraft?.registrySource || "—"}</span></div>
            </div>
            <div className="space-y-1.5">
              {PANEL_LINKS.map(({ icon: Icon, label, to }) => (
                <Link key={label} to={to} className="flex items-center gap-2 rounded-lg border border-black/8 bg-white px-3 py-2 text-[11px] font-medium text-[#333] hover:bg-black/[0.03]">
                  <Icon size={13} /> {label} <ArrowRight size={12} className="ml-auto text-[#999]" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trust bar */}
      <div className="border-t border-black/8 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-around sm:px-10">
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 text-xs font-semibold text-[#222]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-black/12"><Icon size={15} /></span>
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}