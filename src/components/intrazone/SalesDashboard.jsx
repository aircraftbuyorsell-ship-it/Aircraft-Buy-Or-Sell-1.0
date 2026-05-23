import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, PieChart, Pie, Legend,
  FunnelChart, Funnel, LabelList,
} from "recharts";
import { TrendingUp, TrendingDown, Clock, Target, Users, DollarSign, Zap, ArrowRight } from "lucide-react";
import { differenceInDays, format, subMonths, startOfMonth } from "date-fns";

// ── helpers ──────────────────────────────────────────────────────
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
  web: "#0B2D5B", referral: "#28C76F", partner: "#E8A83A",
  cold: "#94A3B8", email: "#6366F1", phone: "#EC4899",
};

const STAGE_COLOR = {
  new: "#94A3B8", contacted: "#60A5FA", qualified: "#34D399",
  negotiating: "#A78BFA", closed: "#28C76F", lost: "#F87171",
};

// ── KPI Card ─────────────────────────────────────────────────────
function KPICard({ icon: Icon, label, value, sub, color = "#0B2D5B", trend }) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-[10px] font-black ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-[#1A1814] leading-none">{value}</p>
      <p className="text-[10px] font-bold text-[#AAA49C] uppercase tracking-wider mt-1">{label}</p>
      {sub && <p className="text-[11px] text-[#6B6560] mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.18em] font-black text-[#E8A83A] mb-3">{children}</p>
  );
}

// ── Funnel Stage Chart ────────────────────────────────────────────
function FunnelStageChart({ leads }) {
  const stages = ["new", "contacted", "qualified", "negotiating", "closed", "lost"];
  const data = stages.map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: leads.filter(l => l.status === s).length,
    fill: STAGE_COLOR[s],
  })).filter(d => d.value > 0);

  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] p-5">
      <SectionTitle>Pipeline Funnel</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "#6B6560" }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [v, "leads"]} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22} label={{ position: "right", fontSize: 11, fontWeight: "bold", fill: "#6B6560" }}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Source Conversion Pie ─────────────────────────────────────────
function SourceConversionChart({ leads }) {
  const sourceCounts = {};
  const sourceConverted = {};
  leads.forEach(l => {
    const s = l.source || "unknown";
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
    if (l.status === "closed") sourceConverted[s] = (sourceConverted[s] || 0) + 1;
  });

  const data = Object.keys(sourceCounts).map(s => ({
    name: s,
    total: sourceCounts[s],
    converted: sourceConverted[s] || 0,
    rate: sourceCounts[s] > 0 ? Math.round(((sourceConverted[s] || 0) / sourceCounts[s]) * 100) : 0,
    fill: SOURCE_COLORS[s] || "#94A3B8",
  })).sort((a, b) => b.total - a.total);

  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] p-5">
      <SectionTitle>Leads by Source</SectionTitle>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={72} paddingAngle={3}
            label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
          <Tooltip formatter={(v, n, p) => [`${v} leads (${p.payload.rate}% converted)`, n]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        </PieChart>
      </ResponsiveContainer>
      {/* Conversion rate table */}
      <div className="mt-3 space-y-1.5">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.fill }} />
            <span className="text-[#6B6560] capitalize flex-1">{d.name}</span>
            <span className="font-bold text-[#1A1814]">{d.total} leads</span>
            <span className={`font-black ${d.rate >= 20 ? "text-green-600" : d.rate >= 10 ? "text-amber-600" : "text-[#AAA49C]"}`}>{d.rate}% conv.</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Monthly Sales Trend ───────────────────────────────────────────
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
    <div className="bg-white rounded-2xl border border-black/[0.07] p-5 lg:col-span-2">
      <SectionTitle>6-Month Sales Activity Trend</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B6560" }} />
          <YAxis tick={{ fontSize: 10, fill: "#6B6560" }} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="leads" stroke="#0B2D5B" strokeWidth={2} dot={{ r: 3 }} name="New Leads" />
          <Line type="monotone" dataKey="closed" stroke="#28C76F" strokeWidth={2} dot={{ r: 3 }} name="Closed" />
          <Line type="monotone" dataKey="escrows" stroke="#E8A83A" strokeWidth={2} dot={{ r: 3 }} name="Escrows" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Score Distribution Bar ────────────────────────────────────────
function ScoreDistributionChart({ leads }) {
  const buckets = [
    { label: "0–39 Cold",  min: 0,  max: 39,  fill: "#94A3B8" },
    { label: "40–69 Warm", min: 40, max: 69,  fill: "#E8A83A" },
    { label: "70–100 Hot", min: 70, max: 100, fill: "#E84545" },
  ];
  const data = buckets.map(b => ({
    name: b.label,
    value: leads.filter(l => { const s = scoreLeadLocally(l); return s >= b.min && s <= b.max; }).length,
    fill: b.fill,
  }));

  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] p-5">
      <SectionTitle>Lead Quality Distribution</SectionTitle>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B6560" }} />
          <YAxis hide allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [v, "leads"]} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48} label={{ position: "top", fontSize: 12, fontWeight: "bold", fill: "#6B6560" }}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Escrow Status Chart ───────────────────────────────────────────
function EscrowStatusChart({ escrows }) {
  const statuses = ["draft","contract_sent","contract_signed","funds_pending","funds_secured","inspection","released","closed","cancelled"];
  const data = statuses.map(s => ({
    name: s.replace(/_/g, " "),
    value: escrows.filter(e => e.status === s).length,
  })).filter(d => d.value > 0);

  const COLORS = ["#94A3B8","#60A5FA","#818CF8","#FBBF24","#34D399","#10B981","#28C76F","#059669","#F87171"];

  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] p-5">
      <SectionTitle>Escrow Transaction Stages</SectionTitle>
      {data.length === 0 ? (
        <p className="text-sm text-[#AAA49C] text-center py-8">No escrow data yet</p>
      ) : (
        <div className="space-y-2 mt-1">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-[11px]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-[#6B6560] capitalize flex-1">{d.name}</span>
              <div className="flex-1 bg-[#F7F4EF] rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.round((d.value / escrows.length) * 100)}%`, background: COLORS[i % COLORS.length] }} />
              </div>
              <span className="font-black text-[#1A1814] w-4 text-right">{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────
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

    // Avg score of hot leads
    const hotLeads = leads.filter(l => scoreLeadLocally(l) >= 70);

    // Avg time in pipeline (created → updated for closed)
    const closedWithDates = closed.filter(l => l.created_date && l.updated_date);
    const avgDays = closedWithDates.length > 0
      ? Math.round(closedWithDates.reduce((sum, l) => sum + differenceInDays(new Date(l.updated_date), new Date(l.created_date)), 0) / closedWithDates.length)
      : null;

    const totalEscrowValue = escrows.filter(e => e.status === "closed").reduce((s, e) => s + (e.sale_amount || 0), 0);

    return { total, closed: closed.length, lost: lost.length, convRate, hotLeads: hotLeads.length, avgDays, totalEscrowValue };
  }, [leads, escrows]);

  const isLoading = leadsLoading || escrowsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 border-2 border-[#E8A83A]/30 border-t-[#E8A83A] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div>
        <SectionTitle>Key Performance Indicators</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KPICard icon={Users} label="Total Leads" value={kpis.total} color="#0B2D5B" />
          <KPICard icon={Target} label="Conversion Rate" value={`${kpis.convRate}%`} sub={`${kpis.closed} closed`} color="#28C76F" />
          <KPICard icon={Clock} label="Avg Time-to-Close" value={kpis.avgDays !== null ? `${kpis.avgDays}d` : "—"} sub="Days in pipeline" color="#E8A83A" />
          <KPICard icon={Zap} label="Hot Leads" value={kpis.hotLeads} sub="Score ≥ 70" color="#E84545" />
          <KPICard icon={DollarSign} label="Escrow Closed" value={kpis.totalEscrowValue > 0 ? `$${(kpis.totalEscrowValue / 1000).toFixed(0)}k` : "—"} sub="Total value" color="#6366F1" />
        </div>
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

      {/* Quick insight callouts */}
      {leads.length > 0 && (
        <div className="rounded-2xl border border-[#E8A83A]/30 bg-[#E8A83A]/06 p-5">
          <SectionTitle>Insights & Next Actions</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {kpis.convRate < 15 && (
              <div className="flex gap-2.5 p-3 rounded-xl bg-white border border-black/[0.07]">
                <ArrowRight className="w-4 h-4 text-[#E8A83A] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-black text-[#1A1814]">Conversion below 15%</p>
                  <p className="text-[10px] text-[#6B6560] mt-0.5">Focus follow-up on qualified + negotiating stages to move deals forward.</p>
                </div>
              </div>
            )}
            {kpis.hotLeads > 0 && (
              <div className="flex gap-2.5 p-3 rounded-xl bg-white border border-black/[0.07]">
                <ArrowRight className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-black text-[#1A1814]">{kpis.hotLeads} Hot Lead{kpis.hotLeads > 1 ? "s" : ""} ready</p>
                  <p className="text-[10px] text-[#6B6560] mt-0.5">Call today — hot leads convert 3× faster when contacted within 24h.</p>
                </div>
              </div>
            )}
            {kpis.avgDays !== null && kpis.avgDays > 30 && (
              <div className="flex gap-2.5 p-3 rounded-xl bg-white border border-black/[0.07]">
                <ArrowRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-black text-[#1A1814]">Cycle {kpis.avgDays}d — above target</p>
                  <p className="text-[10px] text-[#6B6560] mt-0.5">Target 20–40% reduction. Review stalled leads in negotiating stage.</p>
                </div>
              </div>
            )}
            {listings.length > 0 && (
              <div className="flex gap-2.5 p-3 rounded-xl bg-white border border-black/[0.07]">
                <ArrowRight className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-black text-[#1A1814]">{listings.length} Active Listings</p>
                  <p className="text-[10px] text-[#6B6560] mt-0.5">Match unlinked leads to listings using Match Engine for faster deals.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}