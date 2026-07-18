import { Link } from "react-router-dom";
import { Building2, Calendar, CircleCheck, CircleDashed, FileText, Landmark, Mail, Plane, ShieldCheck, TrendingUp, Braces, Sparkles } from "lucide-react";

const TABS = ["Overview", "Aircraft", "Workflow", "Documents", "Integrations", "Escrow"];

const HUB_NODES = [
  { icon: ShieldCheck, title: "ATI Score", sub: "84 · Good" },
  { icon: Building2, title: "Registry", sub: "Verified" },
  { icon: TrendingUp, title: "Valuation", sub: "In progress" },
  { icon: Calendar, title: "Calendar", sub: "2 events" },
  { icon: FileText, title: "Documents", sub: "3 of 12" },
  { icon: Landmark, title: "Escrow", sub: "0 of 12" },
];

const PIPELINE = [
  { step: 1, title: "Digital Twin", text: "Aggregate FAA registry, engine specs, ADS-B traffic and documents.", status: "Complete", done: true },
  { step: 2, title: "ATI Scoring", text: "AI-driven 8-dimension scoring across document, condition, engine, avionics.", status: "In progress", active: true },
  { step: 3, title: "Market Valuation", text: "Comparable-based market estimate with deal quality and price bands.", status: "Pending" },
  { step: 4, title: "Document Intake", text: "Upload logbooks, AWC, registration, weight & balance and more.", status: "Pending" },
];

const INTEGRATIONS = [
  { icon: Braces, title: "Core API", sub: "Connected", dot: "#60a5fa" },
  { icon: FileText, title: "Docs", sub: "3 of 12", dot: "#a78bfa" },
  { icon: Mail, title: "Gmail", sub: "Notify", dot: "#34d399" },
  { icon: Calendar, title: "Calendar", sub: "Sync", dot: "#F5C842" },
];

export default function IntraZonePortalWindow() {
  return (
    <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl" style={{ background: "rgba(8,11,18,0.97)" }}>
      {/* Tabs */}
      <div className="border-b border-white/8 px-5 pt-4 sm:px-7">
        <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.28em] text-[#F5C842]/70">IntraZone · Execution</p>
        <div className="flex gap-1 overflow-x-auto pb-0 text-[11px] font-semibold">
          {TABS.map((tab, index) => (
            <span key={tab} className={`whitespace-nowrap rounded-t-md px-3 py-2 ${index === 0 ? "border-b-2 border-[#F5C842] text-white" : "text-white/45"}`}>{tab}</span>
          ))}
        </div>
      </div>

      {/* Aircraft header */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-white/8 px-5 py-3.5 text-[11px] sm:px-7">
        <Plane size={14} className="text-white/70" />
        <strong className="text-white">N721AB</strong>
        <span className="text-white/40">·</span>
        <span className="font-semibold text-white/80">Phenom 300E</span>
        <span className="text-white/40">·</span>
        <span className="text-white/50">Deal AB-1042</span>
        <span className="ml-auto rounded-full border border-[#60a5fa]/30 bg-[#60a5fa]/10 px-2.5 py-0.5 font-bold text-[#8ec2ff]">ATI 84</span>
        <span className="flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-0.5 font-semibold text-emerald-300"><CircleCheck size={11} /> Serial verified</span>
      </div>

      {/* ATI Card hub */}
      <div className="grid grid-cols-2 items-center gap-3 px-5 py-6 sm:grid-cols-[1fr_auto_1fr] sm:gap-5 sm:px-7">
        <div className="space-y-2.5">
          {HUB_NODES.slice(0, 3).map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <Icon size={14} className="text-[#F5C842]" />
              <div><p className="text-[11px] font-bold leading-tight text-white">{title}</p><p className="text-[9px] text-white/45">{sub}</p></div>
            </div>
          ))}
        </div>
        <div className="col-span-2 order-first flex flex-col items-center sm:order-none sm:col-span-1">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#F5C842] shadow-[0_0_40px_rgba(245,194,66,0.35)]">
            <Plane size={30} className="text-[#0b111a]" />
          </div>
          <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.24em] text-white/50">ATI Card</p>
        </div>
        <div className="space-y-2.5">
          {HUB_NODES.slice(3).map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <Icon size={14} className="text-[#F5C842]" />
              <div><p className="text-[11px] font-bold leading-tight text-white">{title}</p><p className="text-[9px] text-white/45">{sub}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales workflow pipeline */}
      <div className="border-t border-white/8 px-5 py-5 sm:px-7">
        <p className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.24em] text-white/50"><Sparkles size={11} className="text-[#F5C842]" /> Sales Workflow Pipeline</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {PIPELINE.map((item) => (
            <div key={item.step} className={`rounded-xl border p-3.5 ${item.active ? "border-[#F5C842]/30 bg-[#F5C842]/[0.04]" : "border-white/8 bg-white/[0.02]"}`}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${item.done ? "bg-emerald-400/20 text-emerald-300" : item.active ? "bg-[#F5C842] text-[#0b111a]" : "border border-white/20 text-white/50"}`}>{item.step}</span>
                <p className="text-[11px] font-bold text-white">{item.title}</p>
              </div>
              <p className="mb-2 text-[9.5px] leading-relaxed text-white/45">{item.text}</p>
              <p className={`flex items-center gap-1.5 text-[9.5px] font-semibold ${item.done ? "text-emerald-300" : item.active ? "text-[#F5C842]" : "text-white/40"}`}>
                {item.done ? <CircleCheck size={11} /> : <CircleDashed size={11} />} {item.status}
              </p>
              {item.active && <Link to="/intrazone" className="mt-2 block rounded-md bg-[#F5C842] px-3 py-1.5 text-center text-[10px] font-bold text-[#0b111a] hover:opacity-90">Execute</Link>}
            </div>
          ))}
        </div>
      </div>

      {/* Integrations */}
      <div className="border-t border-white/8 px-5 py-5 sm:px-7">
        <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.24em] text-white/50">Integrations</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {INTEGRATIONS.map(({ icon: Icon, title, sub, dot }) => (
            <div key={title} className="relative flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
              <Icon size={15} className="text-white/70" />
              <div><p className="text-[11px] font-bold leading-tight text-white">{title}</p><p className="text-[9px] text-white/45">{sub}</p></div>
              <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap gap-3 border-t border-white/8 px-5 py-5 sm:px-7">
        <Link to="/demo" className="rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-[11px] font-semibold text-white/85 hover:bg-white/10">Open Interactive Demo</Link>
        <Link to="/intrazone" className="rounded-lg bg-[#F5C842] px-5 py-2.5 text-[11px] font-bold text-[#0b111a] hover:opacity-90">Enter Workspace</Link>
      </div>
    </div>
  );
}