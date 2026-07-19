import { Link } from "react-router-dom";
import {
  BarChart3, FileText, Handshake, LayoutDashboard, Network,
  Plane, ShieldCheck, Sparkles, Target, Users, Workflow,
} from "lucide-react";

const ITEMS = [
  ["overview", "Overview", LayoutDashboard], ["aircraft", "Aircraft", Plane],
  ["workflow", "Workflow", Workflow], ["leads", "Leads", Users],
  ["match", "Match", Target], ["negotiation", "Negotiation", Handshake],
  ["insights", "Insights", BarChart3], ["documents", "Documents", FileText],
  ["integrations", "Integrations", Network], ["escrow", "Escrow Status", ShieldCheck],
];

export default function IntraZoneNavigation({ activeTab, onSelect }) {
  return <>
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-white/10 bg-[#080a0f]">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4A017] text-[#080a0f]"><Sparkles className="h-4 w-4" /></span>
          <div><p className="text-sm font-black text-white">IntraZone</p><p className="text-[10px] uppercase tracking-[0.16em] text-white/40">Professional workspace</p></div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {ITEMS.map(([id, label, Icon]) => <button key={id} onClick={() => onSelect(id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold" style={{ background: activeTab === id ? "rgba(212,160,23,0.12)" : "transparent", color: activeTab === id ? "#f5c242" : "rgba(255,255,255,0.58)", border: activeTab === id ? "1px solid rgba(212,160,23,0.25)" : "1px solid transparent" }}><Icon className="h-4 w-4" />{label}</button>)}
      </nav>
      <Link to="/" className="m-3 rounded-xl border border-white/10 px-3 py-3 text-center text-xs font-bold text-white/55 hover:text-white">Exit to Marketspace</Link>
    </aside>
    <nav className="fixed inset-x-0 bottom-0 z-40 flex gap-1 overflow-x-auto border-t border-white/10 bg-[#080a0f] px-2 py-2 lg:hidden">
      {ITEMS.map(([id, label, Icon]) => <button key={id} onClick={() => onSelect(id)} className="flex min-w-[72px] flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[9px] font-bold" style={{ color: activeTab === id ? "#f5c242" : "rgba(255,255,255,0.5)", background: activeTab === id ? "rgba(212,160,23,0.12)" : "transparent" }}><Icon className="h-4 w-4" />{label}</button>)}
    </nav>
  </>;
}