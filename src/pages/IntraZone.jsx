import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import LeadEngine from "@/components/intrazone/LeadEngine";
import DealPipeline from "@/components/intrazone/DealPipeline";
import AssetIntelligence from "@/components/intrazone/AssetIntelligence";
import MatchingEngine from "@/components/intrazone/MatchingEngine";
import NegotiationEngine from "@/components/intrazone/NegotiationEngine";
import SalesDashboard from "@/components/intrazone/SalesDashboard";
import IntraZoneOverview from "@/components/intrazone/IntraZoneOverview";
import SidebarLogo from "@/components/layout/SidebarLogo";
import {
  Activity, ArrowLeft, BarChart2, BriefcaseBusiness, ChevronDown, Circle,
  Crosshair, FileText, Gauge, Landmark, MessageSquare, Plane, Search,
  ShieldCheck, Users, Workflow,
} from "lucide-react";

const GOLD = "#d4a017";
const MUTED = "rgba(245,247,250,0.52)";
const BORDER = "rgba(255,255,255,0.09)";
const PANEL = {
  background: "rgba(13,16,19,0.88)",
  border: `1px solid ${BORDER}`,
  borderRadius: "8px",
};

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "assets", label: "Aircraft", icon: Plane },
  { id: "pipeline", label: "Workflow", icon: Workflow },
  { id: "leads", label: "Leads", icon: Users },
  { id: "matching", label: "Match", icon: Crosshair },
  { id: "negotiation", label: "Negotiate", icon: MessageSquare },
  { id: "insights", label: "Insights", icon: BarChart2 },
];

const LEGACY_TABS = { dashboard: "overview", assets: "assets", pipeline: "pipeline" };

function WorkspaceNav({ activeTab, onSelect }) {
  return (
    <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-[11px] font-bold transition-colors"
            style={{
              color: active ? "#fff" : MUTED,
              background: active ? "rgba(212,160,23,0.12)" : "transparent",
              borderColor: active ? "rgba(212,160,23,0.34)" : "transparent",
            }}
          >
            <Icon size={15} style={{ color: active ? GOLD : "currentColor" }} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function UtilityLinks() {
  return (
    <div className="hidden items-center gap-1 xl:flex">
      <Link to="/bill-of-sale" title="Documents" className="flex h-10 w-10 items-center justify-center rounded-md border text-white/55 hover:text-white" style={{ borderColor: BORDER }}><FileText size={16} /></Link>
      <Link to="/developers/core-api" title="Integrations" className="flex h-10 w-10 items-center justify-center rounded-md border text-white/55 hover:text-white" style={{ borderColor: BORDER }}><BriefcaseBusiness size={16} /></Link>
      <Link to="/escrow" title="Escrow" className="flex h-10 w-10 items-center justify-center rounded-md border text-white/55 hover:text-white" style={{ borderColor: BORDER }}><Landmark size={16} /></Link>
    </div>
  );
}

function AircraftContextBar({ aircraftContext, activeLead, escrows }) {
  const activeEscrow = escrows.find((escrow) => !["closed", "cancelled"].includes(escrow.status));
  return (
    <div className="border-b px-4 py-3 sm:px-6" style={{ borderColor: BORDER, background: "rgba(7,9,11,0.88)" }}>
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><Plane size={17} /></span>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: GOLD }}>Active aircraft context</p>
            <p className="max-w-[360px] truncate text-[13px] font-black text-white">{aircraftContext}</p>
          </div>
        </div>
        <span className="hidden h-7 border-l sm:block" style={{ borderColor: BORDER }} />
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold" style={{ color: MUTED }}>
          <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1" style={{ borderColor: BORDER }}><Circle size={7} fill={activeLead ? "#42d6b1" : "transparent"} color={activeLead ? "#42d6b1" : "#66707a"} /> {activeLead ? "Lead connected" : "No active lead"}</span>
          <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1" style={{ borderColor: BORDER }}><ShieldCheck size={12} /> ATI workspace</span>
          <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1" style={{ borderColor: BORDER }}><Landmark size={12} /> {activeEscrow ? activeEscrow.status?.replace(/_/g, " ") : "No open escrow"}</span>
        </div>
      </div>
    </div>
  );
}

function MobileBottomBar({ activeTab, onSelect }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = NAV_ITEMS.slice(0, 4);
  const more = NAV_ITEMS.slice(4);
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t px-2 pb-[max(env(safe-area-inset-bottom),6px)] pt-1 lg:hidden" style={{ background: "rgba(7,9,11,0.97)", borderColor: BORDER, backdropFilter: "blur(20px)" }}>
        {primary.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button key={item.id} type="button" onClick={() => onSelect(item.id)} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[9px] font-bold" style={{ color: active ? GOLD : MUTED }}>
              <Icon size={16} /> {item.label}
            </button>
          );
        })}
        <button type="button" onClick={() => setMoreOpen(true)} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[9px] font-bold" style={{ color: more.some((item) => item.id === activeTab) ? GOLD : MUTED }}>
          <ChevronDown size={16} /> More
        </button>
      </div>

      {moreOpen && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/65 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div className="w-full rounded-t-lg border-t p-4 pb-[max(env(safe-area-inset-bottom),20px)]" style={{ background: "#0d1013", borderColor: BORDER }} onClick={(event) => event.stopPropagation()}>
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: GOLD }}>Workspace modules</p>
            <div className="grid grid-cols-3 gap-2">
              {more.map((item) => {
                const Icon = item.icon;
                return <button key={item.id} type="button" onClick={() => { onSelect(item.id); setMoreOpen(false); }} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border text-[10px] font-bold text-white" style={{ borderColor: BORDER }}><Icon size={18} style={{ color: GOLD }} />{item.label}</button>;
              })}
              <Link to="/bill-of-sale" className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border text-[10px] font-bold text-white" style={{ borderColor: BORDER }}><FileText size={18} style={{ color: GOLD }} />Documents</Link>
              <Link to="/escrow" className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border text-[10px] font-bold text-white" style={{ borderColor: BORDER }}><Landmark size={18} style={{ color: GOLD }} />Escrow</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ModuleFrame({ children }) {
  return <div className="p-3 sm:p-5" style={PANEL}>{children}</div>;
}

export default function IntraZone() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem("intrazone-tab") || "overview";
      return LEGACY_TABS[saved] || saved;
    } catch {
      return "overview";
    }
  });

  useEffect(() => {
    try { localStorage.setItem("intrazone-tab", activeTab); } catch {}
  }, [activeTab]);

  const { data: leads = [] } = useQuery({
    queryKey: ["intrazone-leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 200),
  });
  const { data: escrows = [] } = useQuery({
    queryKey: ["intrazone-escrows"],
    queryFn: () => base44.entities.EscrowTransaction.list("-created_date", 200),
  });

  const activeLead = useMemo(
    () => leads.find((lead) => !["closed", "lost"].includes(lead.status)) || leads[0],
    [leads]
  );
  const aircraftContext = searchParams.get("aircraft") || activeLead?.aircraft_preference || "Select an aircraft";

  return (
    <div
      className="min-h-screen pb-20 text-white lg:pb-0"
      style={{
        backgroundColor: "#07090b",
        backgroundImage: "radial-gradient(circle at 0% 10%, rgba(212,160,23,0.12), transparent 34%), radial-gradient(circle at 100% 92%, rgba(41,145,126,0.09), transparent 36%), radial-gradient(rgba(255,255,255,0.055) 0.7px, transparent 0.7px)",
        backgroundSize: "auto, auto, 22px 22px",
      }}
    >
      <header className="sticky top-0 z-40 border-b" style={{ background: "rgba(7,9,11,0.96)", borderColor: BORDER, backdropFilter: "blur(22px)" }}>
        <div className="mx-auto flex h-[66px] max-w-[1600px] items-center gap-3 px-3 sm:px-6">
          <Link to="/" className="hidden h-10 items-center gap-2 rounded-md border px-3 text-[10px] font-bold text-white/60 hover:text-white sm:flex" style={{ borderColor: BORDER }}>
            <ArrowLeft size={14} /> Public ABOS
          </Link>
          <div className="shrink-0">
            <SidebarLogo compact />
          </div>
          <span className="hidden h-7 border-l md:block" style={{ borderColor: BORDER }} />
          <div className="hidden shrink-0 md:block">
            <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: GOLD }}>Professional workspace</p>
            <p className="text-[12px] font-black text-white">IntraZone</p>
          </div>
          <WorkspaceNav activeTab={activeTab} onSelect={setActiveTab} />
          <UtilityLinks />
          <button type="button" onClick={() => setActiveTab("assets")} title="Find aircraft in workspace" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-white/60 hover:text-white" style={{ borderColor: BORDER }}><Search size={16} /></button>
        </div>
      </header>

      <AircraftContextBar aircraftContext={aircraftContext} activeLead={activeLead} escrows={escrows} />

      <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 sm:py-6">
        {activeTab === "overview" && <IntraZoneOverview leads={leads} escrows={escrows} aircraftContext={aircraftContext} onOpen={setActiveTab} />}
        {activeTab === "assets" && <ModuleFrame><AssetIntelligence /></ModuleFrame>}
        {activeTab === "pipeline" && <ModuleFrame><DealPipeline /></ModuleFrame>}
        {activeTab === "leads" && <ModuleFrame><LeadEngine /></ModuleFrame>}
        {activeTab === "matching" && <ModuleFrame><MatchingEngine /></ModuleFrame>}
        {activeTab === "negotiation" && <ModuleFrame><NegotiationEngine /></ModuleFrame>}
        {activeTab === "insights" && <SalesDashboard />}
      </main>

      <MobileBottomBar activeTab={activeTab} onSelect={setActiveTab} />
    </div>
  );
}
