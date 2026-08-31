import { Coins, TrendingUp, Zap, Clock } from "lucide-react";

const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const W3 = "rgba(255,255,255,0.35)";
const BORDER = "rgba(255,255,255,0.08)";
const AMBER = "#f5c242";
const TEAL = "#5dcaa5";
const BLUE = "#4e8ef7";
const CARD = "rgba(255,255,255,0.04)";

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: accent.bg, border: `0.5px solid ${accent.border}`, color: accent.text }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
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
        <StatCard icon={Coins}     label="Total Earned"   value={`${totalEarned} tk`}  sub="Cumulative tokens"         accent={{ bg: "rgba(245,194,66,0.06)", border: "rgba(245,194,66,0.22)", text: AMBER }} />
        <StatCard icon={Clock}     label="Unpaid Balance" value={`${unpaid} tk`}       sub="Awaiting settlement"       accent={{ bg: "rgba(168,85,247,0.06)", border: "rgba(168,85,247,0.20)", text: "#a855f7" }} />
        <StatCard icon={TrendingUp} label="Total Calls"   value={totalCalls}           sub={`${successCalls} succeeded`} accent={{ bg: "rgba(93,202,165,0.06)", border: "rgba(93,202,165,0.20)", text: TEAL }} />
        <StatCard icon={Zap}       label="Active Tools"   value={tools.filter(t => t.status === "active").length} sub={`of ${tools.length} submitted`} accent={{ bg: "rgba(78,142,247,0.06)", border: "rgba(78,142,247,0.20)", text: BLUE }} />
      </div>

      {topTools.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: CARD, border: `0.5px solid ${BORDER}` }}>
          <h3 className="font-black text-sm uppercase tracking-wide mb-3" style={{ color: W1 }}>Top Tools by Earnings</h3>
          <div className="space-y-2">
            {topTools.map(([name, stats]) => {
              const pct = totalEarned > 0 ? (stats.earned / totalEarned) * 100 : 0;
              return (
                <div key={name} className="flex items-center gap-3">
                  <p className="text-sm font-bold w-36 truncate flex-shrink-0" style={{ color: W1 }}>{name}</p>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: AMBER }} />
                  </div>
                  <p className="text-xs font-black w-20 text-right" style={{ color: AMBER }}>{stats.earned.toFixed(1)} tk</p>
                  <p className="text-xs w-16 text-right" style={{ color: W3 }}>{stats.calls} calls</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}