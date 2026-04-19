import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { DollarSign, RefreshCw, Layers, Wallet, Search, X, Sparkles } from "lucide-react";
import {
  computeWaterfall,
  persistLedger,
  buildSettlementBatches,
  markSettlementPaid,
} from "@/lib/commission";
import LedgerTable from "@/components/commissions/LedgerTable";
import SettlementRow from "@/components/commissions/SettlementRow";
import StatTile from "@/components/commissions/StatTile";

const TABS = [
  { id: "ledger", label: "Commission Ledger", icon: Layers },
  { id: "settlements", label: "Settlements", icon: Wallet },
];

export default function Commissions() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("ledger");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [recomputing, setRecomputing] = useState(false);

  // Admin gate
  const { data: me, isLoading: loadingMe } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });
  const isAdmin = me?.role === "admin";

  const { data: ledger = [], isLoading: loadingLedger } = useQuery({
    queryKey: ["commission-ledger"],
    queryFn: () => base44.entities.CommissionLedger.list("-created_date", 500),
    enabled: isAdmin,
  });
  const { data: settlements = [], isLoading: loadingSettlements } = useQuery({
    queryKey: ["settlements"],
    queryFn: () => base44.entities.Settlement.list("-created_date", 200),
    enabled: isAdmin,
  });

  // ─── Stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const allocated = ledger.filter(e => e.status === "allocated");
    const batched = ledger.filter(e => e.status === "batched");
    const paid = ledger.filter(e => e.status === "paid");
    const sum = arr => arr.reduce((s, e) => s + (e.amount || 0), 0);
    const pendingPayouts = settlements.filter(s => s.status !== "paid" && s.status !== "cancelled");
    return {
      poolOutstanding: sum(allocated) + sum(batched),
      paidLifetime: sum(paid),
      pendingBatches: pendingPayouts.length,
      pendingBatchAmount: pendingPayouts.reduce((s, b) => s + (b.total_amount || 0), 0),
    };
  }, [ledger, settlements]);

  // ─── Filters ────────────────────────────────────────────────────────────
  const filteredLedger = useMemo(() => {
    if (!search) return ledger;
    const q = search.toLowerCase();
    return ledger.filter(e =>
      `${e.public_card_code} ${e.payee_email} ${e.payee_slug} ${e.role}`.toLowerCase().includes(q)
    );
  }, [ledger, search]);

  // ─── Recompute from finalized escrows ──────────────────────────────────
  const handleRecompute = async () => {
    setRecomputing(true);
    try {
      // Pull finalized escrows that have a finder's fee but no ledger yet
      const finalized = await base44.entities.EscrowTransaction.filter(
        { status: "closed" }, "-closed_at", 100
      );
      let totalCreated = 0;
      for (const escrow of finalized) {
        if (!escrow.finders_fee_amount || escrow.finders_fee_amount <= 0) continue;
        // Find the ATI card via listing
        const cards = escrow.listing
          ? await base44.entities.ATICard.filter({ listing: escrow.listing }, "-created_date", 1)
          : [];
        const card = cards[0];
        if (!card) continue;
        // Gather events for attribution
        const events = await base44.entities.LeadEvent.filter(
          { ati_card: card.id }, "-created_date", 200
        );
        const levels = await computeWaterfall({
          card,
          escrow,
          commissionPool: escrow.finders_fee_amount,
          events,
        });
        if (!levels.length) continue;
        const created = await persistLedger({ card, escrow, levels });
        totalCreated += created.length;
      }
      qc.invalidateQueries({ queryKey: ["commission-ledger"] });
      setToast({
        msg: totalCreated > 0
          ? `${totalCreated} commission entries computed from finalized escrows`
          : "No new commissions — all finalized escrows already ledgered",
        color: "#0F7A56",
      });
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      setToast({ msg: `Recompute failed: ${err.message}`, color: "#C0392B" });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setRecomputing(false);
    }
  };

  // ─── Build batches from selected ─────────────────────────────────────────
  const handleBuildBatches = async () => {
    const entries = ledger.filter(e => selected.has(e.id));
    if (!entries.length) return;
    try {
      const batches = await buildSettlementBatches(entries);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["commission-ledger"] });
      qc.invalidateQueries({ queryKey: ["settlements"] });
      setToast({
        msg: `${batches.length} settlement batch${batches.length === 1 ? "" : "es"} created`,
        color: "#0F7A56",
      });
      setTimeout(() => setToast(null), 3000);
      setTab("settlements");
    } catch (err) {
      setToast({ msg: err.message, color: "#C0392B" });
      setTimeout(() => setToast(null), 3500);
    }
  };

  // ─── Mark settlement paid ───────────────────────────────────────────────
  const handleMarkPaid = async (batch, { method, reference }) => {
    const count = await markSettlementPaid(batch, {
      paymentMethod: method,
      paymentReference: reference,
      adminEmail: me?.email,
    });
    qc.invalidateQueries({ queryKey: ["commission-ledger"] });
    qc.invalidateQueries({ queryKey: ["settlements"] });
    setToast({ msg: `${batch.batch_code} paid · ${count} entries settled`, color: "#0F7A56" });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Export payout summary ──────────────────────────────────────────────
  const handleExport = (batch, entries) => {
    const rows = [
      ["Batch Code", batch.batch_code],
      ["Payee", batch.payee_email],
      ["Role", batch.payee_role],
      ["Period", `${batch.period_start || ""} - ${batch.period_end || ""}`],
      ["Status", batch.status],
      ["Total", batch.total_amount],
      [""],
      ["Card Code", "Level", "Role", "Slug", "Pool", "%", "Amount"],
      ...entries.map(e => [
        e.public_card_code, e.level, e.role, e.payee_slug || "",
        e.commission_pool, e.percentage, e.amount,
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${batch.batch_code}-summary.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Gate ───────────────────────────────────────────────────────────────
  if (loadingMe) return <div className="p-8 text-[#AAA49C]">Loading…</div>;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-8">
        <div className="bg-white border border-black/10 rounded-2xl p-8 max-w-md text-center">
          <DollarSign className="w-10 h-10 text-[#C0392B] mx-auto mb-3" />
          <h1 className="text-xl font-black text-[#1A1814]">Admin only</h1>
          <p className="text-sm text-[#6B6560] mt-2">
            The Commission Payout Dashboard is reserved for ABOS administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Admin · Commissions</p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight uppercase">Payout Dashboard</h1>
            <p className="text-[#6B6560] text-sm mt-0.5">3-level waterfall · Issuer / Marketplace / Broker</p>
          </div>
          <button onClick={handleRecompute} disabled={recomputing}
            className="flex items-center gap-2 bg-[#0B2D5B] hover:bg-[#143C75] disabled:opacity-50 text-white text-[11px] uppercase tracking-wider font-black px-4 py-2.5 rounded-lg">
            <RefreshCw className={`w-3.5 h-3.5 ${recomputing ? "animate-spin" : ""}`} />
            {recomputing ? "Computing…" : "Recompute from Escrows"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 md:px-8 pb-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Outstanding" value={`$${stats.poolOutstanding.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub={`${ledger.filter(e => e.status !== "paid").length} entries`} color="#E8A83A" />
        <StatTile label="Paid Lifetime" value={`$${stats.paidLifetime.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub={`${ledger.filter(e => e.status === "paid").length} entries`} color="#0F7A56" />
        <StatTile label="Pending Batches" value={stats.pendingBatches}
          sub={`$${stats.pendingBatchAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} to pay`} color="#185FA5" />
        <StatTile label="Total Batches" value={settlements.length}
          sub={`${settlements.filter(s => s.status === "paid").length} paid`} color="#0B2D5B" />
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-8 flex items-center gap-1 border-b border-black/[0.06]">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[11px] uppercase tracking-wider font-black border-b-2 transition-colors ${
                active ? "border-[#E8A83A] text-[#0B2D5B]" : "border-transparent text-[#AAA49C] hover:text-[#6B6560]"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="px-4 md:px-8 py-5 space-y-4">
        {tab === "ledger" && (
          <>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAA49C]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search card, payee, slug, role…"
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#0B2D5B]" />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAA49C]"><X className="w-3.5 h-3.5" /></button>}
            </div>

            {loadingLedger ? (
              <div className="h-40 bg-black/5 rounded-2xl animate-pulse" />
            ) : (
              <LedgerTable
                entries={filteredLedger}
                selectable
                selected={selected}
                onSelectionChange={setSelected}
                onBatch={handleBuildBatches}
              />
            )}
          </>
        )}

        {tab === "settlements" && (
          <div className="space-y-2">
            {loadingSettlements ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-16 bg-black/5 rounded-xl animate-pulse" />)
            ) : settlements.length === 0 ? (
              <div className="bg-white border border-black/[0.07] rounded-2xl p-10 text-center">
                <Wallet className="w-10 h-10 text-[#AAA49C] mx-auto mb-3" />
                <p className="text-sm font-bold text-[#1A1814]">No settlement batches yet</p>
                <p className="text-[11px] text-[#AAA49C] mt-1">Select allocated commissions in the Ledger tab to build batches.</p>
              </div>
            ) : (
              settlements.map(b => (
                <SettlementRowWithEntries
                  key={b.id}
                  batch={b}
                  onMarkPaid={handleMarkPaid}
                  onExportSummary={handleExport}
                />
              ))
            )}
          </div>
        )}
      </div>

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 bg-white border rounded-xl shadow-lg px-4 py-3 flex items-center gap-2 animate-in slide-in-from-bottom-5"
          style={{ borderColor: toast.color }}
        >
          <Sparkles className="w-4 h-4" style={{ color: toast.color }} />
          <p className="text-sm font-bold" style={{ color: toast.color }}>{toast.msg}</p>
        </div>
      )}
    </div>
  );
}

/** Fetches entries lazily per settlement row — avoids a massive up-front fetch. */
function SettlementRowWithEntries({ batch, onMarkPaid, onExportSummary }) {
  const { data: entries = [] } = useQuery({
    queryKey: ["settlement-entries", batch.id],
    queryFn: () => base44.entities.CommissionLedger.filter({ settlement: batch.id }, "-created_date", 200),
  });
  return <SettlementRow batch={batch} entries={entries} onMarkPaid={onMarkPaid} onExportSummary={onExportSummary} />;
}