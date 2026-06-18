import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, PieChart, Pie, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Clock, Target, Users, DollarSign, Zap, ArrowRight } from "lucide-react";
import { differenceInDays, format, subMonths } from "date-fns";
import MiniGlobe from "@/components/MiniGlobe";

/* ═══════════════════════════════════════
   TOKENS
═══════════════════════════════════════ */
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

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */
function scoreLeadLocally(lead) {
  let s = 0;
  if (lead.budget) s += 20;
  if (lead.notes?.length > 20) s += 10;
  if (lead.phone) s += 10;
  if (lead.aircraft_preference) s += 20;
  if (lead.source === "referral") s += 20;
  else if (lead.source === "web") s += 10;
  if (lead.name && lead.email) s += 20;
  return Math.min(s, 100);
}

const SOURCE_COLORS = {
  web: "#60A5FA", referral: "#22c55e", partner: GOLD,
  cold: "#94A3B8", email: "#6366F1", phone: "#EC4899",
};

const STAGE_COLOR = {
  new: "#94A3B8", contacted: "#60A5FA", qualified: "#22c55e",
  negotiating: "#a855f7", closed: "#22c55e", lost: "#ef4444",
};

/* ═══════════════════════════════════════
   KPI CARD
═══════════════════════════════════════ */
function KPICard({ icon: Icon, label, value, sub, color = CYAN, trend }) {
  return (
    <div className="rounded-xl p-4 relative overflow-hidden" style={GLASS}>
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-[10px] font-black ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black leading-none" style={{ color: WHITE }}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: MUTED }}>{label}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{sub}</p>}
    </div>
  );
}

function SectionTitle({ children, color = GOLD }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.18em] font-black mb-3" style={{ color }}>{children}</p>
  );
}

/* ═══════════════════════════════════════
   CHARTS (dark styled)
═══════════════════════════════════════ */
function FunnelStageChart({ leads }) {
  const stages = ["new", "contacted", "qualified", "negotiating", "closed", "lost"];
  const data = stages.map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: leads.filter(l => l.status === s).length,
    fill: STAGE_COLOR[s],
  })).filter(d => d.value > 0);

  return (
    <div className="rounded-xl p-4" style={GLASS}>
      <SectionTitle>Pipeline Funnel</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: MUTED }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, background: "#1B2A4A", border: "1px solid rgba(255,255,255,0.1)", color: WHITE }} formatter={(v) => [v, "leads"]} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22} label={{ position: "right", fontSize: 11, fontWeight: "bold", fill: MUTED }}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SourceConversionChart({ leads }) {
  const sourceCounts = {};
  leads.forEach(l => {
    const s = l.source || "unknown";
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  });
  const data = Object.keys(sourceCounts).map(s => ({
    name: s,
    total: sourceCounts[s],
    fill: SOURCE_COLORS[s] || "#94A3B8",
  })).sort((a, b) => b.total - a.total);

  return (
    <div className="rounded-xl p-4" style={GLASS}>
      <SectionTitle>Leads by Source</SectionTitle>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={72} paddingAngle={3}
            label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
          <Tooltip formatter={(v, n, p) => [`${v} leads`, n]} contentStyle={{ fontSize: 12, borderRadius: 8, background: "#1B2A4A", border: "1px solid rgba(255,255,255,0.1)", color: WHITE }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-3 space-y-1.5">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.fill }} />
            <span className="flex-1 capitalize" style={{ color: MUTED }}>{d.name}</span>
            <span className="font-bold" style={{ color: WHITE }}>{d.total} leads</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesCycleTrend({ leads, escrows }) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return { key: format(d, "yyyy-MM"), label: format(d, "MMM") };
  });
  const data = months.map(({ key, label }) => {
    const monthLeads = leads.filter(l => (l.created_date || "").startsWith(key)).length;
    const monthClosed = leads.filter(l => l.status === "closed" && (l.updated_date || "").startsWith(key)).length;
    const monthEscrows = escrows.filter(e => (e.created_date || "").startsWith(key)).length;
    return { month: label, leads: monthLeads, closed: monthClosed, escrows: monthEscrows };
  });

  return (
    <div className="rounded-xl p-4 lg:col-span-2" style={GLASS}>
      <SectionTitle>6-Month Sales Activity Trend</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: MUTED }} />
          <YAxis tick={{ fontSize: 10, fill: MUTED }} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, background: "#1B2A4A", border: "1px solid rgba(255,255,255,0.1)", color: WHITE }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="leads" stroke={CYAN} strokeWidth={2} dot={{ r: 3 }} name="New Leads" />
          <Line type="monotone" dataKey="closed" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Closed" />
          <Line type="monotone" dataKey="escrows" stroke={GOLD} strokeWidth={2} dot={{ r: 3 }} name="Escrows" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ScoreDistributionChart({ leads }) {
  const buckets = [
    { label: "Cold 0–39",   min: 0,  max: 39,  fill: "#3b82f6" },
    { label: "Warm 40–69",  min: 40, max: 69,  fill: GOLD },
    { label: "Hot 70–100",  min: 70, max: 100, fill: "#ef4444" },
  ];
  const data = buckets.map(b => ({
    name: b.label,
    value: leads.filter(l => { const s = scoreLeadLocally(l); return s >= b.min && s <= b.max; }).length,
    fill: b.fill,
  }));

  return (
    <div className="rounded-xl p-4" style={GLASS}>
      <SectionTitle>Lead Quality Distribution</SectionTitle>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: MUTED }} />
          <YAxis hide allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, background: "#1B2A4A", border: "1px solid rgba(255,255,255,0.1)", color: WHITE }} formatter={(v) => [v, "leads"]} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48} label={{ position: "top", fontSize: 12, fontWeight: "bold", fill: MUTED }}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EscrowStatusChart({ escrows }) {
  const statuses = ["draft","contract_sent","contract_signed","funds_pending","funds_secured","inspection","released","closed","cancelled"];
  const data = statuses.map(s => ({
    name: s.replace(/_/g, " "),
    value: escrows.filter(e => e.status === s).length,
  })).filter(d => d.value > 0);
  const COLORS = ["#94A3B8","#60A5FA","#818CF8","#FBBF24","#34D399","#10B981","#28C76F","#059669","#F87171"];

  return (
    <div className="rounded-xl p-4" style={GLASS}>
      <SectionTitle>Escrow Transaction Stages</SectionTitle>
      {data.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: MUTED }}>No escrow data yet</p>
      ) : (
        <div className="space-y-2 mt-1">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-[11px]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="capitalize flex-1" style={{ color: MUTED }}>{d.name}</span>
              <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.round((d.value / escrows.length) * 100)}%`, background: COLORS[i % COLORS.length] }} />
              </div>
              <span className="font-black w-4 text-right" style={{ color: WHITE }}>{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════ */
export default function SalesDashboard() {
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["intrazone-leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 200),
  });
  const { data: escrows = [], isLoading: escrowsLoading } = useQuery({
    queryKey: ["intrazone-escrows"],
    queryFn: () => base44.entities.EscrowTransaction.list("-created_date", 200),
  });
  const { data: listings = [] } = useQuery({
    queryKey: ["listings-active"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }),
  });

  const kpis = useMemo(() => {
    const closed = leads.filter(l => l.status === "closed");
    const lost = leads.filter(l => l.status === "lost");
    const total = leads.length;
    const convRate = total > 0 ? Math.round((closed.length / total) * 100) : 0;
    const hotLeads = leads.filter(l => scoreLeadLocally(l) >= 70);
    const closedWithDates = closed.filter(l => l.created_date && l.updated_date);
    const avgDays = closedWithDates.length > 0
      ? Math.round(closedWithDates.reduce((sum, l) => sum + differenceInDays(new Date(l.updated_date), new Date(l.created_date)), 0) / closedWithDates.length)
      : null;
    const totalEscrowValue = escrows.filter(e => e.status === "closed").reduce((s, e) => s + (e.sale_amount || 0), 0);
    return { total, closed: closed.length, lost: lost.length, convRate, hotLeads: hotLeads.length, avgDays, totalEscrowValue };
  }, [leads, escrows]);

  const isLoading = leadsLoading || escrowsLoading;
  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <MiniGlobe size={40} label="Loading dashboard…" color={GOLD} />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard icon={Users} label="Total Leads" value={kpis.total} color={CYAN} />
        <KPICard icon={Target} label="Conv. Rate" value={`${kpis.convRate}%`} sub={`${kpis.closed} closed`} color="#22c55e" />
        <KPICard icon={Clock} label="Time-to-Close" value={kpis.avgDays !== null ? `${kpis.avgDays}d` : "—"} sub="Days in pipeline" color={GOLD} />
        <KPICard icon={Zap} label="Hot Leads" value={kpis.hotLeads} sub="Score ≥ 70" color="#ef4444" />
        <KPICard icon={DollarSign} label="Escrow Closed" value={kpis.totalEscrowValue > 0 ? `$${(kpis.totalEscrowValue / 1000).toFixed(0)}k` : "—"} color="#a855f7" />
      </div>

      {/* Trend + Funnel row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SalesCycleTrend leads={leads} escrows={escrows} />
        <FunnelStageChart leads={leads} />
      </div>

      {/* Source + Quality + Escrow row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SourceConversionChart leads={leads} />
        <ScoreDistributionChart leads={leads} />
        <EscrowStatusChart escrows={escrows} />
      </div>

      {/* Insights */}
      {leads.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: `${GOLD}0A`, ...GLASS }}>
          <SectionTitle>Insights &amp; Next Actions</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {kpis.convRate < 15 && (
              <div className="flex gap-2.5 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <ArrowRight className="w-4 h-4 shrink-0 mt-0.5" style={{ color: GOLD }} />
                <div>
                  <p className="text-[11px] font-black" style={{ color: WHITE }}>Conversion below 15%</p>
                  <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>Focus follow-up on qualified + negotiating stages.</p>
                </div>
              </div>
            )}
            {kpis.hotLeads > 0 && (
              <div className="flex gap-2.5 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <ArrowRight className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
                <div>
                  <p className="text-[11px] font-black" style={{ color: WHITE }}>{kpis.hotLeads} Hot Lead{kpis.hotLeads > 1 ? "s" : ""} ready</p>
                  <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>Call today — hot leads convert 3× faster within 24h.</p>
                </div>
              </div>
            )}
            {kpis.avgDays !== null && kpis.avgDays > 30 && (
              <div className="flex gap-2.5 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <ArrowRight className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#3b82f6" }} />
                <div>
                  <p className="text-[11px] font-black" style={{ color: WHITE }}>Cycle {kpis.avgDays}d — above target</p>
                  <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>Review stalled leads in negotiating stage.</p>
                </div>
              </div>
            )}
            {listings.length > 0 && (
              <div className="flex gap-2.5 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <ArrowRight className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                <div>
                  <p className="text-[11px] font-black" style={{ color: WHITE }}>{listings.length} Active Listings</p>
                  <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>Match unlinked leads to listings for faster deals.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}