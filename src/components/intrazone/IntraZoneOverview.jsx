import { Link } from "react-router-dom";
import {
  Activity, ArrowRight, ArrowUpRight, CalendarDays, CircleCheck, Database,
  FileText, Gauge, Handshake, Landmark, Mail, Plane, Radio, Scale,
  ShieldCheck, Workflow,
} from "lucide-react";
import HeroGlobe from "@/components/homepage/HeroGlobe";

const GOLD = "#d4a017";
const PANEL = "rgba(14,17,20,0.88)";
const BORDER = "rgba(255,255,255,0.10)";
const MUTED = "rgba(245,247,250,0.52)";

function countHotLeads(leads) {
  return leads.filter((lead) => {
    let score = 0;
    if (lead.budget) score += 20;
    if (lead.notes?.length > 20) score += 10;
    if (lead.phone) score += 10;
    if (lead.aircraft_preference) score += 20;
    if (lead.source === "referral") score += 20;
    else if (lead.source === "web") score += 10;
    if (lead.name && lead.email) score += 20;
    return score >= 70;
  }).length;
}

function SignalRow({ color, label, value }) {
  return (
    <div className="flex items-center gap-3 border-t py-3 first:border-t-0" style={{ borderColor: BORDER }}>
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 motion-reduce:animate-none" style={{ background: color }} />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      </span>
      <span className="flex-1 text-[11px] font-semibold text-white/72">{label}</span>
      <span className="text-[11px] font-black text-white">{value}</span>
    </div>
  );
}

function GlobalSignals({ leads, escrows, aircraftContext }) {
  const activePipeline = leads.filter((lead) => !["closed", "lost"].includes(lead.status)).length;
  const liveEscrows = escrows.filter((escrow) => !["closed", "cancelled"].includes(escrow.status)).length;
  const hotLeads = countHotLeads(leads);

  return (
    <section className="relative min-h-[520px] overflow-hidden rounded-md border" style={{ background: "#080b0e", borderColor: BORDER }}>
      <HeroGlobe variant="signals" forceDark />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,14,0.12),rgba(8,11,14,0.92)_84%)]" />

      <div className="pointer-events-none relative z-10 flex min-h-[520px] flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: GOLD }}>
              <Radio size={13} /> Global Signals
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Live aviation network</h2>
          </div>
          <span className="rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-300">Live</span>
        </div>

        <div className="mt-auto grid gap-4 lg:grid-cols-[1fr_240px] lg:items-end">
          <div className="max-w-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: MUTED }}>Current aircraft context</p>
            <p className="mt-1 text-xl font-black text-white">{aircraftContext}</p>
            <p className="mt-2 text-[11px] leading-relaxed" style={{ color: MUTED }}>
              The globe remains exploratory in public ABOS and becomes a live operational signal surface inside IntraZone.
            </p>
          </div>
          <div className="rounded-md border px-4" style={{ background: "rgba(6,8,10,0.78)", borderColor: BORDER, backdropFilter: "blur(16px)" }}>
            <SignalRow color="#42d6b1" label="Active pipeline" value={activePipeline} />
            <SignalRow color="#4e8ef7" label="High-intent leads" value={hotLeads} />
            <SignalRow color={GOLD} label="Open escrow" value={liveEscrows} />
          </div>
        </div>
      </div>
    </section>
  );
}

const NODES = [
  { id: "assets", label: "ATI Score", detail: "Aircraft intelligence", icon: ShieldCheck, color: "#4e8ef7" },
  { id: "assets", label: "Valuation", detail: "Market position", icon: Gauge, color: GOLD },
  { path: "/bill-of-sale", label: "Documents", detail: "Drafts and records", icon: FileText, color: "#a77bf3" },
  { id: "matching", label: "Matching", detail: "Buyer and aircraft fit", icon: Handshake, color: "#42d6b1" },
  { id: "negotiation", label: "Negotiation", detail: "Terms and decisions", icon: Scale, color: "#f08d49" },
  { path: "/escrow", label: "Escrow", detail: "Settlement status", icon: Landmark, color: "#e7b948" },
];

function OrchestrationNode({ node, onOpen }) {
  const Icon = node.icon;
  const body = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border" style={{ color: node.color, background: `${node.color}12`, borderColor: `${node.color}35` }}>
        <Icon size={17} />
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-[11px] font-black text-white">{node.label}</span>
        <span className="block truncate text-[9px]" style={{ color: MUTED }}>{node.detail}</span>
      </span>
      <ArrowUpRight size={13} className="ml-auto shrink-0 text-white/35" />
    </>
  );

  const className = "relative z-10 flex min-h-[58px] w-full items-center gap-3 rounded-md border p-3 transition-colors hover:bg-white/[0.06]";
  const style = { background: "rgba(9,11,14,0.94)", borderColor: `${node.color}30` };

  return node.path ? (
    <Link to={node.path} className={className} style={style}>{body}</Link>
  ) : (
    <button type="button" onClick={() => onOpen(node.id)} className={className} style={style}>{body}</button>
  );
}

function Orchestration({ aircraftContext, onOpen }) {
  return (
    <section className="rounded-md border p-5 sm:p-6" style={{ background: PANEL, borderColor: BORDER }}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: GOLD }}>ATI Card orchestration</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">One aircraft, connected operations</h2>
        </div>
        <button type="button" onClick={() => onOpen("assets")} className="inline-flex min-h-10 items-center gap-2 rounded-md border px-4 text-[11px] font-bold text-white" style={{ borderColor: BORDER }}>
          Open aircraft record <ArrowRight size={14} />
        </button>
      </div>

      <div className="relative mt-6 grid gap-3 md:grid-cols-[1fr_170px_1fr] md:items-center">
        <div className="pointer-events-none absolute inset-x-[20%] top-1/2 hidden border-t border-dashed border-white/10 md:block" />
        <div className="grid gap-3">
          {NODES.slice(0, 3).map((node) => <OrchestrationNode key={node.label} node={node} onOpen={onOpen} />)}
        </div>

        <div className="relative z-10 flex min-h-[170px] flex-col items-center justify-center rounded-md border border-primary/45 bg-primary p-4 text-center text-[#0b0d0f] shadow-[0_0_40px_rgba(212,160,23,0.16)]">
          <Plane size={32} strokeWidth={2.4} />
          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.16em]">ATI Card</p>
          <p className="mt-1 max-w-[140px] truncate text-[15px] font-black">{aircraftContext}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-black/10 px-2 py-1 text-[9px] font-bold"><CircleCheck size={12} /> Context active</span>
        </div>

        <div className="grid gap-3">
          {NODES.slice(3).map((node) => <OrchestrationNode key={node.label} node={node} onOpen={onOpen} />)}
        </div>
      </div>
    </section>
  );
}

function WorkflowStrip({ onOpen, leads }) {
  const active = leads.filter((lead) => !["closed", "lost"].includes(lead.status)).length;
  const stages = [
    { label: "Identify", detail: "Aircraft context", icon: Plane },
    { label: "Verify", detail: "ATI and records", icon: ShieldCheck },
    { label: "Structure", detail: "Match and terms", icon: Workflow },
    { label: "Close", detail: "Documents and escrow", icon: Landmark },
  ];

  return (
    <section className="rounded-md border p-5 sm:p-6" style={{ background: PANEL, borderColor: BORDER }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: GOLD }}>Professional workflow</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{active} active pipeline item{active === 1 ? "" : "s"}</h2>
        </div>
        <button type="button" onClick={() => onOpen("pipeline")} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 text-[11px] font-black text-primary-foreground">
          Open workflow <ArrowRight size={14} />
        </button>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-4">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <button key={stage.label} type="button" onClick={() => onOpen("pipeline")} className="flex items-center gap-3 rounded-md border p-3 text-left hover:bg-white/[0.04]" style={{ borderColor: BORDER }}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.05] text-primary"><Icon size={15} /></span>
              <span>
                <span className="block text-[10px] font-black text-white">{index + 1}. {stage.label}</span>
                <span className="block text-[9px]" style={{ color: MUTED }}>{stage.detail}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const INTEGRATIONS = [
  { label: "Core API", path: "/developers/core-api", icon: Database },
  { label: "Documents", path: "/bill-of-sale", icon: FileText },
  { label: "Escrow", path: "/escrow", icon: Landmark },
  { label: "Email", path: "/leads", icon: Mail },
  { label: "Calendar", path: "/sales-pipeline", icon: CalendarDays },
];

function IntegrationStrip() {
  return (
    <section className="rounded-md border p-4" style={{ background: PANEL, borderColor: BORDER }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 text-[9px] font-black uppercase tracking-[0.16em]" style={{ color: MUTED }}>Connected tools</span>
        {INTEGRATIONS.map(({ label, path, icon: Icon }) => (
          <Link key={label} to={path} className="inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-[10px] font-bold text-white/75 hover:bg-white/[0.05]" style={{ borderColor: BORDER }}>
            <Icon size={14} style={{ color: GOLD }} /> {label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function IntraZoneOverview({ leads = [], escrows = [], aircraftContext, onOpen }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(560px,1.1fr)]">
        <GlobalSignals leads={leads} escrows={escrows} aircraftContext={aircraftContext} />
        <Orchestration aircraftContext={aircraftContext} onOpen={onOpen} />
      </div>
      <WorkflowStrip leads={leads} onOpen={onOpen} />
      <IntegrationStrip />
    </div>
  );
}
