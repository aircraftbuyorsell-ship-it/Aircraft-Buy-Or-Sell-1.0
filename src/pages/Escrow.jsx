import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Handshake, Search, Plus, Shield, TrendingUp, CircleDollarSign } from "lucide-react";
import NewEscrowModal from "@/components/escrow/NewEscrowModal";
import EscrowDrawer from "@/components/escrow/EscrowDrawer";
import EscrowStatusBadge from "@/components/escrow/EscrowStatusBadge";
import EscrowPartnerBadge, { EscrowPartnerBadgeInline } from "@/components/escrow/EscrowPartnerBadge";
import DealCalculator from "@/components/escrow/DealCalculator";
import SettlementRoadmap from "@/components/escrow/SettlementRoadmap";
import { formatMoney, ESCROW_STATUS } from "@/lib/escrow";

const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const W3 = "rgba(255,255,255,0.35)";
const BORDER = "rgba(255,255,255,0.08)";
const AMBER = "#f5c242";
const TEAL = "#5dcaa5";
const RED = "#e24b4a";
const BLUE = "#4e8ef7";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: AMBER }}>{children}</p>;
}

function StatBox({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `0.5px solid ${BORDER}` }}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: W3 }}>{label}</p>
      </div>
      <p className="text-2xl font-black mt-1" style={{ color }}>{value}</p>
    </div>
  );
}

function Row({ tx, onClick }) {
  return (
    <div
      onClick={() => onClick(tx)}
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 md:px-6 py-4 transition-colors cursor-pointer border-b last:border-0"
      style={{ borderBottomColor: BORDER }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold truncate" style={{ color: W1 }}>{tx.aircraft_label || "Aircraft"}</p>
          <EscrowStatusBadge status={tx.status} />
          {tx.escrow_provider === "escrow_com" && (
            <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,194,66,0.09)", color: AMBER, border: `0.5px solid rgba(245,194,66,0.22)` }}>
              Escrow.com
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 mt-1">
          <span className="text-[11px]" style={{ color: W2 }}>{tx.buyer_name || "—"} → {tx.seller_name || "—"}</span>
          {tx.broker_name && <span className="text-[11px]" style={{ color: W3 }}>Broker: {tx.broker_name}</span>}
        </div>
      </div>
      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-0.5 shrink-0">
        <p className="text-base font-black" style={{ color: W1 }}>{formatMoney(tx.sale_amount, tx.currency)}</p>
        <p className="text-[11px] font-semibold" style={{ color: AMBER }}>
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
    staleTime: 60_000,
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
    <div className="min-h-screen" style={{ background: "transparent" }}>
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <GoldLabel>IntraZone · Transparent Hustle</GoldLabel>
          <EscrowPartnerBadgeInline />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase" style={{ color: W1 }}>
              Decentralized Transaction Options
            </h1>
            <p className="text-sm mt-0.5" style={{ color: W2 }}>
              Lock in finder's fee %, secure funds, protect every professional in the deal.
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-opacity hover:opacity-90 shrink-0"
            style={{ background: AMBER, color: "#04060a" }}
          >
            <Plus className="w-4 h-4" />
            New Transaction
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-5">
        {/* Partnership trust strip */}
        <EscrowPartnerBadge />

        <SettlementRoadmap />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatBox icon={Handshake} label="Active Deals" value={stats.active} color={BLUE} />
          <StatBox icon={Shield} label="Closed · Paid" value={stats.closed} color={TEAL} />
          <StatBox icon={CircleDollarSign} label="In Escrow" value={formatMoney(stats.inEscrow)} color={W1} />
          <StatBox icon={TrendingUp} label="Fees Earned" value={formatMoney(stats.totalFees)} color={AMBER} />
        </div>

        {/* Deal Calculator */}
        <DealCalculator />

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: W3 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search aircraft, buyer, seller, broker…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", border: `0.5px solid ${BORDER}`, color: W1 }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: `0.5px solid ${BORDER}`, color: W2 }}
          >
            <option value="">All statuses</option>
            {Object.entries(ESCROW_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* List */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: `0.5px solid ${BORDER}` }}>
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: `0.5px solid ${BORDER}` }}>
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded animate-pulse w-1/2" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <div className="h-3 rounded animate-pulse w-1/3" style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>
                <div className="h-5 w-16 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16" style={{ color: W3 }}>
              <Handshake className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No escrow transactions yet</p>
              <button
                onClick={() => setShowNew(true)}
                className="mt-3 text-[11px] font-bold uppercase tracking-wider hover:underline"
                style={{ color: AMBER }}
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