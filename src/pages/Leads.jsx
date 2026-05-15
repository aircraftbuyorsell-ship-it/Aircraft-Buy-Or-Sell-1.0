import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useMemo } from "react";
import { Users, Search, X, Lock, Zap, Sparkles, UserPlus } from "lucide-react";
import { useBehavior } from "@/lib/useBehavior";
import { toCredits, fromCredits } from "@/lib/pricing";
import LeadPackages, { LEAD_UNLOCK_COST } from "@/components/leads/LeadPackages";
import LeadRow, { STATUS_CONFIG } from "@/components/leads/LeadRow";
import UpgradeGate from "@/components/marketing/UpgradeGate";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";
import AddLeadModal from "@/components/leads/AddLeadModal";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">{children}</p>;
}

const BUDGET_ORDER = ["<100k", "<200k", "<500k", "<1M", ">1M"];


export default function Leads() {
  const queryClient = useQueryClient();
  const { behavior, tokens, tier } = useBehavior();
  const userEmail = behavior?.user_email;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("");
  const [unlocked, setUnlocked] = useState(() => new Set());
  const [gate, setGate] = useState(null); // { creditsNeeded }
  const [toast, setToast] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const userCredits = toCredits(tokens);
  const isEnterprise = tier === "enterprise";

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Lead.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  // Consume credits (tokens) + persist unlock
  const consumeCredits = async (credits, feature) => {
    if (isEnterprise) return true;
    const tokensNeeded = fromCredits(credits);
    if (!behavior?.id || tokens < tokensNeeded) {
      setGate({ creditsNeeded: credits });
      return false;
    }
    const newBalance = Math.max(0, tokens - tokensNeeded);
    await base44.entities.UserBehavior.update(behavior.id, { tokens_remaining: newBalance });
    await base44.entities.TokenTransaction.create({
      user_email: behavior.user_email,
      type: "consumption",
      amount: -tokensNeeded,
      feature,
      balance_after: newBalance,
    });
    queryClient.invalidateQueries({ queryKey: ["user-behavior"] });
    return true;
  };

  const handleUnlockOne = async (lead) => {
    if (unlocked.has(lead.id)) return;
    const ok = await consumeCredits(LEAD_UNLOCK_COST, "lead_unlock_single");
    if (!ok) return;
    const next = new Set(unlocked);
    next.add(lead.id);
    setUnlocked(next);
    setToast({ msg: `Contact unlocked — ${LEAD_UNLOCK_COST} credits used`, color: "#0F7A56" });
    setTimeout(() => setToast(null), 2500);
  };

  const handleBuyPack = async (pack) => {
    // Single pack just scrolls to nearest locked row — user picks which to unlock
    if (pack.id === "single") {
      const firstLocked = leads.find(l => !unlocked.has(l.id));
      if (firstLocked) handleUnlockOne(firstLocked);
      return;
    }
    // Bulk packs unlock N locked leads
    const ok = await consumeCredits(pack.credits, `lead_pack_${pack.id}`);
    if (!ok) return;
    const locked = leads.filter(l => !unlocked.has(l.id)).slice(0, pack.leads);
    const next = new Set(unlocked);
    locked.forEach(l => next.add(l.id));
    setUnlocked(next);
    setToast({
      msg: `${locked.length} contacts unlocked · ${pack.credits} credits used`,
      color: "#0F7A56",
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
    <div className="relative min-h-screen overflow-hidden bg-[#F7F4EF]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden">
        <img
          src="https://media.base44.com/images/public/69f665b6d05c695ac1e7b353/61cd83faf_Snmekobrazovky2026-05-15095426.png"
          alt="Airport lounge window motif"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.55] grayscale"
        />
        <img
          src="https://media.base44.com/images/public/69f665b6d05c695ac1e7b353/aad075b19_624324958_2759110867807924_1126729800774297176_n.jpg"
          alt="Aircraft runway motif"
          className="absolute right-[-6%] top-12 w-[58%] max-w-3xl opacity-[0.58] mix-blend-multiply blur-[0.4px] hidden md:block"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-[#F7F4EF]/42 to-[#F7F4EF]/90" />
        <div className="absolute inset-y-0 left-[18%] w-px bg-[#111113]/10" />
        <div className="absolute inset-y-0 left-[48%] w-px bg-[#111113]/10" />
        <div className="absolute inset-y-0 right-[19%] w-px bg-[#111113]/10" />
      </div>
      {/* Header */}
      <div className="relative z-10 px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <GoldLabel>IntraZone · Private Marketplace</GoldLabel>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 rounded-[2rem] border border-white/65 bg-white/45 backdrop-blur-xl px-5 py-5 shadow-[0_24px_70px_rgba(11,45,91,0.08)]">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight uppercase">Qualified Leads Marketplace</h1>
            <p className="text-[#6B6560] text-sm mt-0.5">
              {stats.unlocked}/{stats.total} contacts unlocked · {userCredits.toLocaleString()} credits available
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 bg-[#0B2D5B] hover:bg-[#143C75] text-white text-[11px] uppercase tracking-wider font-black px-3 py-1.5 rounded-full transition-colors">
              <UserPlus className="w-3.5 h-3.5" /> Add Lead
            </button>
            <div className="flex items-center gap-1.5 bg-[#E8A83A] text-[#0B2D5B] text-[11px] uppercase tracking-wider font-black px-3 py-1.5 rounded-full">
              <Zap className="w-3.5 h-3.5" /> {LEAD_UNLOCK_COST} cr / single
            </div>
          </div>
        </div>

        {/* Private notice */}
        <div className="mt-4 flex flex-wrap items-start gap-3 bg-[#0B2D5B]/88 backdrop-blur-xl text-white rounded-2xl px-4 py-3 border border-white/15 shadow-[0_18px_55px_rgba(11,45,91,0.18)]">
          <div className="w-8 h-8 rounded-full bg-[#E8A83A] flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-[#0B2D5B]" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black uppercase tracking-tight">Contact info is masked until you unlock it</p>
            <p className="text-[12px] text-white/75 mt-0.5 leading-relaxed">
              Buy a single contact on-demand — or unlock in volume with a discounted pack. Verified buyers only.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 md:px-8 pb-8 space-y-5">
        {/* Volume packages */}
        <LeadPackages onSelectPack={handleBuyPack} availableLeads={leads.length - stats.unlocked} />

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total, color: "#1A1814" },
            { label: "Unlocked", value: stats.unlocked, color: "#0F7A56" },
            { label: "Qualified", value: stats.qualified, color: "#E8A83A" },
            { label: "Closed", value: stats.closed, color: "#0B2D5B" },
          ].map(s => (
            <div key={s.label} className="bg-white/58 backdrop-blur-xl border border-white/65 rounded-xl px-4 py-3 text-center shadow-sm">
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
              placeholder="Search aircraft preference, budget…"
              className="w-full pl-9 pr-4 py-2.5 bg-white/62 backdrop-blur-xl border border-white/70 rounded-xl text-sm text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:border-[#0B2D5B] transition-colors shadow-sm" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAA49C]"><X className="w-3.5 h-3.5" /></button>}
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
        <div className="bg-white/62 backdrop-blur-xl border border-white/70 rounded-2xl overflow-hidden shadow-[0_24px_70px_rgba(11,45,91,0.08)]">
          <div className="hidden md:flex items-center gap-4 px-6 py-3 border-b border-black/[0.06] bg-white/35 backdrop-blur-xl">
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
            <div className="w-24 text-right">
              <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Action</p>
            </div>
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
          className="fixed bottom-6 right-6 z-50 bg-white border rounded-xl shadow-lg px-4 py-3 flex items-center gap-2 animate-in slide-in-from-bottom-5"
          style={{ borderColor: toast.color }}
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
          setToast({ msg: "Lead added successfully", color: "#0F7A56" });
          setTimeout(() => setToast(null), 2500);
        }}
      />
    </div>
  );
}