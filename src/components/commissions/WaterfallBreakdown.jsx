import { ROLE_META, WATERFALL } from "@/lib/commission";
import { Layers } from "lucide-react";

/**
 * Visual breakdown of the 3-level waterfall — shows % split + payee per level.
 * Pass computed `levels` from computeWaterfall().
 */
export default function WaterfallBreakdown({ levels = [], pool = 0, currency = "USD" }) {
  const fmt = (n) => `${currency === "USD" ? "$" : ""}${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-white border border-black/[0.07] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-4 h-4 text-[#E8A83A]" />
        <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#E8A83A]">Waterfall Split</p>
        <span className="text-[10px] text-[#AAA49C] ml-auto">Pool: {fmt(pool)}</span>
      </div>

      {levels.length === 0 ? (
        <p className="text-sm text-[#AAA49C] text-center py-4">No commissions computed yet.</p>
      ) : (
        <div className="space-y-2">
          {levels.map((l, i) => {
            const meta = ROLE_META[l.role] || { label: l.role, color: "#6B6560" };
            return (
              <div key={i} className="flex items-center gap-3 bg-[#F7F4EF] rounded-lg p-3">
                <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-white font-black text-xs"
                  style={{ backgroundColor: meta.color }}>
                  L{l.level}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-black text-[#1A1814]">{meta.label}</p>
                  <p className="text-[10px] text-[#6B6560] truncate">
                    {l.payee_email}
                    {l.payee_slug && <span className="font-mono text-[#0B2D5B] ml-1">· {l.payee_slug}</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-black text-[#1A1814]">{fmt(l.amount)}</p>
                  <p className="text-[10px] text-[#AAA49C] font-semibold">{l.percentage.toFixed(0)}%</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-black/[0.06] flex items-center gap-4 text-[10px] text-[#AAA49C]">
        <span>Platform: {(WATERFALL.ISSUER_PLATFORM * 100).toFixed(0)}%</span>
        <span>Marketplace: {(WATERFALL.MARKETPLACE * 100).toFixed(0)}%</span>
        <span>Broker: {(WATERFALL.BROKER * 100).toFixed(0)}%</span>
        <span>Sub: {(WATERFALL.SUB_BROKER * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}