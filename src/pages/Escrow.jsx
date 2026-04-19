import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Handshake, Search, Plus, Shield, TrendingUp, CircleDollarSign } from "lucide-react";
import NewEscrowModal from "@/components/escrow/NewEscrowModal";
import EscrowDrawer from "@/components/escrow/EscrowDrawer";
import EscrowStatusBadge from "@/components/escrow/EscrowStatusBadge";
import { formatMoney, ESCROW_STATUS } from "@/lib/escrow";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">{children}</p>;
}

function StatBox({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white border border-black/[0.07] rounded-xl p-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">{label}</p>
      </div>
      <p className="text-2xl font-black mt-1" style={{ color }}>{value}</p>
    </div>
  );
}

function Row({ tx, onClick }) {
  return (
    <div
      onClick={() => onClick(tx)}
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 md:px-6 py-4 hover:bg-[#F7F4EF] transition-colors cursor-pointer border-b border-black/[0.05] last:border-0"
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-[#1A1814] truncate">{tx.aircraft_label || "Aircraft"}</p>
          <EscrowStatusBadge status={tx.status} />
          {tx.escrow_provider === "escrow_com" && (
            <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[rgba(232,168,58,0.12)] text-[#A67C00] border border-[rgba(232,168,58,0.3)]">
              Escrow.com
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 mt-1">
          <span className="text-[11px] text-[#6B6560]">{tx.buyer_name || "—"} → {tx.seller_name || "—"}</span>
          {tx.broker_name && <span className="text-[11px] text-[#AAA49C]">Broker: {tx.broker_name}</span>}
        </div>
      </div>
      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-0.5 shrink-0">
        <p className="text-base font-black text-[#1A1814]">{formatMoney(tx.sale_amount, tx.currency)}</p>
        <p className="text-[11px] font-semibold text-[#E8A83A]">
          Fee {tx.finders_fee_pct || 0}% · {formatMoney(tx.finders_fee_amount, tx.currency)}
        </p>
      </div>
    </div>
  );
}

export default function Escrow() {
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["escrow-transactions"],
    queryFn: () => base44.entities.EscrowTransaction.list("-created_date", 200),
  });

  const filtered = useMemo(() => transactions.filter(t => {
    const q = search.toLowerCase();
    if (q && !`${t.aircraft_label} ${t.buyer_name} ${t.seller_name} ${t.broker_name}`.toLowerCase().includes(q)) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    return true;
  }), [transactions, search, statusFilter]);

  const stats = useMemo(() => {
    const active = transactions.filter(t => !["closed", "cancelled", "disputed"].includes(t.status));
    const closed = transactions.filter(t => t.status === "closed");
    const totalFees = closed.reduce((s, t) => s + (t.finders_fee_amount || 0), 0);
    const inEscrow = active.reduce((s, t) => s + (t.sale_amount || 0), 0);
    return {
      active: active.length,
      closed: closed.length,
      totalFees,
      inEscrow,
    };
  }, [transactions]);

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <GoldLabel>IntraZone · Transparent Hustle</GoldLabel>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight uppercase">
              Escrow & Hustle Contracts
            </h1>
            <p className="text-[#6B6560] text-sm mt-0.5">
              Lock in finder's fee %, secure funds, protect every professional in the deal.
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-[#0B2D5B] hover:bg-[#143C75] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Transaction
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatBox icon={Handshake} label="Active Deals" value={stats.active} color="#0B2D5B" />
          <StatBox icon={Shield} label="Closed · Paid" value={stats.closed} color="#0F7A56" />
          <StatBox icon={CircleDollarSign} label="In Escrow" value={formatMoney(stats.inEscrow)} color="#1A1814" />
          <StatBox icon={TrendingUp} label="Fees Earned" value={formatMoney(stats.totalFees)} color="#E8A83A" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAA49C]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search aircraft, buyer, seller, broker…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-black/10 rounded-xl text-sm text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:border-[#0B2D5B] transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-black/10 rounded-xl text-sm text-[#6B6560] focus:outline-none focus:border-[#0B2D5B]"
          >
            <option value="">All statuses</option>
            {Object.entries(ESCROW_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* List */}
        <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-black/[0.05]">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-black/5 rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-black/5 rounded animate-pulse w-1/3" />
                </div>
                <div className="h-5 w-16 bg-black/5 rounded-full animate-pulse" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-[#AAA49C]">
              <Handshake className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No escrow transactions yet</p>
              <button
                onClick={() => setShowNew(true)}
                className="mt-3 text-[11px] text-[#0B2D5B] font-bold uppercase tracking-wider hover:underline"
              >
                + Create your first deal
              </button>
            </div>
          ) : (
            filtered.map(tx => <Row key={tx.id} tx={tx} onClick={setSelected} />)
          )}
        </div>
      </div>

      {showNew && (
        <NewEscrowModal
          onClose={() => setShowNew(false)}
          onCreated={(tx) => { setShowNew(false); setSelected(tx); }}
        />
      )}
      {selected && <EscrowDrawer tx={transactions.find(t => t.id === selected.id) || selected} onClose={() => setSelected(null)} />}
    </div>
  );
}