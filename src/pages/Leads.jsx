import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useMemo } from "react";
import { Users, Search, Mail, ChevronDown, X, Filter, Lock, Zap } from "lucide-react";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#D4A017]">{children}</p>;
}

const STATUS_CONFIG = {
  new:         { label: "New",         bg: "rgba(24,95,165,0.1)",   text: "#185FA5",  border: "rgba(24,95,165,0.2)" },
  contacted:   { label: "Contacted",   bg: "rgba(166,124,0,0.1)",   text: "#A67C00",  border: "rgba(166,124,0,0.25)" },
  qualified:   { label: "Qualified",   bg: "rgba(212,160,23,0.12)", text: "#D4A017",  border: "rgba(212,160,23,0.3)" },
  negotiating: { label: "Negotiating", bg: "rgba(101,60,180,0.1)",  text: "#6533BE",  border: "rgba(101,60,180,0.2)" },
  closed:      { label: "Closed",      bg: "rgba(15,122,86,0.1)",   text: "#0F7A56",  border: "rgba(15,122,86,0.2)" },
  lost:        { label: "Lost",        bg: "rgba(192,57,43,0.1)",   text: "#C0392B",  border: "rgba(192,57,43,0.2)" },
};

const BUDGET_ORDER = ["<100k", "<200k", "<500k", "<1M", ">1M"];

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border whitespace-nowrap"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}>
      {c.label}
    </span>
  );
}

function initials(name) {
  return (name || "?").split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

function LeadRow({ lead, onStatusChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 md:px-6 py-4 hover:bg-[#F7F4EF] transition-colors border-b border-black/[0.05] last:border-0">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-[#D4A017]/10 border border-[#D4A017]/20 flex items-center justify-center shrink-0">
        <span className="text-[11px] font-black text-[#D4A017]">{initials(lead.name)}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#1A1814] truncate">{lead.name}</p>
        <p className="text-[11px] text-[#AAA49C] truncate">{lead.email}</p>
        {lead.aircraft_preference && (
          <p className="text-[11px] text-[#6B6560] mt-0.5 truncate max-w-xs">{lead.aircraft_preference}</p>
        )}
      </div>

      {/* Budget */}
      <div className="shrink-0 text-center hidden md:block">
        <p className="text-[9px] text-[#AAA49C] uppercase tracking-wider mb-0.5">Budget</p>
        <p className="text-sm font-bold text-[#1A1814]">{lead.budget || "—"}</p>
      </div>

      {/* Status dropdown */}
      <div className="relative shrink-0">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5"
        >
          <StatusBadge status={lead.status || "new"} />
          <ChevronDown className="w-3 h-3 text-[#AAA49C]" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-black/10 rounded-xl shadow-lg z-20 py-1 min-w-[130px]">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => { onStatusChange(lead.id, key); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-[#F7F4EF] transition-colors"
                style={{ color: cfg.text }}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mail */}
      <a href={`mailto:${lead.email}`} className="shrink-0 text-[#AAA49C] hover:text-[#D4A017] transition-colors" onClick={e => e.stopPropagation()}>
        <Mail className="w-4 h-4" />
      </a>
    </div>
  );
}

export default function Leads() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Lead.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const filtered = useMemo(() => leads.filter(l => {
    const q = search.toLowerCase();
    if (q && !`${l.name} ${l.email} ${l.aircraft_preference}`.toLowerCase().includes(q)) return false;
    if (statusFilter && (l.status || "new") !== statusFilter) return false;
    if (budgetFilter && l.budget !== budgetFilter) return false;
    return true;
  }), [leads, search, statusFilter, budgetFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter(l => !l.status || l.status === "new").length,
    qualified: leads.filter(l => l.status === "qualified").length,
    closed: leads.filter(l => l.status === "closed").length,
  }), [leads]);

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <GoldLabel>IntraZone · Private Marketplace</GoldLabel>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight">Qualified Leads Marketplace</h1>
            <p className="text-[#6B6560] text-sm mt-0.5">{filtered.length} of {stats.total} leads · verified & paid access only</p>
          </div>
        </div>

        {/* Private / paid access notice */}
        <div className="mt-4 flex flex-wrap items-start gap-3 bg-[#0B2D5B] text-white rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-[#E8A83A] flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-[#0B2D5B]" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black uppercase tracking-tight">Not a public listing · Credits required</p>
            <p className="text-[12px] text-white/75 mt-0.5 leading-relaxed">
              Each qualified lead unlock costs credits. Leads are verified buyers — not free tire-kickers. Only active IntraZone members can reveal, contact, or claim.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#E8A83A] text-[#0B2D5B] text-[11px] uppercase tracking-wider font-black px-3 py-1.5 rounded-full shrink-0">
            <Zap className="w-3.5 h-3.5" /> 10 cr / lead
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total, color: "#1A1814" },
            { label: "New", value: stats.new, color: "#185FA5" },
            { label: "Qualified", value: stats.qualified, color: "#D4A017" },
            { label: "Closed", value: stats.closed, color: "#0F7A56" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-black/[0.07] rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAA49C]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, aircraft…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-black/10 rounded-xl text-sm text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:border-[#D4A017] transition-colors" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAA49C]"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-black/10 rounded-xl text-sm text-[#6B6560] focus:outline-none focus:border-[#D4A017]">
            <option value="">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={budgetFilter} onChange={e => setBudgetFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-black/10 rounded-xl text-sm text-[#6B6560] focus:outline-none focus:border-[#D4A017]">
            <option value="">All Budgets</option>
            {BUDGET_ORDER.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="hidden md:flex items-center gap-4 px-6 py-3 border-b border-black/[0.06] bg-[#F7F4EF]">
            <div className="w-9 shrink-0" />
            <div className="flex-1">
              <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Lead</p>
            </div>
            <div className="w-20 text-center">
              <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Budget</p>
            </div>
            <div className="w-28 text-right">
              <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Status</p>
            </div>
            <div className="w-8" />
          </div>

          {isLoading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-black/[0.05]">
                <div className="w-9 h-9 rounded-full bg-black/5 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-black/5 rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-black/5 rounded animate-pulse w-1/2" />
                </div>
                <div className="h-5 w-16 bg-black/5 rounded-full animate-pulse" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-[#AAA49C]">
              <Users className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No leads found</p>
              <p className="text-[11px] mt-1">Import leads from the Excel file to get started</p>
            </div>
          ) : (
            filtered.map(lead => (
              <LeadRow key={lead.id} lead={lead}
                onStatusChange={(id, status) => updateMutation.mutate({ id, status })} />
            ))
          )}
        </div>

        {leads.length === 0 && !isLoading && (
          <div className="bg-[rgba(212,160,23,0.06)] border border-[rgba(212,160,23,0.2)] rounded-xl px-5 py-4 text-sm text-[#6B6560]">
            <span className="font-semibold text-[#A67C00]">100 AeroTrust leads</span> are ready to import. Use the import feature to load them from the Excel file.
          </div>
        )}
      </div>
    </div>
  );
}