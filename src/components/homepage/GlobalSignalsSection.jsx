import { useState } from "react";
import { Radio, ShieldCheck, Users } from "lucide-react";
import GridSignalNodes from "@/components/homepage/GridSignalNodes";
import GridConnectionLines from "@/components/homepage/GridConnectionLines";

const SIGNALS = [
  { icon: ShieldCheck, label: "Registry update", value: "Verified", valueClass: "text-emerald-400", time: "5m ago", dot: "#34d399" },
  { icon: Radio, label: "Flight activity", value: "2h ago", valueClass: "text-white/60", time: "2h ago", dot: "#60a5fa" },
  { icon: Users, label: "Buyer match", value: "92%", valueClass: "text-[#F5C842]", time: "12m ago", dot: "#F5C842" },
];

const TABS = ["Flights", "Registry", "Matches"];

const NODES = [
  { top: "22%", left: "62%", color: "#F5C842", size: 7, delay: 0 },
  { top: "38%", left: "78%", color: "#34d399", size: 6, delay: 0.7 },
  { top: "55%", left: "68%", color: "#60a5fa", size: 5, delay: 1.3, desktopOnly: true },
  { top: "68%", left: "85%", color: "#F5C842", size: 5, delay: 1.9, desktopOnly: true },
  { top: "30%", left: "90%", color: "#a78bfa", size: 4, delay: 2.4, desktopOnly: true },
];

const LINES = [
  { x1: 62, y1: 22, x2: 78, y2: 38, color: "#c8a43c", opacity: 0.5 },
  { x1: 78, y1: 38, x2: 68, y2: 55, color: "#c8a43c", opacity: 0.4 },
  { x1: 68, y1: 55, x2: 85, y2: 68, color: "#7f96b8", opacity: 0.35 },
  { x1: 90, y1: 30, x2: 78, y2: 38, color: "#7f96b8", opacity: 0.3 },
];

export default function GlobalSignalsSection() {
  const [activeTab, setActiveTab] = useState("Flights");

  return (
    <section className="relative overflow-hidden" style={{ background: "#0b111a", "--grid-dot-color": "rgba(200,164,60,0.14)", "--grid-opacity": 1 }}>
      <div className="homepage-grid-layer" aria-hidden="true" />
      {/* Dark hemisphere suggestion on the right */}
      <div className="pointer-events-none absolute -right-[15%] top-1/2 hidden h-[130%] w-[55%] -translate-y-1/2 rounded-full lg:block" style={{ background: "radial-gradient(circle at 35% 40%, rgba(245,194,66,0.10) 0%, rgba(30,40,58,0.9) 45%, rgba(11,17,26,0) 72%)" }} aria-hidden="true" />
      <GridConnectionLines lines={LINES} />
      <GridSignalNodes nodes={NODES} />

      <div className="relative mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="max-w-md">
          <p className="mb-2 text-[11px] font-semibold text-white/60"><span className="font-bold text-[#F5C842]">N721AB</span> · Phenom 300E · Deal AB-1042</p>
          <h2 className="mb-8 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Global Signals</h2>

          <div className="space-y-2.5">
            {SIGNALS.map(({ icon: Icon, label, value, valueClass, time, dot }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 backdrop-blur">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]"><Icon size={15} className="text-white/70" /></span>
                <span className="text-xs font-semibold text-white/85">{label}</span>
                <span className={`text-xs font-bold ${valueClass}`}>· {value}</span>
                <span className="ml-auto text-[10px] text-white/40">{time}</span>
                <span className="h-2 w-2 rounded-full" style={{ background: dot, boxShadow: `0 0 8px ${dot}88` }} />
              </div>
            ))}
          </div>

          <div className="mt-5 inline-flex rounded-lg border border-white/10 bg-white/[0.04] p-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-md px-4 py-1.5 text-[11px] font-semibold transition-colors ${activeTab === tab ? "bg-[#F5C842]/15 text-[#F5C842]" : "text-white/50 hover:text-white/75"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/8 bg-white/[0.02] py-3 text-center text-[9px] font-bold uppercase tracking-[0.28em] text-[#F5C842]/60">
        Same engine · Operational data mode
      </div>
    </section>
  );
}