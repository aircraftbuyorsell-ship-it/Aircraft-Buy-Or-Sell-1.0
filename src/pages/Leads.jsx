import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useMemo } from "react";
import { Users, Search, X, Lock, Zap, Sparkles, UserPlus } from "lucide-react";
import { useBehavior } from "@/lib/useBehavior";
import LeadPackages from "@/components/leads/LeadPackages";
import LeadRow, { STATUS_CONFIG } from "@/components/leads/LeadRow";
import UpgradeGate from "@/components/marketing/UpgradeGate";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";
import AddLeadModal from "@/components/leads/AddLeadModal";

const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const W3 = "rgba(255,255,255,0.35)";
const BORDER = "rgba(255,255,255,0.08)";
const AMBER = "#f5c242";
const TEAL = "#5dcaa5";
const BLUE = "#4e8ef7";
const CARD = "rgba(255,255,255,0.04)";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: AMBER }}>{children}</p>;
}

const BUDGET_ORDER = ["<100k", "<200k", "<500k", "<1M", ">1M"];

export default function Leads() {
  const queryClient = useQueryClient();
  const { behavior, tier } = useBehavior();
  const userEmail = behavior?.user_email;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("");
  const [unlocked, setUnlocked] = useState(() => new Set());
  const [gate, setGate] = useState(null);
  const [toast, setToast] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const hasLeadAccess = tier === "pro" || tier === "enterprise";

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Lead.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const requireLeadAccess = () => {
    if (hasLeadAccess) return true;
    setGate({ reason: "plan" });
    return false;
  };

  const handleUnlockOne = async (lead) => {
    if (unlocked.has(lead.id)) return;
    if (!requireLeadAccess()) return;
    const next = new Set(unlocked);
    next.add(lead.id);
    setUnlocked(next);
    setToast({ msg: `Contact unlocked — ${LEAD_UNLOCK_COST} credits used`, color: TEAL });
    setTimeout(() => setToast(null), 2500);
  };

  const handleBuyPack = async (pack) => {
    if (!requireLeadAccess()) return;
    if (pack.id === "single") {
      const firstLocked = leads.find(l => !unlocked.has(l.id));
      if (firstLocked) {
        try { await handleUnlockOne(firstLocked); } catch (_) {}
      }
      return;
    }
    const locked = leads.filter(l => !unlocked.has(l.id)).slice(0, pack.leads);
    const next = new Set(unlocked);
    locked.forEach(l => next.add(l.id));
    setUnlocked(next);
    setToast({
      msg: `${locked.length} contacts unlocked`,
      color: TEAL,
    });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => leads.filter(l => {
    const q = search.toLowerCase();
    if (q && !`${l.name} ${l.email} ${l.aircraft_preference}`.toLowerCase().includes(q)) return false;
    if (statusFilter && (l.status || "new") !== statusFilter) return false;
    if (budgetFilter && l.budget !== budgetFilter) return false;
    return true;
  }), [leads, search, statusFilter, budgetFilter]);

  const stats = useMemo(() => ({
    total: leads.length,
    unlocked: leads.filter(l => unlocked.has(l.id)).length,
    qualified: leads.filter(l => l.status === "qualified").length,
    closed: leads.filter(l => l.status === "closed").length,
  }), [leads, unlocked]);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "transparent" }}>
      {/* Header */}
      <div className="relative z-10 px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <GoldLabel>IntraZone · Private Marketplace</GoldLabel>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 rounded-2xl px-5 py-5" style={{ background: CARD, border: `0.5px solid ${BORDER}` }}>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase" style={{ color: W1 }}>Qualified Leads Marketplace</h1>
            <p className="text-sm mt-0.5" style={{ color: W2 }}>
              {stats.unlocked}/{stats.total} contacts unlocked · {hasLeadAccess ? "Lead CRM included with your plan" : "Upgrade to Pro to unlock contacts"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-black px-3 py-1.5 rounded-full transition-opacity hover:opacity-90"
              style={{ background: BLUE, color: "#04060a" }}>
              <UserPlus className="w-3.5 h-3.5" /> Add Lead
            </button>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-black px-3 py-1.5 rounded-full"
              style={{ background: AMBER, color: "#04060a" }}>
              <Zap className="w-3.5 h-3.5" /> {hasLeadAccess ? "Lead CRM included" : "Pro required"}
            </div>
          </div>
        </div>

        {/* Private notice */}
        <div className="mt-4 flex flex-wrap items-start gap-3 rounded-2xl px-4 py-3" style={{ background: "rgba(78,142,247,0.06)", border: "0.5px solid rgba(78,142,247,0.20)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: AMBER }}>
            <Lock className="w-4 h-4" style={{ color: "#04060a" }} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black uppercase tracking-tight" style={{ color: W1 }}>Contact info is masked until you unlock it</p>
            <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: W2 }}>
                {hasLeadAccess ? "Your plan includes Lead CRM access. Contact information is unlocked through your plan entitlement — no ABOS credits or tokens are consumed." : "Lead CRM is included with Pro and Enterprise. Upgrade your plan to unlock contact information."}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 md:px-8 pb-8 space-y-5">
        {/* Volume packages */}
        <LeadPackages onSelectPack={handleBuyPack} availableLeads={leads.length - stats.unlocked} hasLeadAccess={hasLeadAccess} />

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total, color: W1 },
            { label: "Unlocked", value: stats.unlocked, color: TEAL },
            { label: "Qualified", value: stats.qualified, color: AMBER },
            { label: "Closed", value: stats.closed, color: BLUE },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-4 py-3 text-center" style={{ background: CARD, border: `0.5px solid ${BORDER}` }}>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] uppercase tracking-wider font-semibold mt-0.5" style={{ color: W3 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: W3 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search aircraft preference, budget…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
              style={{ background: CARD, border: `0.5px solid ${BORDER}`, color: W1 }} />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: W3 }}><X className="w-3.5 h-3.5" /></button>}
          </div>
          <BottomSheetSelect
            label="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "", label: "All Status" },
              ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label })),
            ]}
            placeholder="All Status"
            className="min-w-[140px]"
          />
          <BottomSheetSelect
            label="Filter by budget"
            value={budgetFilter}
            onChange={setBudgetFilter}
            options={[{ value: "", label: "All Budgets" }, ...BUDGET_ORDER.map(b => ({ value: b, label: b }))]}
            placeholder="All Budgets"
            className="min-w-[140px]"
          />
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `0.5px solid ${BORDER}` }}>
          <div className="hidden md:flex items-center gap-4 px-6 py-3" style={{ borderBottom: `0.5px solid ${BORDER}`, background: "rgba(255,255,255,0.03)" }}>
            <div className="w-9 shrink-0" />
            <div className="flex-1">
              <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: W3 }}>Lead</p>
            </div>
            <div className="w-20 text-center">
              <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: W3 }}>Budget</p>
            </div>
            <div className="w-28 text-right">
              <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: W3 }}>Status</p>
            </div>
            <div className="w-24 text-right">
              <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: W3 }}>Action</p>
            </div>
          </div>

          {isLoading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: `0.5px solid ${BORDER}` }}>
                <div className="w-9 h-9 rounded-full animate-pulse shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 rounded animate-pulse w-1/3" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <div className="h-3 rounded animate-pulse w-1/2" style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>
                <div className="h-5 w-16 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16" style={{ color: W3 }}>
              <Users className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No leads found</p>
            </div>
          ) : (
            filtered.map(lead => (
              <LeadRow
                key={lead.id}
                lead={lead}
                unlocked={isEnterprise || unlocked.has(lead.id)}
                unlockCost={LEAD_UNLOCK_COST}
                onUnlock={handleUnlockOne}
                onStatusChange={(id, status) => updateMutation.mutate({ id, status })}
              />
            ))
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 rounded-xl shadow-lg px-4 py-3 flex items-center gap-2 animate-in slide-in-from-bottom-5"
          style={{ background: "rgba(13,17,23,0.98)", border: `0.5px solid ${toast.color}` }}
        >
          <Sparkles className="w-4 h-4" style={{ color: toast.color }} />
          <p className="text-sm font-bold" style={{ color: toast.color }}>{toast.msg}</p>
        </div>
      )}

      <UpgradeGate
        open={!!gate}
        onClose={() => setGate(null)}
        feature="leads_crm"
        requiredTokens={gate ? fromCredits(gate.creditsNeeded) : 0}
        userTokens={tokens}
        isVerified={behavior?.verification_paid}
      />

      <AddLeadModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["leads"] });
          setToast({ msg: "Lead added successfully", color: TEAL });
          setTimeout(() => setToast(null), 2500);
        }}
      />
    </div>
  );
}