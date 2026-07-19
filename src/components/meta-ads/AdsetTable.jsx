import { Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

const ACTION_STYLES = {
  increase: { color: "#5dcaa5", icon: TrendingUp, label: "Increase" },
  decrease: { color: "#e24b4a", icon: TrendingDown, label: "Decrease" },
  hold: { color: "#888", icon: Minus, label: "Hold" },
  error: { color: "#f5c242", icon: AlertTriangle, label: "Error" },
};

export default function AdsetTable({ adsets, adjustments, loading, hasPreviewed }) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-white/30" />
      </div>
    );
  }

  if (adsets.length === 0) {
    return (
      <p className="text-[11px] text-white/35 text-center py-8">No ad sets found for this account.</p>
    );
  }

  const adjMap = {};
  for (const a of adjustments) adjMap[a.adsetId] = a;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[9px] uppercase tracking-wider text-white/30 border-b border-white/8">
            <th className="py-2 pr-3 font-bold">Ad Set</th>
            <th className="py-2 px-2 font-bold text-right">Budget</th>
            <th className="py-2 px-2 font-bold text-right">Spend</th>
            <th className="py-2 px-2 font-bold text-right">Leads</th>
            <th className="py-2 px-2 font-bold text-right">CPL</th>
            {hasPreviewed && <th className="py-2 px-2 font-bold text-center">Action</th>}
            {hasPreviewed && <th className="py-2 pl-2 font-bold text-right">New Budget</th>}
          </tr>
        </thead>
        <tbody>
          {adsets.map((adset) => {
            const adj = adjMap[adset.id];
            const isActive = adset.status === "ACTIVE";
            return (
              <tr key={adset.id} className="border-b border-white/5 hover:bg-white/2">
                <td className="py-2.5 pr-3">
                  <p className="text-[11px] font-semibold text-white/80 truncate max-w-[180px]">{adset.name}</p>
                  <p className="text-[9px] text-white/30">{adset.status}</p>
                </td>
                <td className="py-2.5 px-2 text-right text-[11px] text-white/60">
                  {adset.dailyBudget != null ? `$${adset.dailyBudget.toFixed(2)}` : "—"}
                </td>
                <td className="py-2.5 px-2 text-right text-[11px] text-white/60">
                  ${adset.spend.toFixed(2)}
                </td>
                <td className="py-2.5 px-2 text-right text-[11px] text-white/60">{adset.leads}</td>
                <td className="py-2.5 px-2 text-right text-[11px] text-white/60">
                  {adset.costPerLead != null ? `$${adset.costPerLead.toFixed(2)}` : "—"}
                </td>
                {hasPreviewed && (
                  <td className="py-2.5 px-2 text-center">
                    {adj ? <ActionBadge action={adj.action} /> : <span className="text-[9px] text-white/20">—</span>}
                  </td>
                )}
                {hasPreviewed && (
                  <td className="py-2.5 pl-2 text-right">
                    {adj && adj.action !== "hold" ? (
                      <span className="text-[11px] font-bold" style={{ color: ACTION_STYLES[adj.action]?.color || "#888" }}>
                        ${adj.newBudget.toFixed(2)}
                        <span className="text-[9px] ml-1">
                          ({adj.changePct > 0 ? "+" : ""}{adj.changePct}%)
                        </span>
                      </span>
                    ) : (
                      <span className="text-[9px] text-white/20">—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ActionBadge({ action }) {
  const style = ACTION_STYLES[action] || ACTION_STYLES.hold;
  const Icon = style.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
      style={{ background: `${style.color}15`, color: style.color, border: `0.5px solid ${style.color}30` }}
    >
      <Icon className="w-2.5 h-2.5" /> {style.label}
    </span>
  );
}