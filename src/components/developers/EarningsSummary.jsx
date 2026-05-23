import { Coins, TrendingUp, Zap, Clock } from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className={`rounded-2xl border p-5 flex items-start gap-4 ${accent}`}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/60">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider font-bold opacity-70 mb-0.5">{label}</p>
        <p className="text-2xl font-black leading-tight">{value}</p>
        {sub && <p className="text-[11px] opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function EarningsSummary({ account, invocations, tools }) {
  const totalEarned  = account.total_earnings_tokens || 0;
  const totalPaid    = account.total_paid_out_tokens  || 0;
  const unpaid       = totalEarned - totalPaid;
  const totalCalls   = invocations.length;
  const successCalls = invocations.filter(i => i.status === "success").length;

  // Per-tool breakdown
  const toolMap = Object.fromEntries(tools.map(t => [t.id, t.name]));
  const byTool = invocations.reduce((acc, inv) => {
    const name = toolMap[inv.tool_integration_id] || inv.tool_name || inv.tool_integration_id;
    if (!acc[name]) acc[name] = { calls: 0, earned: 0 };
    acc[name].calls++;
    acc[name].earned += inv.developer_revenue || 0;
    return acc;
  }, {});

  const topTools = Object.entries(byTool)
    .sort((a, b) => b[1].earned - a[1].earned)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Coins}     label="Total Earned"  value={`${totalEarned} tk`}  sub="Cumulative tokens"        accent="border-[#E8A83A]/30 bg-[#E8A83A]/10 text-[#A67C00]" />
        <StatCard icon={Clock}     label="Unpaid Balance" value={`${unpaid} tk`}       sub="Awaiting settlement"      accent="border-purple-200 bg-purple-50 text-purple-700" />
        <StatCard icon={TrendingUp} label="Total Calls"  value={totalCalls}            sub={`${successCalls} succeeded`} accent="border-green-200 bg-green-50 text-green-700" />
        <StatCard icon={Zap}       label="Active Tools"  value={tools.filter(t => t.status === "active").length} sub={`of ${tools.length} submitted`} accent="border-[#0B2D5B]/15 bg-[#0B2D5B]/5 text-[#0B2D5B]" />
      </div>

      {/* Top tools */}
      {topTools.length > 0 && (
        <div className="rounded-2xl border border-black/8 bg-white p-5">
          <h3 className="font-black text-sm uppercase tracking-wide text-[#1A1814] mb-3">Top Tools by Earnings</h3>
          <div className="space-y-2">
            {topTools.map(([name, stats]) => {
              const pct = totalEarned > 0 ? (stats.earned / totalEarned) * 100 : 0;
              return (
                <div key={name} className="flex items-center gap-3">
                  <p className="text-sm font-bold text-[#1A1814] w-36 truncate flex-shrink-0">{name}</p>
                  <div className="flex-1 h-2 bg-[#F7F4EF] rounded-full overflow-hidden">
                    <div className="h-full bg-[#E8A83A] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs font-black text-[#A67C00] w-20 text-right">{stats.earned.toFixed(1)} tk</p>
                  <p className="text-xs text-[#AAA49C] w-16 text-right">{stats.calls} calls</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}