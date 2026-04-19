import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Zap, ArrowDownCircle, ArrowUpCircle, Gift } from "lucide-react";
import { format } from "date-fns";
import { toCredits, TOKEN_COSTS, CREDIT_RATIO } from "@/lib/pricing";

const FEATURE_LABELS = {
  ati_passport_full: "Full ATI Passport",
  ati_passport_preview: "ATI Preview",
  bulk_import_per_listing: "Bulk import (per listing)",
  bulk_import: "Bulk import",
  deal_radar_refresh: "Deal Radar refresh",
  lead_export: "Lead export",
  branded_pdf: "Branded PDF",
};

function typeIcon(t) {
  if (t === "purchase") return { icon: ArrowUpCircle, color: "#0F7A56", label: "Purchase" };
  if (t === "bonus") return { icon: Gift, color: "#D4A017", label: "Bonus" };
  if (t === "refund") return { icon: ArrowUpCircle, color: "#185FA5", label: "Refund" };
  return { icon: ArrowDownCircle, color: "#6B6560", label: "Usage" };
}

export function CreditPricingTable() {
  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-black/[0.05] flex items-center gap-2">
        <Zap className="w-4 h-4 text-[#D4A017]" />
        <h3 className="text-sm font-black text-[#1A1814]">Credit price list</h3>
        <span className="text-[10px] text-[#AAA49C] ml-auto">1 token = {CREDIT_RATIO} credits</span>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-[#F7F4EF] text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold">
          <tr>
            <th className="text-left px-5 py-2.5">Action</th>
            <th className="text-right px-5 py-2.5">Tokens</th>
            <th className="text-right px-5 py-2.5">Credits</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(TOKEN_COSTS).map(([k, v]) => (
            <tr key={k} className="border-t border-black/[0.05]">
              <td className="px-5 py-2.5 text-[#1A1814] font-medium">{FEATURE_LABELS[k] || k}</td>
              <td className="px-5 py-2.5 text-right text-[#6B6560] font-mono">{v}</td>
              <td className="px-5 py-2.5 text-right font-black text-[#D4A017]">{toCredits(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CreditUsageTable({ userEmail }) {
  const { data: txs = [], isLoading } = useQuery({
    queryKey: ["token-transactions", userEmail],
    queryFn: () => base44.entities.TokenTransaction.filter({ user_email: userEmail }, "-created_date", 50),
    enabled: !!userEmail,
  });

  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-black/[0.05] flex items-center gap-2">
        <Zap className="w-4 h-4 text-[#D4A017]" />
        <h3 className="text-sm font-black text-[#1A1814]">Credit history</h3>
        <span className="text-[10px] text-[#AAA49C] ml-auto">{txs.length} transactions</span>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-[#AAA49C] text-sm">Loading…</div>
      ) : txs.length === 0 ? (
        <div className="p-8 text-center text-[#AAA49C]">
          <Zap className="w-8 h-8 mx-auto opacity-30 mb-2" />
          <p className="text-sm">No activity yet</p>
          <p className="text-[11px]">Buy a pack or use a feature to see your history here.</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-[#F7F4EF] text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold">
            <tr>
              <th className="text-left px-5 py-2.5">Date</th>
              <th className="text-left px-5 py-2.5">Action</th>
              <th className="text-left px-5 py-2.5">Type</th>
              <th className="text-right px-5 py-2.5">Credits</th>
              <th className="text-right px-5 py-2.5">Balance</th>
            </tr>
          </thead>
          <tbody>
            {txs.map(tx => {
              const meta = typeIcon(tx.type);
              const credits = toCredits(Math.abs(tx.amount));
              const sign = tx.amount >= 0 ? "+" : "−";
              return (
                <tr key={tx.id} className="border-t border-black/[0.05] hover:bg-[#F7F4EF]/50">
                  <td className="px-5 py-2.5 text-[11px] text-[#6B6560]">{tx.created_date ? format(new Date(tx.created_date), "MMM d, HH:mm") : "—"}</td>
                  <td className="px-5 py-2.5 text-[#1A1814] font-medium">
                    {tx.pack || FEATURE_LABELS[tx.feature] || tx.feature || "—"}
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: meta.color }}>
                      <meta.icon className="w-3.5 h-3.5" /> {meta.label}
                    </span>
                  </td>
                  <td className={`px-5 py-2.5 text-right font-black ${tx.amount >= 0 ? "text-[#0F7A56]" : "text-[#C0392B]"}`}>
                    {sign}{credits.toLocaleString()}
                  </td>
                  <td className="px-5 py-2.5 text-right text-[#6B6560] font-mono text-[12px]">
                    {tx.balance_after != null ? toCredits(tx.balance_after).toLocaleString() : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}