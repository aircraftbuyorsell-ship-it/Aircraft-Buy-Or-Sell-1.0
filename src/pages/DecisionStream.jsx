import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Activity, Search, X, ChevronDown, ChevronRight, Brain, Shield, Radar, DollarSign, Fingerprint } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const TYPE_META = {
  ati_score:             { label: "ATI Score",            icon: Brain,       color: "#0B2D5B" },
  deal_radar_eligible:   { label: "Deal Radar",           icon: Radar,       color: "#E8A83A" },
  commission_split:      { label: "Commission Split",     icon: DollarSign,  color: "#0F7A56" },
  first_verified_source: { label: "First Verified Src",   icon: Fingerprint, color: "#185FA5" },
  other:                 { label: "Other",                icon: Shield,      color: "#6B6560" },
};

function TypeBadge({ type }) {
  const m = TYPE_META[type] || TYPE_META.other;
  const Icon = m.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-black px-2 py-1 rounded-full"
      style={{ backgroundColor: `${m.color}15`, color: m.color }}
    >
      <Icon className="w-3 h-3" />
      {m.label}
    </span>
  );
}

function JsonPreview({ data }) {
  if (!data || Object.keys(data).length === 0) return <span className="text-[#AAA49C] text-[11px]">—</span>;
  return (
    <pre className="text-[10px] bg-[#F7F4EF] rounded-md p-2 text-[#1A1814] whitespace-pre-wrap break-all max-h-60 overflow-auto border border-black/[0.06]">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function DecisionRow({ d }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-black/[0.07] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F7F4EF] transition-colors text-left"
      >
        {open ? <ChevronDown className="w-4 h-4 text-[#AAA49C] shrink-0" /> : <ChevronRight className="w-4 h-4 text-[#AAA49C] shrink-0" />}
        <TypeBadge type={d.decision_type} />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-[#1A1814] truncate">
            {d.subject_label || d.subject_id || d.subject_type}
          </p>
          <p className="text-[10px] text-[#AAA49C] truncate">
            {d.rule_source || "—"} · v{d.rule_version || "?"} · {d.actor || "system"}
          </p>
        </div>
        <p className="text-[10px] text-[#AAA49C] shrink-0">
          {d.created_date ? formatDistanceToNow(new Date(d.created_date), { addSuffix: true }) : "—"}
        </p>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-black/[0.06] space-y-3">
          {d.reasoning && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-bold mb-1">Reasoning</p>
              <p className="text-[12px] text-[#1A1814] leading-relaxed">{d.reasoning}</p>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-bold mb-1">Inputs</p>
              <JsonPreview data={d.inputs} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-bold mb-1">Outputs</p>
              <JsonPreview data={d.outputs} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DecisionStream() {
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  const { data: me, isLoading: loadingMe } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });
  const isAdmin = me?.role === "admin";

  const { data: decisions = [], isLoading } = useQuery({
    queryKey: ["decision-log"],
    queryFn: () => base44.entities.DecisionLog.list("-created_date", 300),
    enabled: isAdmin,
  });

  const filtered = useMemo(() => {
    return decisions.filter(d => {
      if (typeFilter && d.decision_type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${d.subject_label} ${d.subject_id} ${d.rule_source} ${d.actor} ${d.reasoning}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [decisions, typeFilter, search]);

  const counts = useMemo(() => {
    const c = {};
    for (const d of decisions) c[d.decision_type] = (c[d.decision_type] || 0) + 1;
    return c;
  }, [decisions]);

  if (loadingMe) return <div className="p-8 text-[#AAA49C]">Loading…</div>;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-8">
        <div className="bg-white border border-black/10 rounded-2xl p-8 max-w-md text-center">
          <Activity className="w-10 h-10 text-[#C0392B] mx-auto mb-3" />
          <h1 className="text-xl font-black text-[#1A1814]">Admin only</h1>
          <p className="text-sm text-[#6B6560] mt-2">
            The Decision Stream is reserved for ABOS administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Admin · Observability</p>
        <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight uppercase mt-1">Decision Stream</h1>
        <p className="text-[#6B6560] text-sm mt-0.5">
          Every automated rule call — inputs, outputs, version. {decisions.length} recorded.
        </p>
      </div>

      {/* Type chips */}
      <div className="px-4 md:px-8 pb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter("")}
          className={`text-[10px] uppercase tracking-wider font-black px-3 py-1.5 rounded-full border transition-colors ${
            !typeFilter ? "bg-[#0B2D5B] text-white border-[#0B2D5B]" : "bg-white text-[#6B6560] border-black/10 hover:border-[#0B2D5B]"
          }`}
        >
          All · {decisions.length}
        </button>
        {Object.entries(TYPE_META).map(([k, m]) => {
          const active = typeFilter === k;
          const Icon = m.icon;
          return (
            <button
              key={k}
              onClick={() => setTypeFilter(k)}
              className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-black px-3 py-1.5 rounded-full border transition-colors ${
                active ? "text-white border-transparent" : "bg-white text-[#6B6560] border-black/10 hover:border-current"
              }`}
              style={active ? { backgroundColor: m.color } : { color: active ? "white" : m.color }}
            >
              <Icon className="w-3 h-3" />
              {m.label} · {counts[k] || 0}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="px-4 md:px-8 pb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAA49C]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search subject, source, actor, reasoning…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#0B2D5B]"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAA49C]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Stream */}
      <div className="px-4 md:px-8 pb-8 space-y-2">
        {isLoading ? (
          [...Array(6)].map((_, i) => <div key={i} className="h-16 bg-black/5 rounded-xl animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-black/[0.07] rounded-2xl p-10 text-center">
            <Activity className="w-10 h-10 text-[#AAA49C] mx-auto mb-3" />
            <p className="text-sm font-bold text-[#1A1814]">No decisions yet</p>
            <p className="text-[11px] text-[#AAA49C] mt-1">
              Decisions appear here as the system scores listings, computes commissions, and locks attributions.
            </p>
          </div>
        ) : (
          filtered.map(d => <DecisionRow key={d.id} d={d} />)
        )}
      </div>
    </div>
  );
}