import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Fingerprint, Search, X, Plane } from "lucide-react";
import { STATUS_META, CARD_TYPE_META } from "@/lib/atiCard";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";

function StatusChip({ status }) {
  const s = STATUS_META[status] || STATUS_META.issued;
  return (
    <span className="text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
  );
}

export default function CardRegistry() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["ati-cards"],
    queryFn: () => base44.entities.ATICard.list("-created_date", 200),
  });

  const filtered = useMemo(() => cards.filter(c => {
    const q = search.toLowerCase();
    if (q && !`${c.public_card_code} ${c.aircraft_label} ${c.aircraft_registration}`.toLowerCase().includes(q)) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (typeFilter && c.card_type !== typeFilter) return false;
    return true;
  }), [cards, search, statusFilter, typeFilter]);

  const stats = useMemo(() => ({
    total: cards.length,
    active: cards.filter(c => ["issued", "active", "shared", "engaged"].includes(c.status)).length,
    converted: cards.filter(c => c.status === "converted").length,
    disputed: cards.filter(c => c.status === "disputed").length,
  }), [cards]);

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Registry · ATI Cards</p>
        <div className="flex items-center gap-3 mt-1">
          <div className="w-9 h-9 rounded-md bg-[#0B2D5B] flex items-center justify-center">
            <Fingerprint className="w-5 h-5 text-[#E8A83A]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight uppercase">ATI Card Registry</h1>
            <p className="text-[#6B6560] text-sm">Every ATI card — unique ID, lifecycle, ownership chain</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-10 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Cards", value: stats.total, color: "#0B2D5B" },
            { label: "Active Chain", value: stats.active, color: "#0F7A56" },
            { label: "Converted", value: stats.converted, color: "#E8A83A" },
            { label: "Disputed", value: stats.disputed, color: "#C0392B" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-black/[0.07] rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAA49C]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search card code, registration, aircraft…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-black/10 rounded-xl text-sm text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:border-[#0B2D5B]" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAA49C]"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <BottomSheetSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: "", label: "All statuses" }, ...Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label }))]}
            placeholder="All statuses"
          />
          <BottomSheetSelect
            label="Type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[{ value: "", label: "All types" }, ...Object.entries(CARD_TYPE_META).map(([k, v]) => ({ value: k, label: v.label }))]}
            placeholder="All types"
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
          {isLoading ? (
            [...Array(6)].map((_, i) => <div key={i} className="h-16 border-b border-black/[0.05] animate-pulse bg-black/[0.02]" />)
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-[#AAA49C]">
              <Fingerprint className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No cards yet</p>
              <p className="text-[11px] mt-1">Generate an ATI score on any listing to issue a card</p>
            </div>
          ) : (
            filtered.map(c => (
              <Link
                key={c.id}
                to={`/ati-passport/${c.listing}`}
                className="flex items-center gap-3 px-4 md:px-5 py-3.5 border-b border-black/[0.05] last:border-0 hover:bg-[#F7F4EF] transition-colors"
              >
                <div className="w-9 h-9 rounded-md bg-[#0B2D5B]/10 flex items-center justify-center shrink-0">
                  <Fingerprint className="w-4 h-4 text-[#0B2D5B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-mono text-[12px] md:text-[13px] font-black text-[#1A1814] truncate">{c.public_card_code}</p>
                    <StatusChip status={c.status} />
                  </div>
                  <p className="text-[11px] text-[#6B6560] truncate mt-0.5">
                    <Plane className="w-3 h-3 inline mr-1 -mt-0.5" />
                    {c.aircraft_label || "—"} {c.aircraft_registration && <span className="text-[#AAA49C]">· {c.aircraft_registration}</span>}
                  </p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold">{CARD_TYPE_META[c.card_type]?.label || c.card_type}</p>
                  <p className="text-[10px] text-[#AAA49C] mt-0.5">v{c.card_version} · {c.view_count || 0} views</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}