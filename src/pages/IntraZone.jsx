import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import LeadEngine from "@/components/intrazone/LeadEngine";
import DealPipeline from "@/components/intrazone/DealPipeline";
import AssetIntelligence from "@/components/intrazone/AssetIntelligence";
import MatchingEngine from "@/components/intrazone/MatchingEngine";
import NegotiationEngine from "@/components/intrazone/NegotiationEngine";
import SalesDashboard from "@/components/intrazone/SalesDashboard";
import MiniGlobe from "@/components/MiniGlobe";
import {
  BarChart2, Users, ArrowUp, Target, DollarSign, Flame,
  TrendingUp, Crosshair, MessageSquare, ShieldCheck, ChevronRight, X
} from "lucide-react";

/* ═══════════════════════════════════════
   TOKENS
═══════════════════════════════════════ */
const PAGE_BG = "linear-gradient(135deg, #0a1628 0%, #1B2A4A 40%, #0d1f3c 100%)";
const GOLD = "#D4A017";
const CYAN = "#00c2cb";
const MUTED = "rgba(255,255,255,0.45)";
const WHITE = "#fff";
const GLASS = {
  background: "rgba(255,255,255,0.07)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  border: "1px solid rgba(255,255,255,0.11)",
  borderRadius: "16px",
};

const NAV_ITEMS = [
  { id: "dashboard",    label: "Dashboard",   icon: BarChart2 },
  { id: "leads",        label: "Leads",       icon: Users },
  { id: "pipeline",     label: "Pipeline",    icon: TrendingUp },
  { id: "matching",     label: "Match",       icon: Crosshair },
  { id: "negotiation",  label: "Negotiation", icon: MessageSquare },
  { id: "assets",       label: "Assets",      icon: ShieldCheck },
];

const SIDEBAR_COLLAPSED = 56;
const SIDEBAR_EXPANDED = 240;

/* ═══════════════════════════════════════
   KPI Metric Tile
═══════════════════════════════════════ */
function KpiTile({ icon: Icon, label, value, subtitle, color = CYAN }) {
  return (
    <div className="rounded-xl p-3 md:p-4 flex items-center gap-3" style={{
      background: "rgba(255,255,255,0.05)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.08)",
    }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: MUTED }}>{label}</p>
        <p className="text-xl font-black tracking-tight" style={{ color: WHITE }}>{value}</p>
        {subtitle && <p className="text-[9px]" style={{ color: MUTED }}>{subtitle}</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Mobile Tab Bar Button
═══════════════════════════════════════ */
function MobileNavButton({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all min-w-0"
      style={{
        color: active ? GOLD : MUTED,
        background: active ? "rgba(212,160,23,0.10)" : "transparent",
        border: active ? `1px solid ${GOLD}40` : "1px solid transparent",
      }}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="text-[9px] font-bold truncate max-w-[56px]">{item.label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════
   Mobile Tab Bar (5 main + "More")
═══════════════════════════════════════ */
function MobileBottomBar({ activeTab, setActiveTab }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const mainNav = NAV_ITEMS.slice(0, 5);
  const moreNav = NAV_ITEMS.slice(5);
  
  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 pb-safe-bottom"
        style={{
          background: "rgba(10,22,40,0.96)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingTop: "6px",
        }}>
        {mainNav.map(item => (
          <MobileNavButton key={item.id} item={item} active={activeTab === item.id} onClick={() => setActiveTab(item.id)} />
        ))}
        {moreNav.length > 0 && (
          <button
            onClick={() => setMoreOpen(v => !v)}
            className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all min-w-0"
            style={{ color: MUTED, background: "transparent", border: "1px solid transparent" }}
          >
            <div className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full" style={{ background: MUTED }} />
              <span className="w-1 h-1 rounded-full" style={{ background: MUTED }} />
              <span className="w-1 h-1 rounded-full" style={{ background: MUTED }} />
            </div>
            <span className="text-[9px] font-bold">More</span>
          </button>
        )}
      </div>

      {/* More overlay */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }} />
          <div className="relative z-10 w-full max-w-md rounded-t-2xl p-5 pb-safe-bottom animate-slide-up"
            style={{ background: "rgba(10,22,40,0.98)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: GOLD }}>More Sections</p>
              <button onClick={() => setMoreOpen(false)} style={{ color: MUTED }}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-1">
              {moreNav.map(item => (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setMoreOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    color: activeTab === item.id ? GOLD : MUTED,
                    background: activeTab === item.id ? "rgba(212,160,23,0.08)" : "rgba(255,255,255,0.03)",
                    border: activeTab === item.id ? `1px solid ${GOLD}35` : "1px solid transparent",
                  }}>
                  <item.icon className="w-4 h-4" />
                  <span className="text-[12px] font-bold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════
   INTRAZONE SHELL
═══════════════════════════════════════ */
export default function IntraZone() {
  const [activeTab, setActiveTab] = useState(() => {
    try { return localStorage.getItem("intrazone-tab") || "dashboard"; }
    catch { return "dashboard"; }
  });
  const [desktopHovered, setDesktopHovered] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("intrazone-tab", activeTab); } catch {}
  }, [activeTab]);

  /* Fetch KPI data */
  const { data: leads = [] } = useQuery({
    queryKey: ["intrazone-leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 200),
  });

  const { data: escrows = [] } = useQuery({
    queryKey: ["intrazone-escrows"],
    queryFn: () => base44.entities.EscrowTransaction.list("-created_date", 200),
  });

  const kpis = useMemo(() => {
    const total = leads.length;
    const hot = leads.filter(l => {
      let s = 0;
      if (l.budget) s += 20;
      if (l.notes?.length > 20) s += 10;
      if (l.phone) s += 10;
      if (l.aircraft_preference) s += 20;
      if (l.source === "referral") s += 20;
      else if (l.source === "web") s += 10;
      if (l.name && l.email) s += 20;
      return Math.min(s, 100) >= 70;
    }).length;
    const closed = leads.filter(l => l.status === "closed").length;
    const pipelineValue = leads
      .filter(l => l.budget && !["closed", "lost"].includes(l.status))
      .reduce((sum, l) => {
        const m = (l.budget || "").match(/[\d,]+/g);
        return m ? sum + parseInt(m[m.length - 1]?.replace(/,/g, "") || "0") : sum;
      }, 0);
    const totalEscrowValue = escrows.filter(e => e.status === "closed").reduce((s, e) => s + (e.sale_amount || 0), 0);
    return { total, hot, closed, pipelineValue, totalEscrowValue };
  }, [leads, escrows]);

  return (
    <div className="min-h-screen flex" style={{ background: PAGE_BG, color: WHITE }}>
      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40 flex-col transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden"
        style={{
          width: desktopHovered ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED,
          background: "rgba(10,22,40,0.94)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
        onMouseEnter={() => setDesktopHovered(true)}
        onMouseLeave={() => setDesktopHovered(false)}
      >
        {/* Sidebar header */}
        <div className="flex items-center gap-2 px-3 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg,${GOLD},#f48120)`, boxShadow: `0 2px 12px ${GOLD}40` }}>
            <Flame className="w-4 h-4" style={{ color: "#0a1628" }} />
          </div>
          {desktopHovered && (
            <div className="overflow-hidden">
              <p className="text-[12px] font-black tracking-tight" style={{ color: WHITE }}>IntraZone</p>
              <p className="text-[9px]" style={{ color: MUTED }}>Command & Control</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return desktopHovered ? (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150"
                style={{
                  color: active ? GOLD : MUTED,
                  background: active ? `rgba(212,160,23,0.08)` : "transparent",
                  border: active ? `1px solid ${GOLD}35` : "1px solid transparent",
                }}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-[12px] font-semibold">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: GOLD }} />}
              </button>
            ) : (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className="w-full flex items-center justify-center py-2.5 mx-1 rounded-xl transition-all duration-150"
                style={{
                  color: active ? GOLD : MUTED,
                  background: active ? `rgba(212,160,23,0.08)` : "transparent",
                  border: active ? `1px solid ${GOLD}35` : "1px solid transparent",
                }}
                title={item.label}>
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {desktopHovered ? (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shrink-0" />
              <span className="text-[9px] font-semibold" style={{ color: WHITE }}>IntraZone Active</span>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
            </div>
          )}
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 lg:ml-[var(--sidebar-w)] pb-[80px] lg:pb-4" style={{ "--sidebar-w": `${SIDEBAR_COLLAPSED}px` }}>
        {/* Command Bar */}
        <div className="sticky top-0 z-30 px-4 md:px-6 py-3"
          style={{
            background: "rgba(10,22,40,0.92)",
            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center lg:hidden"
              style={{ background: `linear-gradient(135deg,${GOLD},#f48120)` }}>
              <Flame className="w-4 h-4" style={{ color: "#0a1628" }} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold" style={{ color: GOLD }}>Deal Origination &amp; Execution</p>
              <h1 className="text-lg md:text-xl font-black tracking-tight leading-none" style={{ color: WHITE }}>IntraZone</h1>
            </div>
          </div>

          {/* KPI tiles */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <KpiTile icon={Users} label="Total Leads" value={kpis.total} color={CYAN} />
            <KpiTile icon={Flame} label="HOT Leads" value={kpis.hot} subtitle="Score ≥ 70" color="#ef4444" />
            <KpiTile icon={DollarSign} label="Pipeline" value={kpis.pipelineValue > 0 ? `$${(kpis.pipelineValue / 1000).toFixed(0)}k` : "—"} color={GOLD} />
            <KpiTile icon={Target} label="Closed" value={kpis.closed} color="#22c55e" />
            <KpiTile icon={ArrowUp} label="Escrow Value" value={kpis.totalEscrowValue > 0 ? `$${(kpis.totalEscrowValue / 1000).toFixed(0)}k` : "—"} color="#a855f7" />
          </div>
        </div>

        {/* Section content */}
        <div className="px-4 md:px-6 py-5 transition-opacity duration-150">
          {activeTab === "dashboard"    && <SalesDashboard />}
          {activeTab === "leads"        && <LeadEngine />}
          {activeTab === "pipeline"     && <DealPipeline />}
          {activeTab === "matching"     && <MatchingEngineWrapper />}
          {activeTab === "negotiation"  && <NegotiationEngineWrapper />}
          {activeTab === "assets"       && <AssetIntelligenceWrapper />}
        </div>
      </div>

      {/* ═══ MOBILE BOTTOM BAR ═══ */}
      <MobileBottomBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

/* ═══════════════════════════════════════
   DARK GLASS WRAPPERS for existing components
═══════════════════════════════════════ */
function MatchingEngineWrapper() {
  return (
    <div className="rounded-2xl p-4 md:p-5" style={GLASS}>
      <MatchingEngine />
    </div>
  );
}

function NegotiationEngineWrapper() {
  return (
    <div className="rounded-2xl p-4 md:p-5" style={GLASS}>
      <NegotiationEngine />
    </div>
  );
}

function AssetIntelligenceWrapper() {
  return (
    <div className="rounded-2xl p-4 md:p-5" style={GLASS}>
      <AssetIntelligence />
    </div>
  );
}